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
    
    toggle_bus_layer : function(rte) {
    	
    	var id = L.stamp( this.module.busLayers );
    	var obj = this.module.busLayers;
    	        	
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
        
    initialize : function(id, module) {
    
        otp.widgets.Widget.prototype.initialize.call(this, id, module, {
			title : 'Layers',
			customHeader : true, // use a custom header
			headerClass: "otp-defaultTripWidget-header",
            cssClass : 'otp-layerView',
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
	$('#bus_hart').bind('click', {'this_': this}, function(ev) {

		if (otp.config.showHartBusStops) {
			otp.config.showHartBusStops = false;
                        $("#bus_hart .box").removeClass('active');
		}
		else {
			otp.config.showHartBusStops = true;
			$("#bus_hart .box").addClass('active');
		}

		ev.data.this_.module.busLayers.refresh();

	});
  
	// Bike rental layers
        $('#bike_stations').bind('click', {'module': this.module}, function(ev) {

        	var id = L.stamp( ev.data.module.bikeLayers );
        	                	
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
        
    },
    
});
