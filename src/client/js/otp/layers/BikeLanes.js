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
        	url: '/otp/routers/default/bike_lanes', 
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
        	for (p in this.bikeLanes) {

    			ret=L.polyline(this.bikeLanes[p], {color: 'red'});    			

    			this.addLayer(ret).addTo(lmap);
    			
            		
        	}
        }
    },
    
});
