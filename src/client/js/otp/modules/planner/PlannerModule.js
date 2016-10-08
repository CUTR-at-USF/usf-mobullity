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

otp.namespace("otp.modules.planner");

otp.modules.planner.defaultQueryParams = {
    startPlace                      : null,
    endPlace                        : null,
    time                            : moment().format(otp.config.locale.time.time_format),
    date                            : moment().format(otp.config.locale.time.date_format),
    arriveBy                        : false,
    mode                            : "TRANSIT,WALK",
    //The three following attribute don't make sense. More information here: https://groups.google.com/forum/#!topic/opentripplanner-dev/PS4oSVQKm2k
    maxWalkDistance                 : 482.8032, // .3 mile unit are in meter
    metricDefaultMaxWalkDistance    : 482.8032, // meters
    imperialDefaultMaxWalkDistance  : 482.8032, // 1 mile
    preferredRoutes                 : null,
    otherThanPreferredRoutesPenalty : 300,
    bannedTrips                     : null,
    optimize                        : null,
    triangleTimeFactor              : 0.333,
    triangleSlopeFactor             : 0.333,
    triangleSafetyFactor            : 0.334,
    wheelchair			    : false,
}

otp.modules.planner.PlannerModule = 
    otp.Class(otp.modules.Module, {

    moduleName  : "Trip Planner",
    
    markerLayer     : null,
    pathLayer       : null,
    pathMarkerLayer : null,
    highlightLayer  : null,
    
    startMarker     : null,
    endMarker       : null,
    
    tipWidget       : null,
    noTripWidget    : null,
    tipStep         : 0,
    
    welcomeWidget	: null,
    
    currentRequest  : null,
    currentHash : null,
    
    itinMarkers : [],

    planTripFunction : null,

    validated : false,
    _valid : [],

    // current trip query parameters: 
    /*
    startName               : null,
    endName                 : null,
    startLatLng             : null,
    endLatLng               : null,
    time                    : null,
    date                    : null,
    arriveBy                : false,
    mode                    : "TRANSIT,WALK",
    maxWalkDistance         : null,
    preferredRoutes         : null,
    bannedTrips             : null,
    optimize                : null,
    triangleTimeFactor      : 0.333,
    triangleSlopeFactor     : 0.333,
    triangleSafetyFactor    : 0.334,
    */
    
    startName       : null,
    endName         : null,
    startLatLng     : null,
    endLatLng       : null,
    

    // the defaults params, as modified in the module-specific config
    defaultQueryParams  : null,
    
    startTimePadding    : 0,
    
    // copy of query param set from last /plan request
    lastQueryParams : null,
    
    icons       : null,

    //templateFile : 'otp/modules/planner/planner-templates.html',

    initialize : function(webapp, id, options) {
        otp.modules.Module.prototype.initialize.apply(this, arguments);
        this.templateFiles.push('otp/modules/planner/planner-templates.html');

        this.icons = new otp.modules.planner.IconFactory();
        
        this.planTripFunction = this.planTrip;
        
        this.defaultQueryParams = _.clone(otp.modules.planner.defaultQueryParams);

        if (otp.config.metric) {
            this.defaultQueryParams.maxWalkDistance = this.defaultQueryParams.metricDefaultMaxWalkDistance;
        } else {
            this.defaultQueryParams.maxWalkDistance = this.defaultQueryParams.imperialDefaultMaxWalkDistance;
        }

        if(_.has(this.options, 'defaultQueryParams')) {
            _.extend(this.defaultQueryParams, this.options.defaultQueryParams);
        }
        
        _.extend(this, _.clone(otp.modules.planner.defaultQueryParams));    
    },
    
	getCookie : function()
    {
		name = "visited=";
		var visitedBool = false;
		var parts = document.cookie.split("; ");
		for (var i = 0; i < parts.length; i++) // This will iterate throught all the combinaison of key and value
		{
			var part = parts[i];
			if (part.indexOf(name) == 0) // This look if the key match 
			{
				visitedBool = visitedBool || part.substring(name.length); // This will return the value of the key "visited"
			}
		}
		
		return visitedBool; //If the key is not found then it was never initialized
    },
    
    
    checkCookie : function() {
    	var visited = this.getCookie();
    	if(visited != "true"){
    		document.cookie = "visited=true; expires=Fri, 13 Dec 2041 12:00:00 UTC ";
            //Set Pop up Menu to give user info on how to use the app when the page firsts loads
            this.WelcomeWidget = this.createWidget("otp-WelcomeWidget", "<font color=red>Do NOT use this application while driving a vehicle!</font><br><br>" +
            		"<li> Use the menu button to change between the Trip Planner and Layers features </li>" +
            		"<li> To set your trip \"Start\" and \"End\", type your building name or abbreviation into the boxes or long-press on the map </li>", this);
            this.WelcomeWidget.center();
            this.WelcomeWidget.setTitle("Welcome!");
            this.addWidget(this.WelcomeWidget);
    	}
    },
	
    activate : function() {
        if(this.activated) return;
        var this_ = this;

        // set up layers        
        this.markerLayer = new L.LayerGroup();
        this.pathLayer = new L.LayerGroup();
        this.pathMarkerLayer = new L.LayerGroup();
        this.highlightLayer = new L.LayerGroup();
    
        this.addLayer("Highlights", this.highlightLayer);
        this.addLayer("Start/End Markers", this.markerLayer);
        this.addLayer("Paths", this.pathLayer);
        this.addLayer("Path Markers", this.pathMarkerLayer);

        this.webapp.transitIndex.loadAgencies(this);
        this.webapp.transitIndex.loadRoutes(this, function() {
            this.routesLoaded();
        });
        
        this.activated = true;
        
         //This is where it will check and set a cookie for the user 
        //to decide whether the welcome popup should be displayed or not
        this.checkCookie();
        
        
        // set up primary widgets (TODO: move to bike planner module)
        /*this.tipWidget = this.createWidget("otp-tipWidget", "", this);
        this.addWidget(this.tipWidget);
        this.updateTipStep(1);
        
        this.bikestationsWidget = new otp.widgets.BikeStationsWidget('otp-bikestationsWidget', this);
        this.addWidget(this.bikestationsWidget);

        this.noTripWidget = new otp.widgets.Widget('otp-noTripWidget', this);
        this.addWidget(this.noTripWidget);*/
    },
    
    restore : function() {
        // check URL params for restored trip
        if("fromPlace" in this.webapp.urlParams || "toPlace" in this.webapp.urlParams) {
            if("itinIndex" in this.webapp.urlParams) this.restoredItinIndex = this.webapp.urlParams["itinIndex"];
            if("mode" in this.webapp.urlParams) 
                this.restoreTrip(_.omit(this.webapp.urlParams, ["module", "itinIndex"]));
            else {
                this.restoreMarkers(this.webapp.urlParams);
                this.zoomOnMarkers(this.webapp.urlParams);
            }
        }
    },
    
    addMapContextMenuItems : function() {
        var this_ = this;
        this.webapp.map.addContextMenuItem("Set as Start Location", function(latlng) {
            this_.setStartPoint(latlng, true);
            this_.optionsWidget.updateURL();
        });
        this.webapp.map.addContextMenuItem("Set as End Location", function(latlng) {
            this_.setEndPoint(latlng, true);
            this_.optionsWidget.updateURL();
        });
    },

    handleClick : function(event) {
        
    },
   
    
    setStartPoint : function(latlng, update, name) {
        this.startName = (typeof name !== 'undefined') ? name : null;
        this.startLatLng = (typeof latlng !== 'undefined') ? latlng : null;

        if(this.startMarker == null && this.startLatLng != null) {
            this.startMarker = new L.Marker(this.startLatLng, {icon: this.icons.startFlag, draggable: true});
            this.startMarker.bindPopup('<strong>Start</strong> </br> <a href="javascript:new otp.modules.planner.PlannerModule().markerLocationLink(\'start\')">Link to the location</a> </br> \n\
                                        <a href="javascript:new otp.modules.planner.PlannerModule().showStreetView(\'start\')">go to Street View</a>');
            this.startMarker.on('dragend', $.proxy(function() {
                this.webapp.hideSplash();
                this.startLatLng = this.startMarker.getLatLng();
                this.invokeHandlers("startChanged", [this.startLatLng]);
                if(typeof this.userPlanTripStart == 'function') this.userPlanTripStart();
                this.planTripFunction.apply(this);//planTrip();
            }, this));
            this.markerLayer.addLayer(this.startMarker);
        }
        else if (this.startLatLng != null) { // marker already exists
            this.startMarker.setLatLng(latlng);
        }
        
        this.invokeHandlers("startChanged", [latlng, name]);
        
        if(update) {
            this.updateTipStep(2);
            if(this.endLatLng) {
                if(typeof this.userPlanTripStart == 'function') this.userPlanTripStart();
                this.planTripFunction.apply(this);//this.planTrip(); 
            }
        }
    },
   
    
    setEndPoint : function(latlng, update, name) {
        this.endName = (typeof name !== 'undefined') ? name : null;
        this.endLatLng = (typeof latlng !== 'undefined') ? latlng : null;    	 
        if(this.endMarker == null && this.endLatLng != null) {
            this.endMarker = new L.Marker(this.endLatLng, {icon: this.icons.endFlag, draggable: true}); 
            this.endMarker.bindPopup('<strong>Destination</strong> </br> <a href="javascript:new otp.modules.planner.PlannerModule().markerLocationLink(\'end\')">Link to the location</a> </br> \n\
                                      <a href="javascript:new otp.modules.planner.PlannerModule().showStreetView(\'end\')">go to Street View</a>');
            this.endMarker.on('dragend', $.proxy(function() {
                this.webapp.hideSplash();
                this.endLatLng = this.endMarker.getLatLng();
                this.invokeHandlers("endChanged", [this.endLatLng]);
                if(typeof this.userPlanTripStart == 'function') this.userPlanTripStart();
                this.planTripFunction.apply(this);//this_.planTrip();
            }, this));
            this.markerLayer.addLayer(this.endMarker);
        }
        else if (this.endLatLng != null) { // marker already exists
            this.endMarker.setLatLng(latlng);
        }
                 
        this.invokeHandlers("endChanged", [latlng, name]);

        if(update) {
            if(this.startLatLng) {
                if(typeof this.userPlanTripStart == 'function') this.userPlanTripStart();
                this.planTripFunction.apply(this);//this.planTrip();
            }
        }
    },
    
    markerLocationLink : function(marker){
        var params = otp.util.Text.getUrlParameters();
        var url = otp.config.siteUrl + '?module=' + params.module + '&';
        if(marker == 'start')
            url += 'fromPlace=' + encodeURIComponent(params.fromPlace);
        else url += 'toPlace=' + encodeURIComponent(params.toPlace);
        window.open(url, '_blank').focus();
    },
    
    showStreetView : function(marker) {
        var params = otp.util.Text.getUrlParameters();
        if(marker == 'start') 
            var place = params.fromPlace;
        else place = params.toPlace;
        var latlng = otp.util.Itin.getLocationPlace(place);
        var url = "http://maps.google.com/maps?q=&layer=c&cbll=" + latlng;
        window.open(url, '_blank').focus();
    },
    
    getStartOTPString : function() {
        return (this.startName !== null ? this.startName + "::" : "")
                 + this.startLatLng.lat + ',' + this.startLatLng.lng;
    },

    getEndOTPString : function() {
        return (this.endName !== null ? this.endName + "::" : "")
                + this.endLatLng.lat+','+this.endLatLng.lng;
    },
        
    restoreTrip : function(queryParams) {    
        this.restoreMarkers(queryParams);
	this.validated = true; // skip planner validation if we are using a link - XXX
        this.planTripFunction.call(this, queryParams);
    },
    
    restoreMarkers : function(queryParams) {
        if(queryParams.fromPlace){
      		this.startLatLng = otp.util.Geo.stringToLatLng(otp.util.Itin.getLocationPlace(queryParams.fromPlace));
    		this.setStartPoint(this.startLatLng, false);
        }
        
    	if(queryParams.toPlace){
      		this.endLatLng = otp.util.Geo.stringToLatLng(otp.util.Itin.getLocationPlace(queryParams.toPlace));
    		this.setEndPoint(this.endLatLng, false);
        }
    },
    
    zoomOnMarkers : function(params) {
        if (otp.config.zoomToFitResults) {
            this.webapp.map.initialGeolocation = false;
            if("fromPlace" in params && "toPlace" in params)
                this.webapp.map.lmap.fitBounds(otp.util.Itin.getBoundsArray(this.startLatLng, this.endLatLng), { padding: [60, 60] });
            else {
                if("fromPlace" in params)
                    var latLng = this.startLatLng;                
                else 
                    latLng = this.endLatLng;
                this.webapp.map.lmap.setView(latLng, otp.config.gpsZoom);
            }
        }
    },
    
    checkAutocomplete: function(results, obj, inputSelected) {
        // Array of autocomplete results, user input jquery object, start or end
        // Look for a match in the autocomplete results with the value of the input box and verify that the latlng matches

        ret = {};
        resultsList = results['result']; // from validate

        for (var key in resultsList) {
                tmp = key;
                desc = resultsList[key].description;

                resultLatLng = "(" + parseFloat(resultsList[key].lat).toFixed(5) + ', ' + parseFloat(resultsList[key].lng).toFixed(5) + ")";

                // Either an exact match, or (BUILDING) match, and "My Location"
                if (desc == obj.val() ||
                    desc.indexOf( "(" + obj.val().toUpperCase() + ")" ) == 0) {

        	        // Name matches, but latlng doesn't. Update the result
                    if (inputSelected == 'start' && this.startLatLng != resultLatLng) obj[0].selectItem( key );
                    else if (inputSelected == 'end' && this.endLatLng != resultLatLng) obj[0].selectItem( key );

                    ret['pos'] = resultsList[key];
                    break;
                }

                // The input is somewhere in the key
                // 1 result + 'my location'
                else if (desc.toLowerCase().indexOf( obj.val().toLowerCase() ) != -1 && Object.keys(resultsList).length == 2) {

                    obj[0].selectItem( key );

                    ret['pos'] = resultsList[key];
                    break;
                }
                // XXX Input is in the key AND results.length > 1 (maybe more than 1 match) ... ask
        }

        if (typeof(ret) == "object" && ret['pos'] != undefined) return ret;

        return false;
    },
  
    validate : function() {
	// Perform geocoder ajax to verify start/endpoints iff:
	// 1) The inputs are non-empty AND,
	// 2) Both autocomplete results are not available

	// Verify the endpoints by checking:
	// 1) The names are within the list of results,
	// 2) The latlng matches what it should
	// If either does not match, check geocoder again and then tell the user

	// Find the tripoptions widget
	widget_id = -1;
   	for (i=0; i < this.widgets.length; i++) {
		if (this.widgets[i].id == "otp-planner-optionsWidget") widget_id = i;
	} 

	cantValidate = false;

	if (widget_id > -1) {

		var that = {'this': this, 'widget_id': widget_id, 'existingQueryParams': this._existingQueryParams, 'apiMethod': this._apiMethod};

		startInput = this.widgets[widget_id].controls.locations.startInput;
		endInput = this.widgets[widget_id].controls.locations.endInput;

		// CHECK START/END AGAINST AUTOCOMPLETE RESULTS
		start_result = {'pos': undefined, 'result': startInput.data('results') || {}};
		end_result = {'pos': undefined, 'result': endInput.data('results') || {}};

		ret = false;

		// if start isnt validated
		if (this._valid.indexOf('start') == -1) {

			// Handle case when latlng manually set
			if (startInput.val()[0] == '(') {
				if (this.startLatLng == undefined) {
					str = startInput.val().replace("(", "").replace(")", "").split(', ');
					this.startLatLng = new L.LatLng(parseFloat(str[0]), parseFloat(str[1]));				
				}
				start_result['pos'] = this.startLatLng; 
				ret = true; // Assume user knows what they are doing by clicking map or using my location
			}
			else if (startInput.val().length > 0 && start_result['pos'] == undefined) {
				ret = this.checkAutocomplete(start_result, startInput, 'start' );
                                if (ret != false) start_result['pos'] = ret['pos'];
			}

                        if (start_result['pos'] != undefined && start_result['pos'].lat == 0) ret = false;

			if (ret != false) {
				this._valid.push('start');

				if (start_result['pos'] != undefined) {
					this.startLatLng = start_result['pos'];
				}
			}
			else if (this._valid.indexOf('start_geocode') == -1) {
				this._valid.push('start_geocode');
				this._validTimer = false;

               			this.webapp.geocoders[0].geocode(startInput.val(), function(results) {
		                        ctrl = that.this.widgets[that.widget_id].controls.locations.startInput;
       	        		        ctrl.data('results', ctrl[0].module.getResultLookup(results) );

					clearTimeout( that.this._validTimeout );

					if (that.this._validTimer == false)
                                                that.this._validTimer = setTimeout( function() { that.this.validate() }, 500 );
				});

                                if (this._validTimeout == false) {
					// in case of error or timeout, fire a planTrip to keep the validation going and alert if things dont work out
					this._validTimeout = setTimeout( function() { this.validate() }, 2000 );
				}

			}
			else {
				if (start_result['pos'] == undefined) this.startLatLng = null;
				cantValidate = true;
			}
		}

		// if end isnt validated
                if (this._valid.indexOf('end') == -1) {

                        // Handle case when latlng manually set
                        if (endInput.val()[0] == '(') {
                               if (this.endLatLng == undefined) {
                                        str = endInput.val().replace("(", "").replace(")", "").split(', ');
                                        this.endLatLng = new L.LatLng(parseFloat(str[0]), parseFloat(str[1]));
                                }
                                end_result['pos'] = this.endLatLng;
                                ret = true; // Assume user knows what they are doing by clicking map or using my location
                        }
                        else if (endInput.val().length > 0 && end_result['pos'] == undefined) {
                                ret = this.checkAutocomplete(end_result, endInput, 'end' );
				if (ret != false) end_result['pos'] = ret['pos'];
			}

			if (end_result['pos'] != undefined && end_result['pos'].lat == 0) ret = false;

                        if (ret != false) {
                                this._valid.push('end');

				if (end_result['pos'] != undefined) {
	                                this.endLatLng = end_result['pos'];
				}
                        }
                        else if (this._valid.indexOf('end_geocode') == -1) {
                                this._valid.push('end_geocode');
                                this._validTimer = false;

                                this.webapp.geocoders[0].geocode(endInput.val(), function(results) {
                                        ctrl = that.this.widgets[that.widget_id].controls.locations.endInput;
                                        ctrl.data('results', ctrl[0].module.getResultLookup(results) );

                                        clearTimeout( that.this._validTimeout );

                                        if (that.this._validTimer == false)
                                                that.this._validTimer = setTimeout( function() { that.this.validate() }, 500 );
                                });

				if (this._validTimeout == false) {
	                                // in case of error or timeout, fire a planTrip to keep the validation going and alert if things dont work out
        	                        this._validTimeout = setTimeout( function() { this.validate() }, 2000 );
				}

                        }
                        else {
				if (end_result['pos'] == undefined) this.endLatLng = null;

				cantValidate = true;
			}

		}

	}

	if (cantValidate) {
		alert("Please select a start and end location.");
		return;
	}
	
	var val = $('#otp-planner-optionsWidget-timeSelector-time').val();
    var re = new RegExp("((^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$)|(^(00|0?[0-9]|1[012]):[0-5][0-9]((a|p)m|(A|P)M)$))");
    if(!re.test(val)){
        alert("Please enter a valid time in 12 hr or 24 hr format.");
        return;
    }

    // The following block of code decompose the date manually entered and make sure this date is valid.
    if (this.date.indexOf('-') != -1) var comp = this.date.split("-"); // OTP sends dates back as %m-%d-%Y
    else var comp = this.date.split('/');
    var m = parseInt(comp[0], 10);
    var d = parseInt(comp[1], 10);
    var y = parseInt(comp[2], 10);
    var date2 = new Date(y,m-1,d);
    if(!(date2.getFullYear() == y && date2.getMonth() + 1 == m && date2.getDate() == d)) {
        alert('Please enter a valid date.');
        return;
    }

	// rely on ajax callback
	if (this._valid.indexOf('start') == -1 || this._valid.indexOf('end') == -1) return;

	this.validated = true;

        this.planTrip( this._queryParams, this._apiMethod );

    },
 
    planTrip : function(existingQueryParams, apiMethod) {
   
    logGAEvent('click', 'link', 'plan trip');

        if(typeof this.planTripStart == 'function') this.planTripStart();

	this._queryParams = existingQueryParams;
	this._apiMethod = apiMethod;

	if (!this.validated) {
		this._valid = [];
		return this.validate();
	}

	this.validated = false;

        //this.noTripWidget.hide();
    	
    	if(this.currentRequest !== null)
        {
        	this.currentRequest.abort();
        	this.currentRequest = null;
        }
    	
    	apiMethod = apiMethod || 'plan';
        var url = otp.config.hostname + '/' + otp.config.restService + '/' + apiMethod;
        this.pathLayer.clearLayers();        
        
        var this_ = this;
        
        var queryParams = null;
        
        if(existingQueryParams) {
        	queryParams = existingQueryParams; 	        	
        }
        else
        {
            if(this.startLatLng == null || this.endLatLng == null) {
                alert("Please select a start and end location!");
                return;
            }
            
            var addToStart = this.arriveBy ? 0 : this.startTimePadding;
       	    queryParams = {             
                fromPlace: this.getStartOTPString(),
                toPlace: this.getEndOTPString(),
                time : (this.time) ? otp.util.Time.correctAmPmTimeString(this.time) : moment().format("h:mma"),
                //time : (this.time) ? moment(this.time).add("s", addToStart).format("h:mma") : moment().add("s", addToStart).format("h:mma"),
                date : (this.date) ? moment(this.date, otp.config.locale.time.date_format).format("MM-DD-YYYY") : moment().format("MM-DD-YYYY"),
                mode: this.mode,
                maxWalkDistance: this.maxWalkDistance
            };
	    if(this.wheelchair !== null) _.extend(queryParams, { wheelchair : this.wheelchair } );
            if(this.arriveBy !== null) _.extend(queryParams, { arriveBy : this.arriveBy } );
            if(this.preferredRoutes !== null) {
                queryParams.preferredRoutes = this.preferredRoutes;
                if(this.otherThanPreferredRoutesPenalty !== null) 
                    queryParams.otherThanPreferredRoutesPenalty = this.otherThanPreferredRoutesPenalty;             
            }    
            if(this.bannedRoutes !== null) _.extend(queryParams, { bannedRoutes : this.bannedRoutes } );
            if(this.bannedTrips !== null) _.extend(queryParams, { bannedTrips : this.bannedTrips } );
            if(this.optimize !== null) _.extend(queryParams, { optimize : this.optimize } );
            if(this.optimize === 'TRIANGLE') {
                _.extend(queryParams, {
                    triangleTimeFactor: this_.triangleTimeFactor,
                    triangleSlopeFactor: this_.triangleSlopeFactor,
                    triangleSafetyFactor: this_.triangleSafetyFactor
                });
            } 
            _.extend(queryParams, this.getExtendedQueryParams());
            if(otp.config.routerId !== undefined) {
                queryParams.routerId = otp.config.routerId;
            }
        } 	
        $('#otp-spinner').show();
        
        this.lastQueryParams = queryParams;

        this.planTripRequestCount = 0;
        
        this.planTripRequest(url, queryParams, function(tripPlan) {
            var restoring = (existingQueryParams !== undefined)
            this_.processPlan(tripPlan, restoring);
            
            this_.updateTipStep(3);
        });
    },
    
    planTripRequest : function(url, queryParams, successCallback) {
        var this_ = this;
        this.currentRequest = $.ajax(url, {
            data:       queryParams,
            dataType:   'JSON',
                
            success: function(data) {
                $('#otp-spinner').hide();
                
                if (otp.config.debug) {
                    otp.debug.processRequest(data)
                }

                if(data.plan) {
                    // compare returned plan.date to sent date/time to determine timezone offset (unless set explicitly in config.js)
                    otp.config.timeOffset = (otp.config.timeOffset) ||
                        (moment(queryParams.date+" "+queryParams.time, "MM-DD-YYYY h:mma") - moment(data.plan.date))/3600000;

                    var tripPlan = new otp.modules.planner.TripPlan(data.plan, queryParams);
                    
                    var invalidTrips = [];
                    
                    // check trip validity
                    if(typeof this_.checkTripValidity == 'function') {
                        for(var i = 0; i < tripPlan.itineraries.length; i++) {
                            var itin = tripPlan.itineraries[i];
                            for(var l = 0; l < itin.itinData.legs.length; l++) {
                                var leg = itin.itinData.legs[l];
                                if(otp.util.Itin.isTransit(leg.mode)) {
                                    var tripId = leg.agencyId + "_"+leg.tripId;
                                    if(!this_.checkTripValidity(tripId, leg, itin)) {
                                        invalidTrips.push(tripId);
                                    }
                                } 
                            }
                        }
                    }

                    if(invalidTrips.length == 0) { // all trips are valid; proceed with this tripPlan
                        successCallback.call(this_, tripPlan);
                    }
                    else { // run planTrip again w/ invalid trips banned
                        this_.planTripRequestCount++;
                        if(this_.planTripRequestCount > 10) {
                            this_.noTripFound({ 'msg' : 'Number of trip requests exceeded without valid results'});
                        }
                        else {
                            if(queryParams.bannedTrips && queryParams.bannedTrips.length > 0) {
                                queryParams.bannedTrips += ',' + invalidTrips.join(',');
                            }
                            else {
                                queryParams.bannedTrips = invalidTrips.join(',');
                            }
                            this_.planTripRequest(url, queryParams, successCallback);
                        }
                    }                    
                }
                else {
                    this_.noTripFound(data.error);
                    //this_.noTripWidget.setContent(data.error.msg);
                    //this_.noTripWidget.show();
                }
            }
        });

    },
    
    getExtendedQueryParams : function() {
        return { };
    },
    
    processPlan : function(tripPlan, restoring) {
    },
    
    noTripFound : function(error) {
        var msg = error.msg;
        if(error.id) msg += ' (Error ' + error.id + ')';
        otp.widgets.Dialogs.showOkDialog(msg, 'No Trip Found');
    },
    
    drawItinerary : function(itin) {
        var this_ = this;
                
        this.pathLayer.clearLayers();
        this.pathMarkerLayer.clearLayers();
    
        var queryParams = itin.tripPlan.queryParams;
        
        for(var i=0; i < itin.itinData.legs.length; i++) {
            var leg = itin.itinData.legs[i];

            // draw the polyline
            var polyline = new L.Polyline(otp.util.Geo.decodePolyline(leg.legGeometry.points));
            var weight = 8;
            // Added specific code for the HART bus line so that the hart bus line route will be highlighted in blue
            // Any other route will be highlighted in the default color which is green.
            if (leg.agencyId == "Hillsborough Area Regional Transit") {
                polyline.setStyle({ color : '#0000FF', weight: weight });
            }
            else if (leg.agencyId == "USF Bull Runner") {
                var colour = '#080';
                if (leg.routeShortName == 'A') colour = '#00573C';
                else if (leg.routeShortName == 'B') colour = '#0077D1';
                else if (leg.routeShortName == 'C') colour = '#AC49D0';
                else if (leg.routeShortName == 'D') colour = '#F70505';
                else if (leg.routeShortName == 'E') colour = '#bca510';
                else if (leg.routeShortName == 'F') colour = '#8F6A51';
                polyline.setStyle({ color: colour, weight: weight });
            }
            else polyline.setStyle({ color : this.getModeColor(leg.mode), weight: weight });

            this.pathLayer.addLayer(polyline);

            polyline.leg = leg;
            polyline.bindPopup("("+leg.routeShortName+") "+leg.routeLongName);

            /* Attempt at hover functionality for trip segments on map; disabled due to "flickering" problem
               Alt. future approach: create invisible polygon buffers around polylines
            
            polyline.on('mouseover', function(e) {
                if(e.target.hover) return;
                this_.highlightLeg(e.target.leg);
                this_.pathMarkerLayer.clearLayers();
                this_.drawStartBubble(e.target.leg, true);
                this_.drawEndBubble(e.target.leg, true);
                e.target.hover = true;
            });
            polyline.on('mouseout', function(e) {
                var lpt = e.layerPoint, minDist = 100;
                for(var p=0; p<e.target._parts[0].length-1; p++) {
                    var dist = L.LineUtil.pointToSegmentDistance(lpt, e.target._parts[0][p], e.target._parts[0][p+1]);
                    minDist = Math.min(minDist, dist)
                }
                if(minDist < weight/2) return;
                this_.clearHighlights();
                this_.pathMarkerLayer.clearLayers();
                this_.drawAllStartBubbles(itin);
                e.target.hover = false;
            });
            */
            
            if(otp.util.Itin.isTransit(leg.mode)) {
                this.drawStartBubble(leg, false);
            }
            else if(leg.mode === 'BICYCLE') {
                if(queryParams.mode === 'WALK,BICYCLE') { // bikeshare trip
                	polyline.bindPopup('Your '+otp.config.bikeshareName+' route');
                    //var start_and_end_stations = this.processStations(polyline.getLatLngs()[0], polyline.getLatLngs()[polyline.getLatLngs().length-1]);
                }
                else { // regular bike trip
                	polyline.bindPopup('Your bike route');
                	//this.resetStationMarkers();
                }	
            }
            else if(leg.mode === 'WALK') {
                if(queryParams.mode === 'WALK,BICYCLE') { 
                    if(i == 0) {
                    	polyline.bindPopup('Walk to the '+otp.config.bikeshareName+' dock.');
                    }
                    if(i == 2) {
                    	polyline.bindPopup('Walk from the '+otp.config.bikeshareName+' dock to your destination.');
                    }
                }
                else { // regular walking trip
                	polyline.bindPopup('Your walk route');
                	//this.resetStationMarkers();
                }
            }
        }
        if (otp.config.zoomToFitResults) {
		this.webapp.map.initialGeolocation = false; // Make sure we aren't waiting for our initial GPS fix - only zoom/pan to the trip, NOT the location too
		this.webapp.map.lmap.fitBounds(otp.util.Itin.getBoundsArray(this.startLatLng, this.endLatLng), { padding: [60, 60] });
	}

    },
    
    highlightLeg : function(leg) {
        if(!leg.legGeometry) return;
        var polyline = new L.Polyline(otp.util.Geo.decodePolyline(leg.legGeometry.points));
        polyline.setStyle({ color : "yellow", weight: 16, opacity: 0.3 });
        this.highlightLayer.addLayer(polyline);
    },
    
    clearHighlights : function() {
        this.highlightLayer.clearLayers(); 
    },
    
    drawStartBubble : function(leg, highlight) {
        var quadrant = (leg.from.lat < leg.to.lat ? 's' : 'n')+(leg.from.lon < leg.to.lon ? 'w' : 'e');
        var modeIcon = this.icons.getModeBubble(quadrant, leg.startTime, leg.mode, true, highlight);
        var marker = L.marker([leg.from.lat, leg.from.lon], {icon: modeIcon});
        this.pathMarkerLayer.addLayer(marker);
    },

    drawEndBubble : function(leg, highlight) {
        var quadrant = (leg.from.lat < leg.to.lat ? 'n' : 's')+(leg.from.lon < leg.to.lon ? 'e' : 'w');
        var modeIcon = this.icons.getModeBubble(quadrant, leg.endTime, leg.mode, false, highlight);
        var marker = L.marker([leg.to.lat, leg.to.lon], {icon: modeIcon});
        this.pathMarkerLayer.addLayer(marker);
    },
    
    drawAllStartBubbles : function(itin) {
        itin = itin.itinData;
        for(var i=0; i < itin.legs.length; i++) {
            var leg = itin.legs[i];
            if(otp.util.Itin.isTransit(leg.mode)) {
                this.drawStartBubble(leg, false);        
            }
        }
    },
    
    getModeColor : function(mode) {
        if(mode === "WALK") return '#444';
        if(mode === "BICYCLE") return '#080';
        if(mode === "SUBWAY") return '#f00';
        if(mode === "RAIL") return '#b00';
        if(mode === "BUS") return '#FF7700';
        if(mode === "TRAM") return '#800';
        if(mode === "CAR") return '#444';
        return '#aaa';
    },
    
    clearTrip : function() {
    
        if(this.startMarker) this.markerLayer.removeLayer(this.startMarker);
        this.startName = this.startLatLng = this.startMarker = null;
        
        if(this.endMarker) this.markerLayer.removeLayer(this.endMarker);
        this.endName = this.endLatLng = this.endMarker = null;

        this.pathLayer.clearLayers();
        this.pathMarkerLayer.clearLayers();    
    },
        
    savePlan : function(data) {
    	
    	var data_ = {data: data, startLat: this.startLatLng.lat, startLon: this.startLatLng.lng, endLat: this.endLatLng.lat, endLon: this.endLatLng.lng, parrent : this.currentHash };
    	otp.util.DataStorage.store(data_, this );
    },
    
    // legacy -- deprecated by restoreTrip (above)
    restorePlan : function(data){
    	
    	this.startLatLng = new L.LatLng(data.startLat, data.startLon);
    	this.setStartPoint(this.startLatLng, false);
    	
    	this.endLatLng = new L.LatLng(data.endLat, data.endLon);
    	this.setEndPoint(this.endLatLng, false);
    	
    	this.webapp.setBounds(new L.LatLngBounds([this.startLatLng, this.endLatLng]));
    	
    	this.planTrip(data.data, true);
    },
        
    
    newTrip : function(hash) {
    	this.currentHash = hash;	
    	
    	window.location.hash = this.currentHash;
    	
        /*var shareRoute = $("#share-route");
        shareRoute.find(".addthis_toolbox").attr("addthis:url", otp.config.siteURL+"/#"+this.currentHash);
        addthis.toolbox(".addthis_toolbox_route");*/
    },
    
    distance : function(x1, y1, x2, y2) {
        return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
    },
    
    updateTipStep : function(step) { // TODO: factor out to widget class
        /*if (step <= this.tipStep) return;
        if(step == 1) this.tipWidget.setContent("To Start: Click on the Map to Plan a Trip.");
        if(step == 2) this.tipWidget.setContent("Next: Click Again to Add Your Trip's End Point.");
        if(step == 3) this.tipWidget.setContent("Tip: Drag the Start or End Flags to Modify Your Trip.");
        
        this.tipStep = step;*/
    },
    
    routesLoaded : function() {
    },
    
    CLASS_NAME : "otp.modules.planner.PlannerModule"
});
