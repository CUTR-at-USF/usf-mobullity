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

/*
 Bounding box polyline is automatically built by src/main/java/org/opentripplanner/routing/graph/Graph.java:buildBicycleLanes()
 and is encoded as the first four segments returned by API
 */

otp.layers.BikeLanesLayer = 
    otp.Class(L.LayerGroup, {
   
    module : null,
    
    minimumZoomForStops : 15,
   
    visible: false,
 
    initialize : function(module) {
        L.LayerGroup.prototype.initialize.apply(this);
        this.module = module;
        
        this.bikeLanes = []
        this.module.addLayer("bikelanes", this);        
        this.module.webapp.map.lmap.on('dragend zoomend', $.proxy(this.refresh, this));
        
        $.ajax({
        	url: otp.config.hostname + "/" + otp.config.restService + '/bike_lanes', 
        	webapp: this.module.webapp,
        	this_: this,
        	dataType: 'json',
        	success: function(data) {        
        		for (x in data) {
        			row = data[x];
        			
        			var p = otp.util.Geo.decodePolyline(row);
        			
        			this.this_.bikeLanes.push( p );        			        			        	
        		}
        	},
        });
        
    },
    
    refresh : function() {
        this.clearLayers();                
        var lmap = this.module.webapp.map.lmap;
        if(lmap.getZoom() >= this.minimumZoomForStops && this.visible) {
	
		i = 0;	
        	for (p in this.bikeLanes) {

			// For first four segments of bounding box
			if (i < 4) opts = {color: '#006747', dashArray: '5, 5'};
			else opts = {color: '#006747'};

    			ret=L.polyline(this.bikeLanes[p], opts);    			

    			this.addLayer(ret).addTo(lmap);
    				
            		i++;
        	}
        }
    },
    
});
