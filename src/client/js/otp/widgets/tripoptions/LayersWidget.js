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

otp.namespace("otp.widgets.layers");

otp.widgets.LayersWidget = 
    otp.Class(otp.widgets.Widget, {

    module : null,
    minimumZoom : 15,
    
    toggle_bus_layer : function(rte) {
    	
    	var id = L.stamp( this.module.busLayers );
    	var obj = this.module.busLayers;

        var on_off = (obj.visible.indexOf(rte) != -1) ? "OFF" : "ON";
        logGAEvent('click', 'link', 'layers bullrunner ' + rte + ' ' + on_off);

    	if (obj.visible.indexOf(rte) != -1) { 
    		obj.visible.splice(obj.visible.indexOf(rte), 1);
    		$('#usf_'+rte+' .box').removeClass('active');
    	}
    	else {
    		obj.visible.push(rte);
    		$("#usf_"+rte+" .box").addClass('active');
    	}
    	
	// refresh the buslayer, and the stoplayer
    	obj.refresh();        
	webapp.modules[0].stopsLayer.refresh();

    },
        
    hideZoomError : function() {
        $('#zoom-notice').hide();
    },
    displayZoomError : function() {
        $('#zoom-notice').show();
    },

    initialize : function(id, module) {
    
        otp.widgets.Widget.prototype.initialize.call(this, id, module, {
			title : 'Layers',
			customHeader : true, // use a custom header
			headerClass: "otp-defaultTripWidget-header",
            cssClass : 'otp-layerView enable-pinch',
            closeable : false,
            resizable : false,
			draggable : false,
			minimizable : true,
            //openInitially : false,
            persistOnClose : true,
        });
        
        this.module = module;
        
        var this_ = this;

        ich['usf-layer-menu']({}).appendTo(this.mainDiv);

        // remove layer checkbox if config is disabled for i.e: busPositions
        if (this.module.stopsLayer == undefined) $('.otplayerView-inner .stops').remove();
        if (this.module.busLayers == undefined) $('.otp-layerView-inner .bus').remove();
        if (this.module.bikeLayers == undefined) $('.otp-layerView-inner .bikes').remove();
        
        // Layer group toggle code
        
	// Bullrunner bus stops+routes
        $('#usf_A').bind('click', {'this_': this}, function(ev) {
        	this_.toggle_bus_layer("A");
        });
        $('#usf_B').bind('click', {'this_': this}, function(ev) {
        	this_.toggle_bus_layer("B");        	        
        });
        $('#usf_C').bind('click', {'this_': this}, function(ev) {
        	this_.toggle_bus_layer("C");        	        
        });
        $('#usf_D').bind('click', {'this_': this}, function(ev) {
        	this_.toggle_bus_layer("D");        	        
        });
        $('#usf_E').bind('click', {'this_': this}, function(ev) {
        	this_.toggle_bus_layer("E");        	        
        });
        $('#usf_F').bind('click', {'this_': this}, function(ev) {
        	this_.toggle_bus_layer("F");        	        
        });
      
	// HART bus stops
	$('#bus_hart').bind('click', {'module': this.module}, function(ev) {

        var on_off = (otp.config.showHartBusStops) ? "OFF" : "ON";
        logGAEvent('click', 'link', 'layers hart stops ' + on_off);

		if (otp.config.showHartBusStops) {
			otp.config.showHartBusStops = false;
                        $("#bus_hart .box").removeClass('active');
		}
		else {
			otp.config.showHartBusStops = true;
			$("#bus_hart .box").addClass('active');
		}

		ev.data.module.stopsLayer.refresh();
	});
  
	// Bike rental layers
    $('#bike_stations').bind('click', {'module': this.module}, function(ev) {

        var id = L.stamp( ev.data.module.bikeLayers );

        var on_off = (ev.data.module.bikeLayers.visible) ? "OFF" : "ON";        	                	
        logGAEvent('click', 'link', 'layers bike stations ' + on_off);        	

       	if (ev.data.module.bikeLayers.visible) {
       		ev.data.module.bikeLayers.visible = false;
	   		$("#bike_stations .box").removeClass('active');
	    }
       	else {
       		ev.data.module.bikeLayers.visible = true;
	   		$("#bike_stations .box").addClass('active');
	    }
		
    	ev.data.module.bikeLayers.setMarkers(); // refresh
    });

    $('#bike_lanes').bind('click', {'module': this.module}, function(ev) {

        var on_off = (ev.data.module.bikeLanes.visible) ? "OFF" : "ON";       
        logGAEvent('click', 'link', 'layers bike lanes ' + on_off);

		if (ev.data.module.bikeLanes.visible) {
			ev.data.module.bikeLanes.visible = false;
			$("#bike_lanes .box").removeClass('active');
		}
		else { 
			ev.data.module.bikeLanes.visible = true;
			$("#bike_lanes .box").addClass('active');
		}

		ev.data.module.bikeLanes.refresh();               	
    });

        // dynamic static/poi layers
        for (x in otp.config.layersWidget) {
            opts = otp.config.layersWidget[x];

            this[opts['name'] + "_layer"] = L.layerGroup();
            this[opts['name'] + "_active"] = false;

            if (opts['type'] == "static") this.setLayerMarkers( opts, opts['locations'] );
            else if (opts['type'] == "poi") {
                $.ajax( otp.config.hostname + '/' + otp.config.restService + '/pois', {
                    dataType: 'JSON',
                    data: {query: opts['search']},
                    context: {'module': this, 'opts': opts},
                    success: function(data) {
                        locations = [];
                        for (x in data) locations.push.apply( locations, data[x] );
                        this.module.setLayerMarkers( this.opts, locations );
                    },
                });
            }

            $(opts['target']).bind('click', {'module': this, 'layer': opts}, function(ev) {

                var layerName = ev.data.layer['name'] + "_layer";
                var activeName = layerName + "_active";
                var isLayerActive = ev.data.module[ activeName ];
  
                if (isLayerActive) {
                    $(ev.data.layer['target'] + ' .box').removeClass('active');
                    $(ev.data.layer['target'] + ' .box').css('background-color', 'white');
                    webapp.map.lmap.removeLayer( ev.data.module[ layerName ] );
                }
                else {
                    $(ev.data.layer['target'] + ' .box').addClass('active');
                    $(ev.data.layer['target'] + ' .box').css('background-color', ev.data.layer['color']);
                    ev.data.module[ layerName ].addTo( webapp.map.lmap );
                }   

                ev.data.module[activeName] = ! ev.data.module[activeName];

                var on_off = (isLayerActive) ? "OFF" : "ON";
                logGAEvent('click', 'link', 'layers ' + ev.data.layer['name'] + ' ' + on_off);
            })
        }

        },

    setLayerMarkers: function(opts, locations) {
            for (y in locations) {
                y = locations[y];
 
                if ('tags' in y) {
                    vals = y['tags'];

                    if (y['locations'].split(";").length > 1) {
                        slat = 0; slng = 0;
                        num = y['locations'].split(";").length;

                        for (p_id in y['locations'].split(';')) {
                            p = y['locations'].split(';')[p_id];
                            slat += parseFloat(p.split(',')[0]);
                            slng += parseFloat(p.split(',')[1]);
                        }

                        latlng = [ slat/num, slng/num ];
                    }
                    else if (y['locations'].split(',').length > 1) {
                       v = y['locations'].split(',');
                       latlng = [ parseFloat(v[0]), parseFloat(v[1]) ];

                       vals['inTampaCampus'] = otp.config.usfTampaBounds.contains(L.latLng(latlng[0], latlng[1])) ? true : false;
                    }
                    else continue;

                    if ('condition' in opts && ! (opts['condition'] in y['tags'])) continue;

                }
                else {
                    latlng = [parseFloat(y[0]), parseFloat(y[1])];
                    vals = {};
                }

                marker =  L.marker(L.latLng(latlng[0], latlng[1]), {icon: opts['icon']} );
                marker._leaflet_id = L.stamp(marker);

                var html = false;
                if ('popup' in opts) html = opts['popup'];
                else if ('popupTemplate' in opts) {
                    html = ich[ opts['popupTemplate'] ]( vals ).html();
                }

                if (html != false) marker.bindPopup( html );

                this[ opts['name'] + "_layer" ].addLayer( marker );
            }
    
    },
    
});
