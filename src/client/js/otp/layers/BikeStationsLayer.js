otp.namespace("otp.layers");

var bikeIcon = L.Icon.extend({
        options: {
                angle: 0,
                iconUrl : resourcePath + 'images/marker-bike.svg',
                iconSize: new L.Point(40,70)
        }
});

var hubIcon = L.Icon.extend({
        options: {
                angle: 0,
                iconUrl : resourcePath + 'images/marker-hub.svg',
                iconSize: new L.Point(40,70)
        }
});

var stations = {};

otp.layers.BikeStationsLayer = 
	otp.Class(L.LayerGroup, {

		module : null,
	 	visible : false,
	
		minimumZoomForStops : 14,

		initialize : function(module) {
			L.LayerGroup.prototype.initialize.apply(this);
			this.module = module;
			
			this.module.addLayer("bikes", this);

			this.markers = {};

			// We only need to handle zoom events to remove/add markers if the level is too high or low
			this.module.webapp.map.lmap.on('zoomend', $.proxy(this.refresh, this));

			// Refresh data every 5 seconds
                        setInterval($.proxy(this.liveMap,this),5000);
			
			this.liveMap();
		},

		refresh : function() {
			var lmap = this.module.webapp.map.lmap;
			if(lmap.getZoom() >= this.minimumZoomForStops) {
				this.setMarkers();
			}
			else {
				this.clearLayers();
				this.markers = {};
			}
		},

		liveMap : function() {
			this_ = this;
			var url = otp.config.hostname + '/' + "otp/routers/default/bike_rental";
			$.ajax(url, {
				type: 'GET',
				dataType: 'JSON',
				async: false,
				timeout: 60000,
				success: function(data){
					this_.stations = data.stations;
					this_.setMarkers();
				}
			});
		},

		setMarkers: function(){
			var this_ = this;

			if (!this.visible) {
				this.clearLayers();
				this.markers = {};
				return;
			}

			var lmap = this.module.webapp.map.lmap;
			var zoom = lmap.getZoom();

			var bike_icon = new bikeIcon();
			var hub_icon = new hubIcon();

			var added = {};
	
			for(var v=0; v < this_.stations.length; v++){
				var coord = L.latLng(this_.stations[v].y,this_.stations[v].x);
				var marker;
		
				var is_hub = this_.stations[v].id.substring(0,3) == "hub";

                                if (is_hub) {
                                        link = "http://app.socialbicycles.com/map?hub_id=" + this_.stations[v].id.replace("hub_", "");
					marker_icon = hub_icon;
				}
				else {
					link = "http://app.socialbicycles.com/map?bike_id=" + this_.stations[v].id.replace("bike_", "");
					marker_icon = bike_icon;
				}

				name = this_.stations[v].name || this_.stations[v].id;
				context = {'name': name, 'station': this_.stations[v], 'reserve_link': link};

				if (is_hub) 
					var bikePopup = ich['otp-bikesLayer-hub-popup'](context).get(0);
				else var bikePopup = ich['otp-bikesLayer-popup'](context).get(0);

				marker =  L.marker(coord, {icon: marker_icon} );
				marker.bindPopup(bikePopup, {'minWidth': 200});
				marker._leaflet_id = this_.stations[v].id;

				if (!this.hasLayer(marker)) this.addLayer(marker);
				else {
					// if the marker exists, check that the position didnt change from previously
					oldmarker = this._layers[marker._leaflet_id];
	
					// If the new position is different
					if ( ! oldmarker._latlng.equals(marker._latlng)) {				
						this.removeLayer(oldmarker);
						this.addLayer(marker);
					}
					// if the position isn't different and the station is a hub, update the popup info
					else if (is_hub) {
		                                oldmarker.bindPopup(bikePopup, {'minWidth': 200});
					}
				}

				added[ marker._leaflet_id ] = marker;
			}
	
			// remove layers present but not in new set of markers
			for (var i in this.markers) {
				id = this.markers[i]._leaflet_id;
				if (added[id] == undefined) {
					this.removeLayer( this.markers[i] );

					console.log( "REMOVED " + i );
				}
			}

			this.markers = added;
		},
		
	});
