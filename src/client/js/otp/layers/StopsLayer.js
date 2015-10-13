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

otp.namespace("otp.layers");

var bullrunnerStopIcon = L.Icon.extend({
    options: {
        iconUrl: resourcePath + 'images/busStopButton.png',
        shadowUrl: null,
        iconSize: new L.Point(8,8),
        iconAnchor: new L.Point(10, 10),
        popupAnchor: new L.Point(0, -5)
    }
});

var hartStopIcon = L.Icon.extend({
    options: {
        iconUrl: resourcePath + 'images/stop20.png',
        shadowUrl: null,
        iconSize: new L.Point(8,8),
        iconAnchor: new L.Point(10, 10),
        popupAnchor: new L.Point(0, -5)
    }
});

otp.layers.StopsLayer = 
    otp.Class(L.LayerGroup, {
   
    module : null,
    
    minimumZoomForStops : 15,
    
    initialize : function(module) {
        L.LayerGroup.prototype.initialize.apply(this);
        this.module = module;

        this.module.stopViewerWidget = new otp.widgets.transit.StopViewerWidget('otp-'+this.id+'-StopViewerWidget', this.module);
        
        this.stopsLookup = {};
       
        this.stopsLayer = this.module.addLayer("stops", this);
        
        this.module.webapp.map.lmap.on('dragend zoomend', $.proxy(this.refresh, this));
        
    },
    
    refresh : function() {
        this.clearLayers();                
        var lmap = this.module.webapp.map.lmap;
        if(lmap.getZoom() >= this.minimumZoomForStops) {
            this.module.webapp.transitIndex.loadStopsInRadius(null, lmap.getCenter(), this, function(data) {
                this.stopsLookup = {};
                for(var i = 0; i < data.length; i++) {
                    var agencyAndId = data[i].agency + "_" + data[i].id;
                    this.stopsLookup[agencyAndId] = data[i];
                }
                this.updateStops();
            });
        }
    },
    
    updateStops : function(stops) {
        var stops = _.values(this.stopsLookup);
        var this_ = this;
        var routeData = this.module.webapp.transitIndex.routes;

       	// USF Bull Runner_A index, routeData
 
        for(var i=0; i<stops.length; i++) {

            var stop = stops[i];
            stop.lat = stop.lat || stop.stopLat;
            stop.lon = stop.lon || stop.stopLon;

	    flag = false;
	    // Make sure at least one route served by stop is marked as visible in layers
	    for (x in stop.routes) {
		r = stop.routes[x];
		// if the BullRunner route layer is active
                if (webapp.modules[0].busLayers.visible.indexOf(r.shortName) != -1) flag = true;
		// if the HART layer is active (which manipulates otp.config)
		if (otp.config.showHartBusStops && r.agency.name == "Hillsborough Area Regional Transit") {
			flag = true;
		}
	    }

	    if (!flag) continue;

            var bullIcon = new bullrunnerStopIcon();
            var hartIcon = new hartStopIcon();
            
            var context = _.clone(stop);
            context.agencyStopLinkText = otp.config.agencyStopLinkText || "Agency Stop URL";
            var popupContent = ich['otp-stopsLayer-popup'](context);

            popupContent.find('.stopViewerLink').data('stop', stop).click(function() {
                var thisStop = $(this).data('stop');
                              
                this_.module.stopViewerWidget.show();
                this_.module.stopViewerWidget.setActiveTime(moment().add("hours", -otp.config.timeOffset).unix()*1000);
                this_.module.stopViewerWidget.setStop(thisStop.agency, thisStop.id, thisStop.name);
                this_.module.stopViewerWidget.bringToFront();
            });
            
            popupContent.find('.planFromLink').data('stop', stop).click(function() {
                var thisStop = $(this).data('stop');
                this_.module.setStartPoint(new L.LatLng(thisStop.lat, thisStop.lon), false, thisStop.stopName);
                this_.module.webapp.map.lmap.closePopup();
            });

            popupContent.find('.planToLink').data('stop', stop).click(function() {
                var thisStop = $(this).data('stop');
                this_.module.setEndPoint(new L.LatLng(thisStop.lat, thisStop.lon), false, thisStop.stopName);
                this_.module.webapp.map.lmap.closePopup();
            });
            
            if(stop.routes) {
                var routeList = popupContent.find('.routeList');
                for(var r = 0; r < stop.routes.length; r++) {
                    var agencyAndId = stop.routes[r].agency.id + '_' + stop.routes[r].id;
                    var routeData = {"routeShortName":stop.routes[r].shortName, "routeLongName":stop.routes[r].longName};
                    ich['otp-stopsLayer-popupRoute'](routeData).appendTo(routeList);
                    // TODO: click opens RouteViewer
                    //routeList.append('<div>'+agencyAndId+'</div>');
                }
            }

            if(stop.agency == "USF Bull Runner" && otp.config.showBullRunnerStops == true){
            	//only want to display USF BullRunner stops in this layer
            	L.marker([stop.lat, stop.lon], {
            		icon : bullIcon,
            	}).addTo(this_)
            	.bindPopup(popupContent.get(0));
            }
            
            else if(stop.agency == "Hillsborough Area Regional Transit" && otp.config.showHartBusStops == true){
            	//only want to display Hart stops in this layer
            	L.marker([stop.lat, stop.lon], {
            		icon : hartIcon,
            	}).addTo(this_)
            	.bindPopup(popupContent.get(0));
            }
            
        }
    },
});
