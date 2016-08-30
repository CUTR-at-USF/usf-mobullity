/* This program is free software: you can redistribute it and/or
   modify it under the terms of the GNU Lesser General Public License
   as published by the Free Software Foundation, either version 3 of
   the License, or (at your option) any later version.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>. 
*/

otp.namespace("otp.widgets");

otp.widgets.Widget = otp.Class({
    
    id              : null,
    owner           : null,
    mainDiv         : null,
    header          : null,
    headerClass		: null,	 // custom css header class
    minimizedTab    : null,
    customHeader	: false, // custom header option
    // fields that can be set via the options parameter, and default values:
    draggable       : true,
    minimizable     : false,
    closeable       : true,
    resizable       : false,
    showHeader      : true,
    title           : '', // string
    openInitially   : true, 
    persistOnClose  : false, // whether widget can be opened via 'toolbar' dropdown when closed
    transparent     : false, // whether to hide the default gray background / frame

    isOpen          : true, // whether or not widget is displayed in applicable module view
    isMinimized     : false,

    
    initialize : function(id, owner, options) {
        
        if(typeof options !== 'undefined') {
            _.extend(this, options);
        }

        this.id = id;        
        this.owner = owner;

        this.owner.addWidget(this);

        // set up the main widget DOM element:
        this.mainDiv = $('<div />').attr('id', id).addClass('otp-widget').appendTo('body');
        if(!this.transparent) this.mainDiv.addClass('otp-widget-nonTransparent');
        this.mainDiv.addClass('enable-pinch');


        if(!this.openInitially) {
            this.isOpen = false;
            this.mainDiv.css('display','none');
        }
        
        if(typeof this.cssClass !== 'undefined') {
            this.mainDiv.addClass(this.cssClass);
        }
        
        if(this.resizable){ this.mainDiv.resizable(); }
        
        // Use a custom header class (added headerClass to point to the correct css class)
        if(this.customHeader && this.headerClass != null){ this.addmyHeader(this.headerClass); }
        else{ if(this.showHeader) this.addHeader(); }
        
        var this_ = this;
        if(this.draggable) {
            this.mainDiv.draggable({ 
                containment: "#map",
                start: function(event, ui) {
                    $(this_.mainDiv).css({'bottom' : 'auto', 'right' : 'auto'});
                },
                cancel: '.notDraggable'
            });
        }

        var ham = new Hammer( $(this.mainDiv)[0], {
          touchAction: 'auto'
        });

        ham.get('pan').set({ direction: Hammer.DIRECTION_ALL });
        ham.get('pinch').set({ enable: true });

        ham.on('pinch', function(e) {

            dom = $(this_.mainDiv)[0];

            mre = /scale\((\d),\s*(\d)\)/i;
            m = dom.style.transform.match(mre);
            my = mx = (e.scale > 2) ? 2 : e.scale;
          
            var matrix_re = /(\d\.*\d*),\w*\d\.*\d*,\w*\d\.*\d*,\w*(\d\.*\d*),\w*(\d\.*\d*),\w*(\d\.*\d*)/;

            m = dom.style.transform.match(matrix_re);
            if (m != null) {
                m = [parseFloat(m[1]), 0, 0, parseFloat(m[2]), parseFloat(m[3]), parseFloat(m[4])];
            }
            else m = [0,0,0,0,0,0];

            m[0] = mx;
            m[3] = my;
            $(dom).css({ 'transform': "matrix(" + m.join(',') + ")" });
      } );

    },
        
    addmyHeader : function(headerClass) {
        var this_ = this;
        //this.title = title;
        this.header = $('<div class="'+this.headerClass+'">'+this.title+'</div>').appendTo(this.mainDiv); 
        var buttons = $('<div class="otp-widget-header-buttons"></div>').appendTo(this.mainDiv);

        if(this.closeable) {
		    $("<div class='otp-widget-header-button'>&times;<div>").appendTo(buttons)
		    .click(function(evt) {
			    evt.preventDefault();
			    this_.close();
		    });				
		}
        if(this.minimizable) {
            $('<div class="otp-widget-header-button">&ndash;</div>').appendTo(buttons)
            .click(function(evt) {
			    evt.preventDefault();
                this_.minimize();
            });
        }

        // set up context menu
        this.contextMenu = new otp.core.ContextMenu(this.mainDiv, function() {
        });
        this.contextMenu.addItem("Minimize", function() {
            this_.minimize();
        }).addItem("Bring to Front", function() {
            this_.bringToFront();            
        }).addItem("Send to Back", function() {
            this_.sendToBack();            
        });
        
        this.header.dblclick(function() {
            this_.bringToFront();            
        });
    },
    
    addHeader : function() {
        var this_ = this;
        //this.title = title;
        this.header = $('<div class="otp-widget-header">'+this.title+'</div>').appendTo(this.mainDiv);
        var buttons = $('<div class="otp-widget-header-buttons"></div>').appendTo(this.mainDiv);

        if(this.closeable) {
		    $("<div class='otp-widget-header-button'>&times;<div>").appendTo(buttons)
		    .click(function(evt) {
			    evt.preventDefault();
			    this_.close();
		    });				
		}
        if(this.minimizable) {
            $('<div class="otp-widget-header-button">&ndash;</div>').appendTo(buttons)
            .click(function(evt) {
			    evt.preventDefault();
                this_.minimize();
            });
        }

        // set up context menu
        this.contextMenu = new otp.core.ContextMenu(this.mainDiv, function() {
        });
        this.contextMenu.addItem(otp.config.locale.contextMenu.minimize, function() {
            this_.minimize();
        }).addItem(otp.config.locale.contextMenu.bringToFront, function() {
            this_.bringToFront();            
        }).addItem(otp.config.locale.contextMenu.sendToBack, function() {
            this_.sendToBack();            
        });
        
        this.header.dblclick(function() {
            this_.bringToFront();            
        });
    },
    
    setTitle : function(title) {
        this.title = title;
        this.header.html(title);    
    },

    minimize : function() {
        var this_ = this;
        this.hide();
        
        // To close Layers widget in mobile only, whenever it's minimized also
        if(window.matchMedia("screen and (max-width: 768px)").matches && this.title.match(new RegExp("Layers"))) {
            this.close();
            return;
        }
        this.minimizedTab = $('<div class="otp-minimized-tab">'+this.title+'</div>')
        .appendTo($('#otp-minimize-tray'))
        .click(function () {
            this_.unminimize();
        });
        this.isMinimized = true;
        
        // To get Itineraries minimized tab placed after Trip planner tab in mobile only.
        if(window.matchMedia("screen and (max-width: 768px)").matches && this.title.match(new RegExp("Trip planner"))) {
            for (i in this.owner.getWidgetManager().widgets) {
                x = this.owner.getWidgetManager().widgets[i];
                if (x.title.match(new RegExp(".*Itineraries.*")) && x.isMinimized) {
                    x.minimizedTab.hide();
                    x.minimize();
                }
            }
        }
    },

    unminimize : function(tab) {
        this.isMinimized = false;
        this.show();
        this.minimizedTab.hide();
    },
    
    bringToFront : function() {
        var frontIndex = this.owner.getWidgetManager().getFrontZIndex();
        this.$().css("zIndex", frontIndex+1);
    },

    sendToBack : function() {
        var backIndex = this.owner.getWidgetManager().getBackZIndex();
        this.$().css("zIndex", backIndex-1);
    },
    
    center : function() {
        var left = $(window).width()/2 - this.$().width()/2;
        var top = $(window).height()/2 - this.$().height()/2;
 
        this.$().offset({ top : top, left: left });
    },

    centerX : function() {
        var left = $(window).width()/2 - this.$().width()/2;  
        this.$().offset({ left: left });
    },

    close : function() {
        if(typeof this.onClose === 'function') this.onClose();
        this.isOpen = false;
        this.hide();
    },
            
    setContent : function(htmlContent) {
        $('<div />').html(htmlContent).appendTo(this.mainDiv);
    },
    
    show : function() {
    
        var re = new RegExp(".*Itineraries.*");
        for (i in this.owner.getWidgetManager().widgets) {
            x = this.owner.getWidgetManager().widgets[i];
            
            if (x == this) continue;
            if (x.isMinimized) continue;
            
            if (x.title.match(new RegExp("Trip planner")) && this.title.match(re)) 
            {continue;}
            if (x.title.match(re)) {x.minimize(); continue;}
            
            if (x.isOpen) x.hide();
        }
        this.isOpen = true;
        if(this.isMinimized) this.unminimize();
        else this.mainDiv.fadeIn();

        if ('activated' in this) this.activated();
    },

    hide : function() {
        if(this.isMinimized) this.minimizedTab.hide();
        else this.mainDiv.fadeOut(); 
    },

    $ : function() {
        return this.mainDiv;
    },
    
    CLASS_NAME : "otp.widgets.Widget"
});


