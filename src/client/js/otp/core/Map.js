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
        
        for(var i=0; i<otp.config.baseLayers.length; i++) { //otp.config.baseLayers.length-1; i >= 0; i--) {
            var layerConfig = otp.config.baseLayers[i];

            var layerProps = { };
            if(layerConfig.attribution) layerProps['attribution'] = layerConfig.attribution;
            if(layerConfig.subdomains) layerProps['subdomains'] = layerConfig.subdomains;

            var layer = new L.TileLayer(layerConfig.tileUrl, layerProps);

            this.baseLayers[layerConfig.name] = layer;
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
        		if (this._animatingZoom) {
        			this._viewActions.push([latlng, zoom]);
        		}
        		else {
        			this.setView(latlng, zoom);
        		}
        	}
        });
		
        this.lmap = new L.Map('map', mapProps);        
		
	// Establish map boundaries from OTP
        var url = otp.config.hostname + '/' + otp.config.restService + '/metadata';
        $.ajax(url, {
            data: { routerId : otp.config.routerId },            
            dataType: 'JSON',
            
            success: function(data) {				
				otp.config.mapBoundary = new L.latLngBounds(new L.latLng(data.lowerLeftLatitude, data.lowerLeftLongitude), new L.latLng(data.upperRightLatitude, data.upperRightLongitude));
		
				if(otp.config.geoLocation) {
					this.initialGeolocation = true;
					this_.lmap.locate({watch: true, enableHighAccuracy: true});
					this_.lmap.on('locationfound', onLocationFound);
				}						
				
            }
        });		    
		           
        this.overLayMaps ={
        	//"CUTR" : marker,
        };
	   
        /* here are the controls for layers and zooming on the map */
        L.control.layers(this.baseLayers, this.overLayMaps).addTo(this.lmap);
        L.control.zoom({ position : 'topright' }).addTo(this.lmap);
        //this.lmap.addControl(new L.Control.Zoom({ position : 'topright' }));
                
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
								
		// 40 accuracy for wifi, 22000 for wired/city center approximations
		if (e.accuracy >= 22000) {
			console.log("Accuracy beyond threshold; recentering on USF.");
			e.latlng = otp.config.initLatLng;
			this_.queueView(e.latlng, otp.config.initZoom);
			return; // dont bother adding a marker 
		}
				
		// if e.latlng is outside of map boundaries (tampa), recenter on USF				
		if ( ! otp.config.mapBoundary.contains(e.latlng)) {
			console.log("Geolocation is outside of map boundaries; recentering on USF.");
			e.latlng = otp.config.initLatLng;
			this_.queueView(e.latlng, otp.config.initZoom);
			return; // and don't add a marker on first load
		}				
	
		this_.initialGeolocation = false;

            	// Only zoom in on location on initial geolocation
		this_.queueView(e.latlng, otp.config.gpsZoom);
 	 }

	 // Save the location on otp.core.Map for use elsewhere
	 this_.currentLocation = e;

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

         /*Locates user's current location if geoLocation in config.js is set to true*/
         var marker = new L.marker();
         var tempM = new L.marker();
         var accCircle = new L.circle();
         var tempA = new L.circle();

         tempM = marker;
         tempA = accCircle;
         var locSpot = new locationSpot();
         marker = L.marker(e.latlng,{icon : locSpot,}).bindPopup('Current Location');
         accCircle = L.circle(e.latlng,e.accuracy,{color:"blue", opacity: .25, fillOpacity: .1, weight: 3});

         //adds new marker and accuracy circle
         this.addLayer(marker);
         this.addLayer(accCircle);

         //following removes the last set of map markers on the last function call
         this.removeLayer(tempM);
         this.removeLayer(tempA);

    },
 
    addContextMenuItem : function(text, clickHandler) {
        this.contextMenu.addModuleItem(text, clickHandler);
    },
    
    activeModuleChanged : function(oldModule, newModule) {
        

        //console.log("actModChanged: "+oldModule+", "+newModule);
        
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
