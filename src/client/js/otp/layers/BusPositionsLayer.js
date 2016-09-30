otp.namespace("otp.layers");

var vehicles = {};

otp.layers.BusPositionsLayer = 
	otp.Class(L.LayerGroup, {

		module : null,

		minimumZoomForStops : 14,
		
		visible : [], // Bus Layers that are visible
	
		route_polylines : [],
		routes: ['A', 'B', 'C', 'D', 'E', 'F'],

        colors: {'A': '#00573C', 'B': '#0077D1', 'C':'#AC49D0', 'D':'#F70505', 'E':'#bca510', 'F':'#8F6A51'},
        icons: {},
	
		initialize : function(module) {
			L.LayerGroup.prototype.initialize.apply(this);
			this.module = module;

			this.module.addLayer("buses", this);

            // Initialize layergroups for each route ID
            this.groups = {};
            for (x in this.routes) 
                this.groups[ this.routes[x] ] = L.layerGroup();			

			//Use patterns API to load geometries
			for (var x=0; x < this.routes.length; x++) {
				route = this.routes[x];

		   		// XXX use defined agency and detect the tripid (01) ?
		        $.ajax({
                		url: otp.config.hostname + '/otp/routers/default/index/patterns/USF Bull Runner_'+route+'_01/geometries',
                		this_: this,
        				rte: route,
		                dataType: 'json',
                		success: function(data) {
		           			this.this_.route_polylines[this.rte] = data;
	    		    	},
				});
			}

			//set map to refresh vehicle positions every 5 seconds and every map movement..
			this.module.webapp.map.lmap.on('dragend zoomend', $.proxy(this.refresh, this));
			setInterval($.proxy(this.refresh,this),5000);
		},

        getIconForRouteAndDirection : function(rte, dir) {

            switch (dir) {
            default:
                dir = "";
                break
            case "S": case "South":
                dir = "south";
                break;
            case "SW": case "SouthWest":
                dir = "se";
                break;
            case "W": case "West":
                dir = "west";
                break;
            case "NW": case "NorthWest":
                dir = "nw";
                break;
            case "N": case "North":
                dir = "north";
                break;
            case "NE": case "NorthEast":
                dir = "ne";
                break;
            case "E": case "East":
                dir = "east";
                break;
            case "SE": case "SouthEast":
                dir = "se";
                break;
            }

            icon_html = ich['busicon-bullrunner'];

            if (dir != "") bearing = ich['busicon-bearing-' + dir]({}).html();
            else bearing = "";

            icon_pre = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' ;
            icon_html = icon_pre + icon_html({'color': this.colors[rte], 'route': rte, 'bearing': bearing}).html();

            key = rte + "_" + dir;
            if (key in this.icons) {
                var icon = this.icons[key];
            }
            else {
               var icon = L.divIcon({
                     html : icon_html,
                     className : 'bullrunnericon',
                     iconSize: new L.Point(60,60),
                     iconAnchor: new L.Point(30,60),
                     popupAnchor: new L.Point(0,-60),
               });

               this.icons[key] = icon;
            }

            var lmap = this.module.webapp.map.lmap;
//            if(lmap.getZoom() <= 15) icon.options['iconSize'] = new L.Point(40,40);

           return icon;
       },  

		refresh : function() {
			var lmap = this.module.webapp.map.lmap;
            var busRouteVisible = this.visible.indexOf('A') != -1 || this.visible.indexOf('B') != -1 
                                    || this.visible.indexOf('C') != -1 || this.visible.indexOf('D') != -1
                                    || this.visible.indexOf('E') != -1 || this.visible.indexOf('F') != -1;

			if(busRouteVisible) {
				this.liveMap(); //need to get updated vehicle positions
				this.setRoutes(); //need to reset routes display on the map
			}
            else this.clearLayers();

		},

		liveMap : function() {
			this_ = this;
			this.module.webapp.transitIndex.loadBusPositions(this, function(data){
				this.vehicles = data.vehicles;
				this.setMarkers();
                this.setRoutes();
			});
		},

		setMarkers: function(){

			for(v=0; v < this.vehicles.length; v++) {		
				var coord = L.latLng(this.vehicles[v].lat,this.vehicles[v].lon);
				var bearing = this.vehicles[v].bearing;
				var route = this.vehicles[v].routeId;
				var marker;

				switch(bearing){
					case 0:
						dir = "N";
						break;
					case 45:
						dir = "NE";
						break;
					case 90:
						dir = "E";
						break;
					case 135:
						dir = "SE";
						break;
					case 180:
						dir = "S";
						break;
					case 225:
						dir = "SW";
						break;
					case 270:
						dir = "W";
						break;
					case 315:
						dir = "NW";
						break;
					default:
						console.log("Error no dir available: " + route);

                        continue;
					}

                   switch (this.vehicles[v].occupancyStatus) {
                   case "EMPTY":
                        occupancyClass = "green";
                        occupancyWidth = 25;
                        occupancyText = "Empty";
                        break;
                   case "MANY_SEATS_AVAILABLE":
                        occupancyClass = "green";
                        occupancyWidth = 50;
                        occupancyText = "Many Seats Available";
                        break;
                   case "FEW_SEATS_AVAILABLE":
                        occupancyClass = "yellow";
                        occupancyWidth = 75;
                        occupancyText = "Few Seats Available";
                        break;
                   case "STANDING_ROOM_ONLY":
                        occupancyClass = "red";
                        occupancyWidth = 90;
                        occupancyText = "Standing Room Only";
                        break;
                   case "CRUSHED_STANDING_ROOM_ONLY":
                        occupancyClass = "red";
                        occupancyWidth = 92;
                        occupancyText = "Crushed Standing Room Only";
                        break;
                   case "FULL":
                        occupancyClass = "red";
                        occupancyWidth = 95;
                        occupancyText = "Full";
                        break;
                   }

                   var icon = this.getIconForRouteAndDirection(route, dir);
                   marker = L.marker(coord,{icon : icon,}).bindPopup( ich['bullrunner-popup']({'bus': this.vehicles[v], 'route': route, 'dir': dir, 'occupancyClass': occupancyClass, 'occupancyWidth': occupancyWidth, "occupancyText": occupancyText}).html() );
                   marker._leaflet_id = this.vehicles[v].id;
                   marker.on('click', marker.openPopup.bind(marker));

                   if ( ! this.groups[route].hasLayer(marker))
                       this.groups[route].addLayer(marker);
                   else {
                        m = this.groups[route]['_layers'][marker._leaflet_id];

                        m.bindPopup( marker.getPopup() );

                        m.setLatLng( marker.getLatLng() );
                        m.setIcon( icon );
                        m.update();		
	
                  }

            } // end of vehicle loop

		},
		
		setRoutes : function(){			

           for (x in this.routes) {

                rte = this.routes[x];

               if (this.visible.indexOf(rte) == -1) {
                    if (this.hasLayer( this.groups[rte] )) this.removeLayer( this.groups[rte] );    
                    continue;
               }

               polylines = this.drawRoutePolyline( this.route_polylines[rte], {'color': this.colors[rte]} );
               polylines._leaflet_id = "polyline_" + rte;

               layer = this.groups[rte];
               if (!layer.hasLayer(polylines)) layer.addLayer(polylines);

               if (!this.hasLayer(layer)) this.addLayer( this.groups[rte] );

           }

		},

		drawRoutePolyline : function(route, opts) {
            opts['clickable'] = false;
            p = L.layerGroup();

			for (x in route) {
               line = route[x];
               p.addLayer( L.polyline(otp.util.Geo.decodePolyline(line['points']), opts) );
    		}

            return p;
		},

	});
