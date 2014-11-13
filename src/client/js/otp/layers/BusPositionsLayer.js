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
var stopsA = {};
var stopsB = {};
var stopsC = {};
var stopsD = {};
var stopsE = {};
var stopsF = {};

otp.layers.BusPositionsLayer = 
	otp.Class(L.LayerGroup, {

		module : null,

		minimumZoomForStops : 14,

		initialize : function(module) {
			L.LayerGroup.prototype.initialize.apply(this);
			this.module = module;

			this.module.addLayer("buses", this);
			
			//Get the stops for each Bull Runner Route to draw the route...
			stopsA = this.module.webapp.transitIndex.getTripRoute('USF Bull Runner_1');
			stopsB = this.module.webapp.transitIndex.getTripRoute('USF Bull Runner_3');
			stopsC = this.module.webapp.transitIndex.getTripRoute('USF Bull Runner_5');
			stopsD = this.module.webapp.transitIndex.getTripRoute('USF Bull Runner_8');
			stopsE = this.module.webapp.transitIndex.getTripRoute('USF Bull Runner_11');
			stopsF = this.module.webapp.transitIndex.getTripRoute('USF Bull Runner_13');
			
			//set map to refresh vehicle positions every 5 seconds and every map movement..
			this.module.webapp.map.lmap.on('dragend zoomend', $.proxy(this.refresh, this));
			setInterval($.proxy(this.refresh,this),5000);
		},

		refresh : function() {
			this.clearLayers();
			var lmap = this.module.webapp.map.lmap;
			if(lmap.getZoom() >= this.minimumZoomForStops) {
				this.liveMap(); //need to get updated vehicle positions
				this.setRoutes(); //need to reset routes display on the map
			}
		},

		liveMap : function() {
			this_ = this;
			this.module.webapp.transitIndex.loadBusPositions(this, function(data){
				this_.vehicles = data.vehicles;
				this_.setMarkers();
			});
		},

		setMarkers: function(){
			var this_ = this;
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
			//for route A:
			var routeA = new Array();
			//console.log(stopsA);
			for (var a = 0; a < stopsA.length; a++){
				var lat = stopsA[a].lat;
				var lng = stopsA[a].lon;
				var latlng = L.latLng(lat, lng);
				routeA.push(latlng);
			}
			//console.log(routeA);
			L.polyline(routeA, {color: 'green'}).addTo(this);
			
			//for route B:
			var routeB = new Array();
			for (var b = 0; b < stopsB.length; b++){
				var lat = stopsB[b].lat;
				var lng = stopsB[b].lon;
				var latlng = L.latLng(lat, lng);
				routeB.push(latlng);
			}
			L.polyline(routeB, {color: 'blue'}).addTo(this);
			
			//for route C:
			var routeC = new Array();
			for (var c = 0; c < stopsC.length; c++){
				var lat = stopsC[c].lat;
				var lng = stopsC[c].lon;
				var latlng = L.latLng(lat, lng);
				routeC.push(latlng);
			}
			//console.log(routeA);
			L.polyline(routeC, {color: 'purple'}).addTo(this);
			
			//for route D:
			var routeD = new Array();
			for (var d = 0; d < stopsD.length; d++){
				var lat = stopsD[d].lat;
				var lng = stopsD[d].lon;
				var latlng = L.latLng(lat, lng);
				routeD.push(latlng);
			}
			L.polyline(routeD, {color: 'red'}).addTo(this);
			
			//for route E:
			var routeE = new Array();
			for (var e = 0; e < stopsE.length; e++){
				var lat = stopsE[e].lat;
				var lng = stopsE[e].lon;
				var latlng = L.latLng(lat, lng);
				routeE.push(latlng);
			}
			L.polyline(routeE, {color: 'yellow'}).addTo(this);
			
			//for route F:
			var routeF = new Array();
			for (var f = 0; f < stopsF.length; f++){
				var lat = stopsF[f].lat;
				var lng = stopsF[f].lon;
				var latlng = L.latLng(lat, lng);
				routeF.push(latlng);
			}
			L.polyline(routeF, {color: 'brown'}).addTo(this);

		},
	});