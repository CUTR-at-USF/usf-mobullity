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

otp.core.TransitIndex = otp.Class({

    webapp          : null,

    agencies        : null,
    routes          : null,
    
    initialize : function(webapp) {
        this.webapp = webapp;       
    },

    loadAgencies : function(callbackTarget, callback) {
        var this_ = this;
        if(this.agencies) {
            if(callback) callback.call(callbackTarget);
            return;
        }
        
        var url = otp.config.hostname + '/' + otp.config.restService + '/index/agencies';
        $.ajax(url, {
            dataType:   'json',
            
            data: {
                extended: 'true',
            },
                
            success: function(data) {
                this_.agencies = {};

                for(var i=0; i<data.length; i++) {
                    var agencyData = data[i];
                    this_.agencies[agencyData.id] = {
                        index : i,
                        agencyData : agencyData,
                    };
                }

                if(callback) callback.call(callbackTarget);
            }            
        });
    },

    loadRoutes : function(callbackTarget, callback) {
        var this_ = this;
        if(this.routes) {
            if(callback) callback.call(callbackTarget);
            return;
        }
        
        var url = otp.config.hostname + '/' + otp.config.restService + '/index/routes';
        $.ajax(url, {
            dataType:   'json',
            
            data: {
                extended: 'true',
            },
                
            success: function(data) {
                if(data.length <= 0) {
                    console.log("Error: routes call returned no route data. OTP Message: "+data.message);
                    return;
                }
                var sortedRoutes = data;
                sortedRoutes.sort(function(a,b) {
                    a = a.routeShortName || a.routeLongName;
                    b = b.routeShortName || b.routeLongName;
                    if(otp.util.Text.isNumber(a) && otp.util.Text.isNumber(b)) {
                        if(parseFloat(a) < parseFloat(b)) return -1;
                        if(parseFloat(a) > parseFloat(b)) return 1;
                        return 0;
                    }
                    if(a < b) return -1;
                    if(a > b) return 1;
                    return 0;
                });
                
                var routes = { };
                for(var i=0; i<sortedRoutes.length; i++) {
                    var routeData = sortedRoutes[i];
                    var agencyAndId = routeData.agency+"_"+routeData.id;
                    routes[agencyAndId] = {
                        index : i,
                        routeData : routeData,
                        variants : null
                    };
                }
                this_.routes = routes;
                if(callback) callback.call(callbackTarget);
            }            
        });        
    },
    
    /* TODO: find correct url from Index API for loadVariants */
    loadVariants : function(agencyAndId, callbackTarget, callback) {
        var this_ = this;
        //console.log("loadVariants: "+agencyAndId);
        var route = this.routes[agencyAndId];
        if(route.variants) {
            if(callback) callback.call(callbackTarget, route.variants);
            return;
        }

        var url = otp.config.hostname + '/' + otp.config.restService + '/index/routes';
        $.ajax(url, {
            data: {
                agency : route.routeData.id.agencyId,
                id : route.routeData.id.id
                
            },
            dataType:   'json',
                
            success: function(data) {
                //console.log(data);
                route.variants = {};
                for(var i=0; i<data.routeData[0].variants.length; i++) {
                    route.variants[data.routeData[0].variants[i].name] = data.routeData[0].variants[i];
                    data.routeData[0].variants[i].index = i;
                }
                if(callback && callbackTarget) {
                    callback.call(callbackTarget, route.variants);
                }
            }
        });
        
    },
    
    /* TODO: find correct url from Index API for readVariantForTrip */
    readVariantForTrip : function(tripAgency, tripId, callbackTarget, callback) {
    
        var url = otp.config.hostname + '/' + otp.config.restService + '/transit/trips' + tripId;
        $.ajax(url, {
            data: {
//                tripAgency : tripAgency,
//                tripId : tripId
            },
            dataType:   'json',
                
            success: function(data) {
                //console.log("vFT result:");
                //console.log(data);
                callback.call(callbackTarget, data);
            }
        });        

        /*var route = this.routes[agencyAndId];
        console.log("looking for trip "+tripId+" in "+agencyAndId);
        
        if(!route.variants) {
            console.log("ERROR: transitIndex.routes.["+agencyAndId+"].variants null in TransitIndex.getVariantForTrip()");
            return;
        }
        
        for(var vi=0; vi<route.variants.length; vi++) {
            var variant = route.variants[vi];
            console.log("searching variant "+vi);
            //console.log(variant);
            for(var ti=0; ti<variant.trips.length; ti++) {
                var trip = variant.trips[ti];
                console.log(" - "+trip.id)
                if(trip.id == tripId) return variant;
            }
        }
        
        console.log("could not find trip "+tripId);
        return null;*/
    },

    /* TODO: stopID resulting in a null value */
    runStopTimesQuery : function(agencyId, stopId, startTime, endTime, callbackTarget, callback) {

        if(otp.config.useLegacyMillisecondsApi) {
            startTime *= 1000;
            endTime *= 1000;
        }

//        var params = {
//            agency: agencyId,
//            id: stopId,
//            startTime : startTime, //new TransitIndex API uses seconds
//            endTime : endTime, // new TransitIndex API uses seconds
//            extended : true,
//        };
        if(otp.config.routerId !== undefined) {
            params.routerId = otp.config.routerId;
        }
        
        var url = otp.config.hostname + '/' + otp.config.restService + '/index/stops/' + agencyId + "_" + stopId + '/stoptimes';
        $.ajax(url, {
  //          data:       params,
            dataType:   'json',
                
            success: function(data) {
                callback.call(callbackTarget, data);                
            }
        });
    },        
    
    /* TODO: no errors in correct url but no stops showing on map?? */
    loadStopsInRadius:  function(agencyId, center, callbackTarget, callback) {
    	var params = {
              lat: center.lat,
              lon: center.lng,
              radius: 1500,
              maxLat : null,
              minLon : null,
              minLat : null,
              maxLon : null,
    	};
    	if(agencyId !== null) {
          params.agency = agencyId;
      }
      if(typeof otp.config.routerId !== 'undefined') {
          params.routerId = otp.config.routerId;
      }
      
      var url = otp.config.hostname + '/' + otp.config.restService + '/index/stops';
      $.ajax(url, {
          data:       params,
          dataType:   'json',
          success: function(data) {
              callback.call(callbackTarget, data);                
          }
      });
    	
    },
    
//    loadStopsInRectangle : function(agencyId, bounds, callbackTarget, callback) {
//        var params = {
//            leftUpLat : bounds.getNorthWest().lat,
//            leftUpLon : bounds.getNorthWest().lng,
//            rightDownLat : bounds.getSouthEast().lat,
//            rightDownLon : bounds.getSouthEast().lng,
//            extended : true
//        };
//        if(agencyId !== null) {
//            params.agency = agencyId;
//        }
//        if(typeof otp.config.routerId !== 'undefined') {
//            params.routerId = otp.config.routerId;
//        }
//        
//        var url = otp.config.hostname + '/' + otp.config.restService + '/transit/stopsInRectangle';
//        $.ajax(url, {
//            data:       params,
//            dataType:   'jsonp',
//                
//            success: function(data) {
//                callback.call(callbackTarget, data);                
//            }
//        });
//    },

    /* TODO: find correct url from Index API for loadStopsById */
    loadStopsById : function(agencyId, id, callbackTarget, callback) {
//        var params = {
//            id : id,
//            extended : true
//        };
        if(agencyId !== null) {
            params.agency = agencyId;
        }
        if(typeof otp.config.routerId !== 'undefined') {
            params.routerId = otp.config.routerId;
        }
        
        var url = otp.config.hostname + '/' + otp.config.restService + '/index/stops/' + id;
        $.ajax(url, {
//            data:       params,
            dataType:   'json',
                
            success: function(data) {
                callback.call(callbackTarget, data);                
            }
        });
    },   

    /* TODO: Do no see anything in the IndexAPI.java for getting a stop by anything other than it's ID */
//    loadStopsByName : function(agencyId, name, callbackTarget, callback) {
//        var params = {
//            name: name,
//            extended : true
//        };
//        if(agencyId !== null) {
//            params.agency = agencyId;
//        }
//        if(typeof otp.config.routerId !== 'undefined') {
//            params.routerId = otp.config.routerId;
//        }
//        
//        var url = otp.config.hostname + '/' + otp.config.restService + '/transit/stopsByName';
//        $.ajax(url, {
//            data:       params,
//            dataType:   'jsonp',
//                
//            success: function(data) {
//                callback.call(callbackTarget, data);                
//            }
//        });
//    },  
    
    loadRoutesByStopId : function(agencyAndId, callbackTarget, callback) {
    	var agencyId = agencyAndId;
      
      var url = otp.config.hostname + '/' + otp.config.restService + '/index/stops/' + agencyId + '/routes';
      $.ajax(url, {
          dataType:   'json',
          async: false,
              
          success: function(data) {
        	  callback.call(callbackTarget, data);
          },
      	
      });
  },
  
  loadBusPositions : function(callbackTarget, callback) {
	  var url = otp.config.hostname + '/' + "otp/vehicle_positions";
	  
	  $.ajax(url, {
		  type: 'GET',
		  dataType: 'JSON',
		  timeout: 60000,
			
		  success: function(data){
			  callback.call(callbackTarget, data);
		  }
	  });
  },

  getTripRoute : function(agencyAndId){
	  var url = otp.config.hostname + '/' + otp.config.restService +'/index/trips/' + agencyAndId + "/stops";
	  var stops = {};
	  $.ajax(url, {
		  type: 'GET',
		  dataType: 'JSON',
		  async: false,
	  
		  success: function(data){
			  stops = data;
		  }
	  });
	  
	  return stops;
  }
});