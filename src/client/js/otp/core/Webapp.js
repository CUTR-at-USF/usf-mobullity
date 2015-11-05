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

otp.namespace("otp.core");

otp.core.Webapp = otp.Class({
    map     : null,
    
    modules : [ ],
    moduleMenu : null,
    
    activeModule : null,
    
    widgetManager   : null,
    infoWidgets     : { },

    geocoders : [ ],
    
    transitIndex : null,
    
    urlParams : null,

    initialize : function() {
            
        // misc. housekeeping
        
        if(typeof console == 'undefined') console = { log: function(str) {} };
        $.support.cors = true;
        var this_ = this;
        
        otp.config.resourcePath = otp.config.resourcePath || "";


        // set the urlRoot variable, if needed
        /*if(!otp.config.urlRoot) {
            otp.config.urlRoot = window.location.pathname;
            if(otp.util.Text.endsWith(otp.config.urlRoot, "index.html"))
                otp.config.urlRoot = otp.config.urlRoot.substring(0, otp.config.urlRoot.length-10);
        }
        if(!otp.util.Text.endsWith(otp.config.urlRoot, "/"))
            otp.config.urlRoot += "/";
        console.log("urlRoot "+otp.config.urlRoot);*/

        // init url params
        this.urlParams = { };
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.search.substring(1);

        while (match = search.exec(query))
            this.urlParams[decode(match[1])] = decode(match[2]);
            
        
        // init siteUrl, if necessary
        
        if(typeof otp.config.siteUrl === 'undefined') {
            otp.config.siteUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
        }
            
        // Set Debug options
        if (this.urlParams.debug === 'false') {
            otp.debug.disable();
        } else if (otp.config.debug || this.urlParams.debug === 'true' || window.localStorage['otpDebug'] === 'true') {
            otp.debug.enable();
        } else if (this.urlParams.debug === 'false') {
            otp.debug.disable();
        }

        // set the logo & title
        
        if(otp.config.showLogo) {
          //$('<div id="logo"><a href="'+otp.config.siteURL+'"><img src="'+otp.config.logoGraphic+'" style="height:100%"></a></div>').appendTo('#branding');
            $(Mustache.render(otp.templates.img, { 
                src : otp.config.logoGraphic,
                style : 'height:100%',
                wrapLink : true,
                linkHref : otp.config.siteURL,
                wrapDiv : true,
                divId : 'logo'
            })).appendTo('#branding .logo');
            //console.log(img);
            //$(img).appendTo('#branding');
            /*$(Mustache.render(otp.templates.div, { id : 'logo' }))
            .append(Mustache.render(otp.templates.img, { src : otp.config.logoGraphic }))
            .appendTo('#branding');          */

        }
        
        if(otp.config.siteName !== undefined) {
            document.title = otp.config.siteName;
            if(otp.config.showTitle) {
                $("<div id='site-title'><a href='"+otp.config.siteURL+"'>"+otp.config.siteName+"</a></div>").appendTo('#branding .logo');
            }
        }

        
        // create the Webapp-owned objects
            
        this.map = new otp.core.Map(this);
        this.transitIndex = new otp.core.TransitIndex(this);
        this.widgetManager = new otp.widgets.WidgetManager();
        
        // create the info widgets and links along header bar
        if(otp.config.infoWidgets !== undefined && otp.config.infoWidgets.length > 0) {
            var nav = $('<nav id="main-menu" role="article">').appendTo('#branding');
            var ul = $('<ul>').appendTo(nav);

            for(var i=0; i<otp.config.infoWidgets.length; i++) {

                if(otp.config.infoWidgets[i] == undefined) continue;

                var id = "otp-infoWidget-"+i;

                var options = {};
                if(_.has(otp.config.infoWidgets[i], 'title')) options.title = otp.config.infoWidgets[i].title;
                if(_.has(otp.config.infoWidgets[i], 'cssClass')) options.cssClass = otp.config.infoWidgets[i].cssClass;

                this.infoWidgets[id] = new otp.widgets.InfoWidget(otp.config.infoWidgets[i].styleId,
                                                                  this, options, otp.config.infoWidgets[i].content);

            }
        }
        
        if(otp.config.geocoders) {
            for(var i=0; i<otp.config.geocoders.length; i++) {
                var gcConfig = otp.config.geocoders[i];
                console.log('init geocoder: '+gcConfig.name);
                //var geocoder = window[gcConfig.classname](gcConfig.url, gcConfig.addressParam);
                
                var gcClass = this.stringToFunction(gcConfig.className);
                var geocoder = new gcClass(gcConfig.url, gcConfig.addressParam);
                geocoder.name = gcConfig.name;
                //console.log(geocoder);
                
                this.geocoders.push(geocoder);
                //var geocoder = new otp.core.Geocoder(otp.config.geocoder.url, otp.config.geocoder.addressParam);
            }
        }
       
        //add locator button
        if(otp.config.locatorSwitch){
                var locatorHTML = '<div class="onoffswitch">';
                locatorHTML += '<input type="checkbox" id ="myonoffswitch" name="onoffswitch" class="onoffswitch-checkbox" checked>';
                locatorHTML += '<label class="onoffswitch-label" for="myonoffswitch">';
                locatorHTML += '<div class="onoffswitch-inner"></div>';
                locatorHTML += '<div class="onoffswitch-switch"></div>';
                locatorHTML += '</label>';
                locatorHTML += '</div>';
                $(locatorHTML).appendTo('#branding');
        }
        
        
        // create the widget manager menu & icon
        
        this.widgetManagerMenu = new otp.core.WidgetManagerMenu(this);

        var widgetManagerIcon = $('<div id="otp-widgetManager"></div>')
        .appendTo('#branding')
        .click(function(event) {
            this_.widgetManagerMenu.show(); // showWidgetManagerMenu();
        });
        
        
        // create the module selector
        
        if(otp.config.showModuleSelector && otp.config.modules.length > 1) {

            var selector = $('<select id="otp_moduleSelector"></select>').appendTo('#branding');
            selector.change(function() {
                this_.setActiveModule(this_.modules[this.selectedIndex]);
            });
                       
        }

        // initialize the modules 
        
        var authModules = [];
        if(this.urlParams['module'])
            console.log("startup module: "+this.urlParams['module'])
        if(otp.config.modules) {
            var defaultModule = null;
            for(var i=0; i<otp.config.modules.length; i++) {
                var modConfig = otp.config.modules[i];
                var modClass = this.stringToFunction(modConfig.className);
                var id =  modConfig.id || 'module'+i;
                var options = modConfig.options || {}; 
                var module = new modClass(this, id, options);
                module.config = modConfig;
                if(modConfig.defaultBaseLayer) module.defaultBaseLayer = modConfig.defaultBaseLayer;
                
                if(module.requiresAuth) {
                    authModules.push(module);
                    continue;
                }

                if(_.has(this.urlParams, 'module') && this.urlParams['module'] === module.id) {
                    defaultModule = module;
                }
                if(!defaultModule && modConfig.isDefault) {
                    defaultModule = module;
                }

                this.addModule(module);
            }
            if(!defaultModule) defaultModule = this.modules[0];
            if(defaultModule) this_.setActiveModule(defaultModule);
        }                



        // create the session manager, if needed
        if(authModules.length > 0) {
            
            var verifyLoginUrl, redirectUrl;
            for(var i = 0; i < authModules.length; i++) {
                var authModule = authModules[i];
                if(authModule.options.trinet_verify_login_url) {
                    if(authModule.config.isDefault || !verifyLoginUrl) verifyLoginUrl = authModules[i].options.trinet_verify_login_url;
                }
                if(authModule.options.module_redirect_url) {
                    if(authModule.config.isDefault || !redirectUrl) redirectUrl = authModules[i].options.module_redirect_url;
                }

            }

            this.sessionManager = new otp.core.TrinetSessionManager(this, verifyLoginUrl, redirectUrl, $.proxy(function() {
                var setActive = false;
                for(var i = 0; i < authModules.length; i++) {
                    var authModule = authModules[i];
                    var roleIndex = authModule.authUserRoles.indexOf(this.sessionManager.role);
                    if(roleIndex !== -1) {
                        this.addModule(authModule);
                        if((roleIndex === 0 || authModule.config.isDefault) && !setActive) {
                            this_.setActiveModule(authModule);
                            setActive = true;
                        }
                    }
                } 
            }, this));            
        }


        // add the spinner
        
        $(Mustache.render(otp.templates.img, {
            src: 'images/spinner.gif',
            wrapDiv: true,
            divId: 'otp-spinner'
        }));
                
        // retrieve a saved trip, if applicable
                //if(window.location.hash !== "")
                //        otp.util.DataStorage.retrieve(window.location.hash.replace("#", ""), this.activeModule);
        
     }, //end of initialize module
    
    addModule : function(module) {
        makeActive = typeof makeActive !== 'undefined' ? makeActive : false;
        this.modules.push(module);

        // add to selector dropdown
        var selector = $('#otp_moduleSelector');
        $('<option>'+module.moduleName+'</option>').appendTo(selector);
    },
    
    loadedTemplates: {}, 

    setActiveModule : function(module) {
        var this_ = this;
        //console.log("set active module: "+module.moduleName);
        if(this.activeModule != null) {
            this.activeModule.deselected();
            
            for(var i = 0; i < this.activeModule.widgets.length; i++) {
                this.activeModule.widgets[i].hide();
            }
        }
        
        $('#otp_toptitle').html(module.moduleName);
        
        for(var i = 0; i < module.widgets.length; i++) {
            if(module.widgets[i].isOpen) {
                console.log(" - showing widget: "+module.widgets[i].id);
                module.widgets[i].show();
            }
        }        
        
        if(!module.activated) {        
            if(module.templateFiles && module.templateFiles.length > 0) {
                var loadedTemplateCount = 0;
                for(var i = 0; i < module.templateFiles.length; i++) {
                    var templateFile = module.templateFiles[i];
                    if(templateFile in this.loadedTemplates) { // template loaded already
                        loadedTemplateCount++;
                        if(loadedTemplateCount === module.templateFiles.length) this_.activateModule(module);
                    }
                    else {
                        $.get(otp.config.resourcePath + 'js/' + templateFile)
                        .success(_.bind(function(data) {
                            $('<div style="display:none;"></div>').appendTo($("body")).html(data);
                            ich.grabTemplates();
                            this.webapp.loadedTemplates[this.templateFile] = true;
                            loadedTemplateCount++;
                            if(loadedTemplateCount === module.templateFiles.length) this_.activateModule(module);
                        }, { webapp: this, templateFile: templateFile }));
                    }
                }
            }
            else {
                this.activateModule(module);
            }         
        }
        else {
            this.moduleSelected(module);
        }

    },
    
    activateModule : function(module) {
        module.activate();
        if(_.has(this.urlParams, 'module') && this.urlParams.module == module.id) module.restore();
        this.moduleSelected(module);
        module.activated = true;
    },
    
    moduleSelected : function(module) {
        module.selected();
        this.map.activeModuleChanged(this.activeModule, module);    
        this.activeModule = module;
        var moduleIndex = this.modules.indexOf(this.activeModule);
        $('#otp_moduleSelector option:eq('+moduleIndex+')').prop('selected', true);
    },
          
          
    hideSplash : function() {
            $("#splash-text").hide();
            for(widgetId in this.infoWidgets) {
                this.infoWidgets[widgetId].hide();
            }
    },
        
    setBounds : function(bounds)
    {
            this.map.lmap.fitBounds(bounds);
    },
        
   
    mapClicked : function(event) {
        $(this.moduleMenu).hide();
        this.hideSplash();
        this.activeModule.handleClick(event);
    },
    
    mapBoundsChanged : function(event) {
        if(this.activeModule) this.activeModule.mapBoundsChanged(event);
    },
    
    addWidget : function(widget) {
        //this.widgets.push(widget);
        this.widgetManager.addWidget(widget);
    },
    
    getWidgetManager : function() {
        return this.widgetManager;
    },
    
    // TODO: move to Util library
    
    stringToFunction : function(str) {
        var arr = str.split(".");

        var fn = (window || this);
        for(var i = 0, len = arr.length; i < len; i++) {
            fn = fn[arr[i]];
        }

        if(typeof fn !== "function") {
            throw new Error("function not found");
        }

        return  fn;
    },

    CLASS_NAME : "otp.core.Webapp"
});
