/* This program is free software: you can redistribute it and/or
   modify it under the teMap.jsrms of the GNU Lesser General Public License
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

otp.core.Map = otp.Class({

    webapp          : null,

    lmap            : null,
    layerControl    : null,
    
    contextMenu             : null,
    contextMenuModuleItems  : null,
    contextMenuLatLng       : null,
   
    initialGeolocation : false,
    currentLocation : false,
    geolocateCallbacks : [], /* Array of [callback function, arguments] called upon every successful geolocation */
 
    baseLayers  : {},
	overLayMaps : {},
    
    initialize : function(webapp) {
        var this_ = this;
        this.webapp = webapp;
                
        //var baseLayers = {};
        var defaultBaseLayer = null;

        // http://stackoverflow.com/questions/19689715/what-is-the-best-way-to-detect-retina-support-on-a-device-using-javascript
        function isRetina(){
            return ((window.matchMedia && (window.matchMedia('only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx), only screen and (min-resolution: 75.6dpcm)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min--moz-device-pixel-ratio: 2), only screen and (min-device-pixel-ratio: 2)').matches)) || (window.devicePixelRatio && window.devicePixelRatio >= 2)) && /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
        }
 
        for(var i=0; i<otp.config.baseLayers.length; i++) { //otp.config.baseLayers.length-1; i >= 0; i--) {
            var layerConfig = otp.config.baseLayers[i];

            var layerProps = { };
            if(layerConfig.attribution) layerProps['attribution'] = layerConfig.attribution;
            if(layerConfig.subdomains) layerProps['subdomains'] = layerConfig.subdomains;

            if (isRetina()) layerConfig.tileUrl = layerConfig.tileUrl.replace("{retina}", "@2x");
            else layerConfig.tileUrl = layerConfig.tileUrl.replace("{retina}", "");

            var layer = new L.TileLayer(layerConfig.tileUrl, layerProps);
            L.stamp(layer);

            if ('overlayUrl' in layerConfig) {
                var hybLayer = L.layerGroup();
                L.stamp(hybLayer);
                hybLayer.addLayer( layer );
                hybLayer.addLayer( new L.TileLayer(layerConfig.overlayUrl, layerProps) );

                this.baseLayers[layerConfig.name] = hybLayer;     
            }
            else {
                this.baseLayers[layerConfig.name] = layer;
            }

            if(i == 0) defaultBaseLayer = layer;           
 
            if(typeof layerConfig.getTileUrl != 'undefined') {
                    layer.getTileUrl = otp.config.getTileUrl;
            }
        }
        
        var mapProps = { 
            layers  : [ defaultBaseLayer ],
            center : (otp.config.initLatLng || new L.LatLng(0,0)),
            zoom : (otp.config.initZoom || 2),
            zoomControl : false
        }
        if(otp.config.minZoom) mapProps['minZoom'] = otp.config.minZoom;  //_.extend(mapProps, { minZoom : otp.config.minZoom });
        if(otp.config.maxZoom) mapProps['maxZoom'] = otp.config.maxZoom; //_.extend(mapProps, { maxZoom : otp.config.maxZoom });
        
        // http://stackoverflow.com/questions/15671949/why-does-calling-leaflets-setzoom-twice-results-on-the-second-being-ignored
        if (L.DomUtil.TRANSITION) {
        	L.Map.addInitHook(function() {
        		L.DomEvent.on(this._mapPane, L.DomUtil.TRANSITION_END, function() {
        			var zoom = this._viewActions.shift();
        			if (zoom != undefined) {
        				this.setView(zoom[0], zoom[1]);
        			}
        		}, this);
        	});
        }
        
        L.Map.include(!L.DomUtil.TRANSITION ? {} : {
        	_viewActions: [],
        	queueView: function(latlng, zoom) {
        		if (!(location.href.includes("fromPlace") || location.href.includes("toPlace"))) {
        			if (this._animatingZoom) {
        				this._viewActions.push([latlng, zoom]);
        			}
        			else {
        				this.setView(latlng, zoom);
        			}
        		}
        	}
        });
		
        this.lmap = new L.Map('map', mapProps);        
		
	// Setup geolocation event	
	this.currentLocation = {'latlng': L.latLng(0,0) };
	this.lmap.on('locationfound', this.geoLocationFound);
	this._locationLayer = L.layerGroup();
	this._locationLayer.addTo(this.lmap);

	// Establish map boundaries from OTP
        var url = otp.config.hostname + '/' + otp.config.restService + '/metadata';
        $.ajax(url, {
            data: { routerId : otp.config.routerId },            
            dataType: 'JSON',
            
            success: function(data) {				
				otp.config.mapBoundary = new L.latLngBounds(new L.latLng(data.lowerLeftLatitude, data.lowerLeftLongitude), new L.latLng(data.upperRightLatitude, data.upperRightLongitude));
		
				if(otp.config.geoLocation) {
					this_.initialGeolocation = true;
					this_.lmap.locate({watch: true, enableHighAccuracy: true});
				}						
				
            }
        });		    
		           
        this.overLayMaps = { };
	   
        /* here are the controls for layers and zooming on the map */
        L.control.layers(this.baseLayers, this.overLayMaps).addTo(this.lmap);
        L.control.zoom({ position : 'topright' }).addTo(this.lmap);

        locate_control = L.Control.extend({
            options: {
                position: 'topright',
                markerStyle: {
                    color: '#136AEC',
                    fillColor: '#2A93EE',
                    fillOpacity: 0.7,
                    weight: 2,
                    opacity: 0.9,
                    radius: 5
                },
                icon: 'mdi mdi-crosshairs-gps',  // fa-location-arrow or fa-map-marker
                iconLoading: 'fa fa-spinner fa-spin',
            },
            onLocationError: function(err) {
                // this event is called in case of any location error
                // that is not a time out error.

                switch (err.code) {
                case 1: /* The HTML5 standard specifies err.PERMISSION_DENIED, leaflet does not pass this through */
                    alert("To see your real-time position on the map, please allow USF Maps to access your location");
                    break;
                default:
                    alert(err.message);
                }

            },
            _activate: function() {
                // We use our own location callback to handle drawing the marker, etc

                // Only start 1 locate() to work around Chromium bug
                if (this._map._locationWatchId == undefined) {
                    webapp.map.lmap.locate({watch:true, enableHighAccuracy: true});
                }

                if (webapp.map.currentLocation.latlng.lat != 0) {
                    webapp.map.lmap.panTo([webapp.map.currentLocation.latlng.lat, webapp.map.currentLocation.latlng.lng]);
                }
            },

            onAdd: function (map) {
                var container = L.DomUtil.create('div', 'leaflet-control-locate leaflet-bar leaflet-control');

                this._event = undefined;

                this._link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container);
                this._link.href = '#';
                this._icon = L.DomUtil.create('span', this.options.icon, this._link);

                L.DomEvent
                    .on(this._link, 'click', L.DomEvent.stopPropagation)
                    .on(this._link, 'click', L.DomEvent.preventDefault)
                    .on(this._link, 'click', function() {
                            this.start();
                    }, this);

                this.bindEvents(map);

                return container;
            },

            /**
             * Binds the actions to the map events.
             */
            bindEvents: function(map) {
                map.on('locationfound', this._onLocationFound, this);
                map.on('locationerror', this._onLocationError, this);
                map.on('unload', this.stop, this);
            },

            /**
             * Starts the plugin:
             * - activates the engine
             * - draws the marker (if coordinates available)
             */
            start: function() {
                this._activate();
            },

        });  
        this.locateControl = new locate_control(); 
    	this.locateControl.addTo(this.lmap); 
                
        /*var baseMaps = {
            'Base Layer' : tileLayer 
        };*/
        
        var overlays = { };
        
        if(typeof otp.config.overlayTileUrl != 'undefined') {
                    var overlayTileLayer = new L.TileLayer(otp.config.overlayTileUrl);
                    //this.lmap.addLayer(overlayTileLayer);
                    //overlays['Overlay'] = overlayTileLayer;
        }
        
        //this.layerControl = new L.Control.Layers(baseMaps, overlays);
        //this.layerControl.addTo(this.lmap);
        
        this.lmap.on('click', function(event) {
            webapp.mapClicked(event);        
        });

        this.lmap.on('viewreset', function(event) {
            webapp.mapBoundsChanged(event);        
        });

        this.lmap.on('dragend', function(event) {
            webapp.mapBoundsChanged(event);        
        });
        
        // setup context menu
        var this_ = this;
        
        this.contextMenu = new otp.core.MapContextMenu(this);
      
        this.activated = true;
        
    },
   
    /* sets a marker at the current location */
    geoLocationFound : function(e) {
     var this_ = webapp.map; // Since we are typically called from leaflet.on, 'this' will be from that context

	 if (this_.initialGeolocation) {		

       	// Only zoom in on location on initial geolocation
		// If the GPS is bad for some reason, and the user zooms, we would reset the view once this callback fires unless we track the initial call as below.
		this_.initialGeolocation = false;

		// 40 accuracy for wifi, 22000 for wired/city center approximations
		if (e.accuracy >= 22000) {
			e.latlng = otp.config.initLatLng;
			this.queueView(e.latlng, otp.config.initZoom);
			return; // dont bother adding a marker 
		}
				
		// if e.latlng is outside of map boundaries (tampa), recenter on USF			
		if ( ! otp.config.mapBoundary.contains(e.latlng)) {
			e.latlng = otp.config.initLatLng;
			this.queueView(e.latlng, otp.config.initZoom);
			return; // and don't add a marker on first load
		}				

        // Set initial map view and zoom when first GPS location found
		if (window.matchMedia("screen and (max-width: 768px)").matches) //Map localization on mobile
		{
			if (location.hash == "#trip")
			{
				this.queueView(new L.LatLng((e.latlng.lat + 0.00120),(e.latlng.lng)), otp.config.gpsZoom);
			}
			else if (location.hash == "#layers") 
			{
				this.queueView(new L.LatLng((e.latlng.lat),(e.latlng.lng - 0.00060)), otp.config.gpsZoom);
			}
			else if (location.hash == "#map") 
			{
				this.queueView(otp.config.initLatLng, otp.config.gpsZoom);
			}
			else //If the user didn't specify anything we check the cookies
			{
				var widgetUsedName = "widgetUsed=";
				var widgetUsed = "trip";
				var parts = document.cookie.split("; ");
				for (var i = 0; i < parts.length; i++) // This will iterate throught all the combinaison of key and value
				{
					var part = parts[i];
					if (part.indexOf(widgetUsedName) == 0) // This look if the key match 
					{
						widgetUsed =  part.substring(widgetUsedName.length);// This will return the value of the key "visited"
					}
				}
				if(widgetUsed == "layers")
				{
					this.queueView(new L.LatLng((e.latlng.lat),(e.latlng.lng - 0.00060)), otp.config.gpsZoom);
				}
				else if (widgetUsed == "trip")
				{
					this.queueView(new L.LatLng((e.latlng.lat + 0.00120),(e.latlng.lng)), otp.config.gpsZoom);
				}
			}
		}
		else
		{
			this.queueView(e.latlng, otp.config.gpsZoom);
		}
 	 }

	 // Save the location on otp.core.Map for use elsewhere
	 this_.currentLocation = e;
	 this_.locateControl._event = e;

	 // Handle other callback functions
	 for (i=0; i < this_.geolocateCallbacks.length; i++) {
		this_.geolocateCallbacks[i][0]( this_.geolocateCallbacks[i][1] );
	 }

	 // Setup marker
	 var locationSpot = L.Icon.extend({
        	options: {
            		iconUrl: resourcePath + 'images/locationSpot.svg',
            		iconSize: new L.Point(10,10),
          	}
     });

     var marker = new L.marker();
     var accCircle = new L.circle();

     var locSpot = new locationSpot();
     marker = L.marker(e.latlng,{icon : locSpot,}).bindPopup('Current Location');
     accCircle = L.circle(e.latlng,e.accuracy,{color:"blue", opacity: .25, fillOpacity: .1, weight: 3});

 	 this_._locationLayer.clearLayers();

     //adds new marker and accuracy circle
     marker.addTo(this_._locationLayer);
     accCircle.addTo(this_._locationLayer);

    },
 
    addContextMenuItem : function(text, clickHandler) {
        this.contextMenu.addModuleItem(text, clickHandler);
    },
    
    activeModuleChanged : function(oldModule, newModule) {
        

        // hide module-specific layers for "old" module, if applicable

        if(oldModule != null) {
            for(var layerName in oldModule.mapLayers) {
                
                var layer = oldModule.mapLayers[layerName];
                this.lmap.removeLayer(layer);                
                //this.layerControl.removeLayer(layer);
            }
        }

        // show module-specific layers for "new" module
        for(var layerName in newModule.mapLayers) {
            var layer = newModule.mapLayers[layerName];
            this.lmap.addLayer(layer);
            var this_ = this;
        }
        
        // change default BaseLayer, if specified
        if(newModule.defaultBaseLayer) {
            for(layerName in this.baseLayers) {
                var baseLayer = this.baseLayers[layerName];
                if(layerName == newModule.defaultBaseLayer)
                    this.lmap.addLayer(baseLayer, true);
                else 
                    this.lmap.removeLayer(baseLayer);
            }
        }
        
        // refresh the map context menu
        this.contextMenu.clearModuleItems();
        newModule.addMapContextMenuItems();
    },
    
    setBounds : function(bounds)
    {
            this.lmap.fitBounds(bounds);
    },
    
    $ : function() {
        return $("#map");
    },
    
    CLASS_NAME : "otp.core.Map"
});
