function sendfeedback() {
    var email = 'barbeau@cutr.usf.edu';
    var subject = 'USF Maps feedback';
    var body = '%0D%0A%0D%0A%0D%0AThe%20below%20information%20helps%20us%20troubleshoot%20problems:%0D%0A' + navigator.userAgent;// + '%0D%0AGeolocation:'+ navigator.geolocation.getCurrentPosition();
    var content = '<p>We welcome questions and comments! Send feedback to Sean Barbeau (<a style="color:white" href="mailto:' + email + '?subject=' + subject + '&body=' + body + '">' + email + '</a>).</p>';
    return content;
}

otp.config = {
    debug: false,
    locale: otp.locale.English,
    
    //All available locales
    //key is translation name. Must be the same as po file or .json file
    //value is name of settings file for localization in locale subfolder
    //File should be loaded in index.html
    locales : {
        'en': otp.locale.English,
        'de': otp.locale.German,
        'sl': otp.locale.Slovenian,
        'fr': otp.locale.French,
        'it': otp.locale.Italian,
        'ca_ES': otp.locale.Catalan
    },
 
	
    /**
     * The OTP web service locations
     */
    hostname : "",
    //municoderHostname : "http://localhost:8080",
    //datastoreUrl : 'http://localhost:9000',
	   // In the 0.10.x API the base path is "otp-rest-servlet/ws"
    // From 0.11.x onward the routerId is a required part of the base path.
    // If using a servlet container, the OTP WAR should be deployed to context path /otp/v0
    restService: "otp/routers/default",


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
     *   - Note: if the names of the layers are changed the attribute "defaultBaseLayer"
     *     need to be updated to reflect this change. This attribute specify, based on the name,
     *     which layer will be use by default.
     */
     
    baseLayers: [
        {
            name: 'Map',
            tileUrl: 'http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
            subdomains : ['otile1','otile2','otile3','otile4'],
            attribution : 'Data, imagery and map information provided by <a href="http://open.mapquest.com" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'
        },
        {
            name: 'Satellite',
            tileUrl: 'http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png',
            subdomains : ['otile1','otile2','otile3','otile4'],
            attribution : 'Data, imagery and map information provided by <a href="http://open.mapquest.com" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'
        },  
        {
            name: 'Hybrid',
            tileUrl: 'http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png',
            overlayUrl: "http://{s}.mqcdn.com/tiles/1.0.0/hyb/{z}/{x}/{y}.png",
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
    initLatLng : new L.LatLng(28.061062, -82.413200), 
    mapBoundary: false,
    initZoom : 15, /* Default zoom w/o GPS (15 = entire viewport big enough for Tampa campus) */
    minZoom : 13, /* Smaller numbers allow farther zooms (zoom OUT) */
    maxZoom : 18, /* Larger numbers allow closer zooms (zoom IN) */
    gpsZoom : 17, /* The default zoom on load when GPS location is available */
    
    /* Whether the map should be moved to contain the full itinerary when a result is received. */
    zoomToFitResults    : true,

    	  
    /**
     * Site name / description / branding display options
     */

    siteName            : "USF Maps",
    siteDescription     : "An OpenTripPlanner deployment for USF.",
    logoGraphic         : 'images/usf-h-gold.png',
    // bikeshareName    : "",
  //Enable this if you want to show frontend language chooser
    showLanguageChooser : true,

    showLogo            : true,
    showTitle           : false,
    showModuleSelector  : true,
    metric              : false,
    
    showBullRunnerStops	: true,
    showHartBusStops	: false,
    showBusPositions	: true,
    showBikeStations	: true,
    showBikeLanes		: true,

    showWidgetMenu      : false, /* The old-style drop down menu with all active widgets ... 'gears icon' */

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
            defaultBaseLayer : 'Map',
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
            name: 'Geocoder',
            className: 'otp.core.Geocoder',
            url: [ "http://" + window.location.hostname + ":8181/otp-geocoder/geocode", "http://mobullity.forest.usf.edu:8181/otp-geocoder/geocode" ],

            addressParam: 'address',
            // URL and query parameter do not need to be set for built-in geocoder.
        }
  //              {
  //              	 name: "Geocoder",
  //              	 className: "otp.core.Geocoder",
  //              	 url: "/otp-geocoder/geocode",
  //              	 addressParam: "address",
  //               }
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
    	title: 'Help',
    	content: '<p><img src="images/locationSpot.svg" height="15" width="15"> : Current Location<br>\
    		<img src="images/busStopButton.png" height="15" width="15"> : BullRunner Bus Stop<br>\
    		<img src="images/stop20.png" height="15" width="15"> : HART Bus Stop<br> </p>\
    		<p> We would like to acknowledge the support and funding assistance provided by the USF Student Green Energy Fund, Center for Urban Transportation Research, and Florida Department of Transportation.</p>' 
        },
        {	
        title: 'Send Feedback',
        content: sendfeedback() + '<p>Like hacking things? This project is open-source - see how you can help at <a style="color:white" href="https://github.com/CUTR-at-USF/usf-mobullity">usf-mobullity on Github</a>. </p>' 
        },

    ],




    /**
     * Formats to use for date and time displays, expressed as ISO-8601 strings.
     */    
     
    timeFormat  : "h:mma",
    dateFormat  : "MMM Do YYYY"

    	
}
