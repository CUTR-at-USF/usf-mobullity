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
	$('#bus_hart').bind('click', {'module': this.module}, function(ev) {

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


        // CarShare
        this.carshare_layer = L.layerGroup();
        this.carshare_active = false;

        carshareicon = L.icon({angle:0, iconUrl: '/images/marker-carshare.svg', iconSize: new L.Point(30,60)});

        marker =  L.marker(L.latLng(28.059951, -82.417575), {icon: carshareicon} );
        marker.bindPopup("<a target='_blank' href='https://www.enterprisecarshare.com/us/en/programs/university/usf.html'>Reserve a car</a>");
        marker._leaflet_id = L.stamp(marker);
        this.carshare_layer.addLayer(marker);

        marker =  L.marker(L.latLng(28.064287, -82.412130), {icon: carshareicon} );
        marker.bindPopup("<a target='_blank' href='https://www.enterprisecarshare.com/us/en/programs/university/usf.html'>Reserve a car</a>");
        marker._leaflet_id = L.stamp(marker);
        this.carshare_layer.addLayer(marker);       
 
        $('#carshare').bind('click', {'module': this}, function(ev) {

            if (ev.data.module.carshare_active) {
                $('#carshare .box').removeClass("active");
                webapp.map.lmap.removeLayer( ev.data.module.carshare_layer );
            }
            else {
                $('#carshare .box').addClass("active");
                ev.data.module.carshare_layer.addTo( webapp.map.lmap );
            }   

            ev.data.module.carshare_active = ! ev.data.module.carshare_active;     
        });

        /* Emergency Phones */
        phones = [[28.0614434,-82.4078041], [28.0555655,-82.4084315], [28.0641975,-82.4185115], [28.0651509,-82.4183224], [28.0611144,-82.4187288], [28.0652518,-82.4124851], [28.0582386,-82.4225447], [28.0610142,-82.4149218], [28.0618976,-82.4141717], [28.0615615,-82.4137318], [28.0599592,-82.4069672], [28.0591974,-82.4130281], [28.0599166,-82.4078553], [28.0688995,-82.4130541], [28.0631877,-82.4136464], [28.0632019,-82.4118091], [28.0662717,-82.4191208], [28.0655687,-82.4105538], [28.0641913,-82.4141936], [28.0658575,-82.4130831], [28.0641581,-82.4127264], [28.0652658,-82.409905], [28.0675588,-82.4256194], [28.0661246,-82.4206762], [28.0660985,-82.4245251], [28.0590405,-82.4201638], [28.0591163,-82.4192972], [28.0582144,-82.4185594], [28.0626681,-82.4144783], [28.060151,-82.4184505], [28.0598752,-82.4193438], [28.0628149,-82.4173562], [28.0599651,-82.4176474], [28.0651523,-82.4234651], [28.060344,-82.4142791], [28.0679737,-82.4155233], [28.0680589,-82.41334], [28.0663549,-82.4050145], [28.0680589,-82.405347], [28.0655857,-82.4073694], [28.0666507,-82.4073238], [28.0658389,-82.4087159], [28.0654484,-82.4090968], [28.0665276,-82.408166], [28.0649845,-82.411334], [28.0649951,-82.4105895], [28.0669113,-82.4190557], [28.0666677,-82.4197853], [28.0618552,-82.4209247], [28.0678908,-82.422387], [28.0584771,-82.4084789], [28.0581327,-82.4066318], [28.0652073,-82.4086336], [28.0661801,-82.4114123], [28.0683646,-82.4098433], [28.0665417,-82.4087582], [28.066589,-82.4107541], [28.0619428,-82.402926], [28.0598972,-82.4029098], [28.0668664,-82.4089528], [28.066173,-82.4098889], [28.0676942,-82.4114296], [28.0685342,-82.4117649], [28.0675338,-82.409103], [28.0684183,-82.4072753], [28.0600344,-82.408922], [28.060049,-82.4100958], [28.0582358,-82.4121799], [28.059121,-82.4116568], [28.0662335,-82.4029024], [28.0589559,-82.4179827], [28.0596162,-82.4209013], [28.0594457,-82.4185302], [28.0630128,-82.4097381], [28.0629156,-82.4104837], [28.0605726,-82.4120424], [28.0610623,-82.4100948], [28.0620187,-82.4113286], [28.0628495,-82.4252844], [28.0567379,-82.4088338], [28.061124,-82.4071658], [28.0630924,-82.4229122], [28.0582317,-82.4201016], [28.0617204,-82.4174919], [28.0678858,-82.4176509], [28.0626081,-82.4180444], [28.058057040276694,-82.40299527061906], [28.05816935136415,-82.41063929405303], [28.05833761039716,-82.4052632225725]];

        this.phones_layer = L.layerGroup();
        this.phones_active = false;

        phonesicon = L.icon({angle:0, iconUrl: '/images/marker-bluephone.svg', iconSize: new L.Point(30,60)});

        for (x in phones) {
            row = phones[x];

            marker =  L.marker(L.latLng(row), {icon: phonesicon} );
            marker.bindPopup("<b>Use Blue Light Phones to contact Police</b><br><a target='_blank' href='http://www.usf.edu/administrative-services/emergency-management/resources/campus-safety.aspx'>More about campus safety</a>");
            marker._leaflet_id = L.stamp(marker);

            this.phones_layer.addLayer(marker);
        }

        $('#bluephone').bind('click', {'module': this}, function(ev) {

                if (ev.data.module.phones_active) {
                    $('#bluephone .box').removeClass("active");
                    webapp.map.lmap.removeLayer( ev.data.module.phones_layer );
                }
                else {
                    $('#bluephone .box').addClass("active");
                    ev.data.module.phones_layer.addTo( webapp.map.lmap );
                }
    
                ev.data.module.phones_active = ! ev.data.module.phones_active;
        });

     
    },
    
});
