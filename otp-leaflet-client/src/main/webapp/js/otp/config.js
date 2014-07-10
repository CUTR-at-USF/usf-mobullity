// make sure we have otp.config and otp.config.locale defined
if(typeof(otp) == "undefined" || otp == null) otp = {};
if(typeof(otp.config) == "undefined" || otp.config == null) otp.config = {};
//if(typeof(otp.config.locale) == "undefined" || otp.config.locale == null) otp.config.locale = otp.locale.English;


otp.config = {
    debug: false,
    
    /**
     * The OTP web service locations
     */
    hostname : "http://localhost:8080",
    //municoderHostname : "http://localhost:8080",
    //datastoreUrl : 'http://localhost:9000',


    /**
     * Base layers: the base map tile layers available for use by all modules.
     * Expressed as an array of objects, where each object has the following 
     * fields:
     *   - name: <string> a unique name for this layer, used for both display
     *       and internal reference purposes
     *   - tileUrl: <string> the map tile service address (typically of the
     *       format 'http://{s}.yourdomain.com/.../{z}/{x}/{y}.png')
     *   - attribution: <string> the attribution text for the map tile data
     *   - [subdomains]: <array of strings> a list of tileUrl subdomains, if
     *       applicable
     *       
     */
     
    baseLayers: [
        {
            name: 'MapQuest OSM',
            tileUrl: 'http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
            subdomains : ['otile1','otile2','otile3','otile4'],
            attribution : 'Data, imagery and map information provided by <a href="http://open.mapquest.com" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'
        },
        {
            name: 'MapQuest Aerial',
            tileUrl: 'http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png',
            subdomains : ['otile1','otile2','otile3','otile4'],
            attribution : 'Data, imagery and map information provided by <a href="http://open.mapquest.com" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'
        },   
    ],
    

    /**
     * Map start location and zoom settings: by default, the client uses the
     * OTP metadata API call to center and zoom the map. The following
     * properties, when set, override that behavior.
     */
    
    //set init lat lng in map.js with geolocation
    geoLocation: true,
    //if user does not allow location finding default location set
    initLatLng : new L.LatLng(28.058499, -82.416945), 
    initZoom : 14,
    minZoom : 8,
    maxZoom : 20,

    	  
    /**
     * Site name / description / branding display options
     */

    siteName            : "MoBullity",
    siteDescription     : "An OpenTripPlanner deployment for USF.",
    logoGraphic         : 'images/USF-v-green.png',
    // bikeshareName    : "",

    showLogo            : true,
    showTitle           : true,
    showModuleSelector  : true,
    metric              : false,
    showBusStops		: true,
    showBusPositions	: true,


    /**
     * Modules: a list of the client modules to be loaded at startup. Expressed
     * as an array of objects, where each object has the following fields:
     *   - id: <string> a unique identifier for this module
     *   - className: <string> the name of the main class for this module; class
     *       must extend otp.modules.Module
     *   - [defaultBaseLayer] : <string> the name of the map tile base layer to
     *       used by default for this module
     *   - [isDefault]: <boolean> whether this module is shown by default;
     *       should only be 'true' for one module
     */
    
    modules : [
        {
            id : 'planner',
            className : 'otp.modules.multimodal.MultimodalPlannerModule',
            defaultBaseLayer : 'MapQuest OSM',
            isDefault: true
        },
//       {
//            id : 'analyst',
//            className : 'otp.modules.analyst.AnalystModule',
//        }
    ],
    
    
    /**
     * Geocoders: a list of supported geocoding services available for use in
     * address resolution. Expressed as an array of objects, where each object
     * has the following fields:
     *   - name: <string> the name of the service to be displayed to the user
     *   - className: <string> the name of the class that implements this service
     *   - url: <string> the location of the service's API endpoint
     *   - addressParam: <string> the name of the API parameter used to pass in
     *       the user-specifed address string
     */

    geocoders : [
                {
                	 name: "Geocoder",
                	 className: "otp.core.Geocoder",
                	 url: "/otp-geocoder/geocode",
                	 addressParam: "address",
                 }
    ],

    
    /**
     * Info Widgets: a list of the non-module-specific "information widgets"
     * that can be accessed from the top bar of the client display. Expressed as
     * an array of objects, where each object has the following fields:
     *   - content: <string> the HTML content of the widget
     *   - [title]: <string> the title of the widget
     *   - [cssClass]: <string> the name of a CSS class to apply to the widget.
     *        If not specified, the default styling is used.
     */


    infoWidgets: [
        {
        	title: 'Live Map',
        	content: 'Choose the Bull Runner routes to display:<br>\
        		<form name="BullRunnerRoutes" id="BRroutes" onSubmit="return liveMapFunc()">\
        		<input type="checkbox" name="routes" value="RouteA" id="RouteA"> Route A<br>\
        		<input type="checkbox" name="routes" value="RouteB" id="RouteB"> Route B<br>\
        		<input type="checkbox" name="routes" value="RouteC" id="RouteC"> Route C<br>\
        		<input type="checkbox" name="routes" value="RouteD" id="RouteD"> Route D<br>\
        		<input type="checkbox" name="routes" value="RouteE" id="RouteE"> Route E<br>\
        		<input type="checkbox" name="routes" value="RouteF" id="RouteF"> Route F<br>\
        		<input type="submit">\
        		</form>',
        	cssClass: 'livemap-window',
        },
        {
            title: 'Help',
            content: '<p>Need Help getting started?</p>\
            	<p>In order to view the Bus Live Map, you must click the live map button and select the routes you want to see. Then Click submit for them to appear on the map!</p>\
            	<p>In order to plan a trip, you must select a start location and an end location by clicking on the map or typing a location into the start and end fields.	Then choose your desired travel options and click Plan Trip!</p>\
            	<p>Tip: If the location you are looking for does not come up in search, try adding the city to the search field to get better results. If you cant find a particular USF building just add USF to the search as well.</p>',
        },
    {
    	title: 'Icon Legend',
    	content: '<p><img src="images/locationSpot.svg" height="15" width="15"> : Current Location<br>\
    		<img src="images/busStopButton.png" height="15" width="15"> : BullRunner Bus Stop<br>\
    		<img src="images/stop20.png" height="15" width="15"> : HART Bus Stop</p>'        	
    },
  {	
	title: 'Contact',
	content: '<p> Contact information for questions or comments:</p>\
		<p>Tracy Wolf: tnwolf@mail.usf.edu<br>Mona Fathollahi: mona2@mail.usf.edu<br>Sean Barbeau: barbeau@cutr.usf.edu</p>'
},

    ],
    
    
    /**
     * Support for the "AddThis" display for sharing to social media sites, etc.
     */
     
    showAddThis     : true,
    siteURL			: 'http://mobullity.forest.usf.edu',
    addThisTitle    : 'Check out the MoBullity Webapp!',
    siteDescription : 'OpenTripPlanner for USF',
    addThisPubId    : 'ra-525818cf0207df3a',


    /**
     * Formats to use for date and time displays, expressed as ISO-8601 strings.
     */    
     
    timeFormat  : "h:mma",
    dateFormat  : "MMM Do YYYY"
};