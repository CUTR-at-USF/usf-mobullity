otp.namespace("otp.layers");

var bullRunnerIconN = L.Icon.extend({
	options: {
		angle: 0,
		iconUrl : resourcePath + 'images/busLocation.png',
		iconSize: new L.Point(15,15)
	}
});
var bullRunnerIconS = L.Icon.extend({
	options: {
		angle: 0,
		iconUrl : resourcePath + 'images/south-01.png',
		iconSize: new L.Point(15,15)
	}
});
var bullRunnerIconE = L.Icon.extend({
	options: {
		angle: 0,
		iconUrl : resourcePath + 'images/east-01.png',
		iconSize: new L.Point(15,15)
	}
});
var bullRunnerIconW = L.Icon.extend({
	options: {
		angle: 0,
		iconUrl : resourcePath + 'images/west-01.png',
		iconSize: new L.Point(15,15)
	}
});
var bullRunnerIconNE = L.Icon.extend({
	options: {
		angle: 0,
		iconUrl : resourcePath + 'images/northEast-01.png',
		iconSize: new L.Point(15,15)
	}
});
var bullRunnerIconNW = L.Icon.extend({
	options: {
		angle: 0,
		iconUrl : resourcePath + 'images/northWest-01.png',
		iconSize: new L.Point(15,15)
	}
});
var bullRunnerIconSE = L.Icon.extend({
	options: {
		angle: 0,
		iconUrl : resourcePath + 'images/southEast-01.png',
		iconSize: new L.Point(15,15)
	}
});
var bullRunnerIconSW = L.Icon.extend({
	options: {
		angle: 0,
		iconUrl : resourcePath + 'images/southWest-01.png',
		iconSize: new L.Point(15,15)
	}
});

var vehicles = {};

otp.layers.BusPositionsLayer = 
	otp.Class(L.LayerGroup, {

		module : null,

		minimumZoomForStops : 14,

		initialize : function(module) {
			L.LayerGroup.prototype.initialize.apply(this);
			this.module = module;

			this.module.addLayer("buses", this);
			this.module.webapp.map.lmap.on('dragend zoomend', $.proxy(this.refresh, this));
			setInterval($.proxy(this.refresh,this),5000);
		},

		refresh : function() {
			this.clearLayers();
			var lmap = this.module.webapp.map.lmap;
			if(lmap.getZoom() >= this.minimumZoomForStops) {
				this.liveMap();
				this.setRoutes();
			}
		},

		liveMap : function() {
			this_ = this;
			var url = otp.config.hostname + '/' + "otp/vehicle_positions";
			$.ajax(url, {
				type: 'GET',
				dataType: 'JSON',
				async: false,
				timeout: 60000,
				success: function(data){
//					var x;
//					for (x = 0; x < data.vehicles.length; x++){
//					console.log("Vehicle "+x+": id:"+data.vehicles[x].id+" route:"+data.vehicles[x].routeId+" lat:"+data.vehicles[x].lat.toFixed(3)+" lon:"+data.vehicles[x].lon.toFixed(3)+" dir:"+data.vehicles[x].bearing);
//					}
					this_.vehicles = data.vehicles;
					this_.setMarkers();
				}
			});
//			console.log(this_.vehicles);
		},

		setMarkers: function(){
			var this_ = this;
			this.clearLayers();
			var v;
			var a = new Array();
			var b = new Array();
			var c = new Array();
			var d = new Array();
			var e = new Array();
			var f = new Array();
			for(v=0; v < this_.vehicles.length; v++){
				var brIconN = new bullRunnerIconN();
				var brIconNE = new bullRunnerIconNE();
				var brIconNW = new bullRunnerIconNW();
				var brIconS = new bullRunnerIconS();
				var brIconSE = new bullRunnerIconSE();
				var brIconSW = new bullRunnerIconSW();
				var brIconE = new bullRunnerIconE();
				var brIconW = new bullRunnerIconW();
				var coord = L.latLng(this_.vehicles[v].lat,this_.vehicles[v].lon);
				var bearing = this_.vehicles[v].bearing;
				var route = this_.vehicles[v].routeId;
				var marker;

				switch (route){
				case 'A':
					switch(bearing){
					case 0:
						marker =  L.marker(coord,{icon : brIconN,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						a.push(marker);
						break;
					case 45:
						marker=L.marker(coord,{icon : brIconNE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						a.push(marker);
						break;
					case 90:
						marker = L.marker(coord,{icon : brIconE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						a.push(marker);
						break;
					case 135:
						marker = L.marker(coord,{icon : brIconSE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						a.push(marker);
						break;
					case 180:
						marker = L.marker(coord,{icon : brIconS,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						a.push(marker);
						break;
					case 225:
						marker = L.marker(coord,{icon : brIconSW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						a.push(marker);
						break;
					case 270:
						marker = L.marker(coord,{icon : brIconW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						a.push(marker);
						break;
					case 315:
						marker = L.marker(coord,{icon : brIconNW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						a.push(marker);
						break;
					default:
						console.log("Error no dir available: " + route);
					}
					break;
				case 'B':
					switch(bearing){
					case 0:
						marker =  L.marker(coord,{icon : brIconN,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						b.push(marker);
						break;
					case 45:
						marker=L.marker(coord,{icon : brIconNE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						b.push(marker);
						break;
					case 90:
						marker = L.marker(coord,{icon : brIconE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						b.push(marker);
						break;
					case 135:
						marker = L.marker(coord,{icon : brIconSE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						b.push(marker);
						break;
					case 180:
						marker = L.marker(coord,{icon : brIconS,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						b.push(marker);
						break;
					case 225:
						marker = L.marker(coord,{icon : brIconSW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						b.push(marker);
						break;
					case 270:
						marker = L.marker(coord,{icon : brIconW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						b.push(marker);
						break;
					case 315:
						marker = L.marker(coord,{icon : brIconNW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						b.push(marker);
						break;
					default:
						console.log("Error no dir available: " + route);
					}
					break;
				case 'C':
					switch(bearing){
					case 0:
						marker =  L.marker(coord,{icon : brIconN,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						c.push(marker);
						break;
					case 45:
						marker=L.marker(coord,{icon : brIconNE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						c.push(marker);
						break;
					case 90:
						marker = L.marker(coord,{icon : brIconE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						c.push(marker);
						break;
					case 135:
						marker = L.marker(coord,{icon : brIconSE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						c.push(marker);
						break;
					case 180:
						marker = L.marker(coord,{icon : brIconS,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						c.push(marker);
						break;
					case 225:
						marker = L.marker(coord,{icon : brIconSW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						c.push(marker);
						break;
					case 270:
						marker = L.marker(coord,{icon : brIconW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						c.push(marker);
						break;
					case 315:
						marker = L.marker(coord,{icon : brIconNW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						c.push(marker);
						break;
					default:
						console.log("Error no dir available: " + route);
					}
					break;
				case 'D':
					switch(bearing){
					case 0:
						marker =  L.marker(coord,{icon : brIconN,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						d.push(marker);
						break;
					case 45:
						marker=L.marker(coord,{icon : brIconNE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						d.push(marker);
						break;
					case 90:
						marker = L.marker(coord,{icon : brIconE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						d.push(marker);
						break;
					case 135:
						marker = L.marker(coord,{icon : brIconSE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						d.push(marker);
						break;
					case 180:
						marker = L.marker(coord,{icon : brIconS,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						d.push(marker);
						break;
					case 225:
						marker = L.marker(coord,{icon : brIconSW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						d.push(marker);
						break;
					case 270:
						marker = L.marker(coord,{icon : brIconW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						d.push(marker);
						break;
					case 315:
						marker = L.marker(coord,{icon : brIconNW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						d.push(marker);
						break;
					default:
						console.log("Error no dir available: " + route);
					}
					break;
				case 'E':
					switch(bearing){
					case 0:
						marker =  L.marker(coord,{icon : brIconN,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						e.push(marker);
						break;
					case 45:
						marker=L.marker(coord,{icon : brIconNE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						e.push(marker);
						break;
					case 90:
						marker = L.marker(coord,{icon : brIconE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						e.push(marker);
						break;
					case 135:
						marker = L.marker(coord,{icon : brIconSE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						e.push(marker);
						break;
					case 180:
						marker = L.marker(coord,{icon : brIconS,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						e.push(marker);
						break;
					case 225:
						marker = L.marker(coord,{icon : brIconSW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						e.push(marker);
						break;
					case 270:
						marker = L.marker(coord,{icon : brIconW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						e.push(marker);
						break;
					case 315:
						marker = L.marker(coord,{icon : brIconNW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						e.push(marker);
						break;
					default:
						console.log("Error no dir available: " + route);
					}
					break;
				case 'F':
					switch(bearing){
					case 0:
						marker =  L.marker(coord,{icon : brIconN,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						f.push(marker);
						break;
					case 45:
						marker=L.marker(coord,{icon : brIconNE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						f.push(marker);
						break;
					case 90:
						marker = L.marker(coord,{icon : brIconE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						f.push(marker);
						break;
					case 135:
						marker = L.marker(coord,{icon : brIconSE,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						f.push(marker);
						break;
					case 180:
						marker = L.marker(coord,{icon : brIconS,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						f.push(marker);
						break;
					case 225:
						marker = L.marker(coord,{icon : brIconSW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						f.push(marker);
						break;
					case 270:
						marker = L.marker(coord,{icon : brIconW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						f.push(marker);
						break;
					case 315:
						marker = L.marker(coord,{icon : brIconNW,}).bindPopup('Bus: ' + this_.vehicles[v].id + " Route: " + route);
						marker.on('mouseover', marker.openPopup.bind(marker));
						f.push(marker);
						break;
					default:
						console.log("Error no dir available: " + route);
					}
					break;
				default:
					console.log("Error no route available: " + route);
				}
			}
				L.layerGroup(a).addTo(this_);
				L.layerGroup(b).addTo(this_);
				L.layerGroup(c).addTo(this_);
				L.layerGroup(d).addTo(this_);
				L.layerGroup(e).addTo(this_);
				L.layerGroup(f).addTo(this_);
		},
		
		setRoutes : function(){
//			var routeData = this.module.webapp.transitIndex.routes;
//			if(routeData['USF Bull Runner_A']){};
//			if(routeData['USF Bull Runner_B']){};
//			if(routeData['USF Bull Runner_C']){};
//			if(routeData['USF Bull Runner_D']){};
//			if(routeData['USF Bull Runner_E']){};
//			if(routeData['USF Bull Runner_F']){};
		},
	});
