function sendfeedback() {
    var email = 'barbeau@cutr.usf.edu';
    var subject = 'USF Maps feedback';
    var body = '%0D%0A%0D%0A%0D%0AThe%20below%20information%20helps%20us%20troubleshoot%20problems:%0D%0A' + navigator.userAgent;// + '%0D%0AGeolocation:'+ navigator.geolocation.getCurrentPosition();
    var content = '<p>We welcome questions and comments! Send feedback to Sean Barbeau (<a style="color:white" href="mailto:' + email + '?subject=' + subject + '&body=' + body + '">' + email + '</a>).</p>';
    return content;
}

/* Define layers icons */
L.layersIcon = L.DivIcon.extend({
    options: {
        iconSize: [35, 45],
        iconAnchor: [18, 45],
        popupAnchor: [0, -45],
        icon: '',
        className: 'layersIcon',
        color: 'blue',
    },

    initialize: function(opts) {
        options = L.Util.setOptions(this, opts);
    },

    createIcon: function() {
        var div = document.createElement("div");
        div.innerHTML = "<i class='"+this.options.icon+"'></i>";

        div.style = "width: "+this.options.iconSize[0]+"px; height:  "+this.options.iconSize[1]+"px";

        this.options['className'] += ' layersIcon-' + this.options.color;

        this._setIconStyles(div, 'icon');

        return div;
    },

});

otp.config = {
    debug: false,
    locale: otp.locale.English,

    // in EM (4.615em is 60px on regular desktop browsers) - converted to PX in index.html by jQuery function
    // Used by js/otp/modules/planner/PlannerModule.js zoomOnMarkers, and drawItinerary
    zoomPadding: [4.615, 4.615],  
    
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
            tileUrl: 'https://api.mapbox.com/styles/v1/opentripplannerhigh/ciqelzkgo000dcem78xyg4ll6/tiles/256/{z}/{x}/{y}{retina}?access_token=pk.eyJ1Ijoib3BlbnRyaXBwbGFubmVyaGlnaCIsImEiOiIyT2xxdVRjIn0.1n9CkukOWpsIgExzdcWfJg',
            attribution : "&copy; <a href='https://www.mapbox.com/map-feedback/'>Mapbox</a> &copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
        },
        {
            name: 'Satellite',
            tileUrl: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}{retina}?access_token=pk.eyJ1Ijoib3BlbnRyaXBwbGFubmVyaGlnaCIsImEiOiIyT2xxdVRjIn0.1n9CkukOWpsIgExzdcWfJg',
            attribution : "&copy; <a href='https://www.mapbox.com/map-feedback/'>Mapbox</a> &copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
        },  
        {
            name: 'Hybrid',
            tileUrl: 'https://api.mapbox.com/styles/v1/opentripplannerhigh/ciqe3awnp0001c7nkk713k81b/tiles/256/{z}/{x}/{y}{retina}?access_token=pk.eyJ1Ijoib3BlbnRyaXBwbGFubmVyaGlnaCIsImEiOiIyT2xxdVRjIn0.1n9CkukOWpsIgExzdcWfJg',
            attribution : "&copy; <a href='https://www.mapbox.com/map-feedback/'>Mapbox</a> &copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
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
    usfTampaBounds: new L.latLngBounds(new L.latLng(28.054512, -82.426146), new L.latLng(28.069156, -82.401856)),
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
            url: [ "https://" + window.location.hostname + ":8443/otp-geocoder/geocode", "https://mobullity.forest.usf.edu:8443/otp-geocoder/geocode" ],

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
        content: sendfeedback() + '<p>Suggest and vote on new features on <a target="_blank" href="http://feathub.com/CUTR-at-USF/usf-mobullity" style="color:white">FeatHub</a></p> <p>Like hacking things? This project is open-source - see how you can help at <a style="color:white" href="https://github.com/CUTR-at-USF/usf-mobullity">usf-mobullity on Github</a>. </p> <p>Please review our <a style="color:white" href="https://raw.githubusercontent.com/CUTR-at-USF/usf-mobullity/mobullityrebase/privacy_policy.md" target="_blank">Privacy Policy</a>.</p>'

        },


    ],

    layersWidget: [
        { name: 'blue_phones', target: '#bluephone', icon: new L.layersIcon({icon: 'mdi mdi-phone', color: 'blue'}), type: 'static', title: 'Blue Light <br/> Emergency Phones', popup: "<b>Use Blue Light Phones to contact Police</b><br><a target='_blank' href='http://www.usf.edu/administrative-services/emergency-management/resources/campus-safety.aspx'>More about campus safety</a>", locations: [[28.0614434,-82.4078041], [28.0555655,-82.4084315], [28.0641975,-82.4185115], [28.0651509,-82.4183224], [28.0652518,-82.4124851], [28.0582386,-82.4225447], [28.0618976,-82.4141717], [28.0615615,-82.4137318], [28.0599592,-82.4069672], [28.0610142,-82.4149218], [28.0591974,-82.4130281], [28.0599166,-82.4078553], [28.0611144,-82.4187288], [28.0630924,-82.4229122], [28.0688995,-82.4130541], [28.0631877,-82.4136464], [28.0632019,-82.4118091], [28.0662717,-82.4191208], [28.0655687,-82.4105538], [28.0641913,-82.4141936], [28.0658575,-82.4130831], [28.0641581,-82.4127264], [28.0652658,-82.4099050], [28.0675588,-82.4256194], [28.0661246,-82.4206762], [28.0660985,-82.4245251], [28.0590405,-82.4201638], [28.0591163,-82.4192972], [28.0582144,-82.4185594], [28.0626681,-82.4144783], [28.0598752,-82.4193438], [28.0628149,-82.4173562], [28.0599651,-82.4176474], [28.0651523,-82.4234651], [28.0603440,-82.4142791], [28.0679737,-82.4155233], [28.0680589,-82.4133400], [28.0663549,-82.4050145], [28.0680589,-82.4053470], [28.0655857,-82.4073694], [28.0666507,-82.4073238], [28.0658389,-82.4087159], [28.0654484,-82.4090968], [28.0665276,-82.4081660], [28.0649845,-82.4113340], [28.0649951,-82.4105895], [28.0669113,-82.4190557], [28.0666677,-82.4197853], [28.0618552,-82.4209247], [28.0678908,-82.4223870], [28.0584771,-82.4084789], [28.0652073,-82.4086336], [28.0661801,-82.4114123], [28.0683646,-82.4098433], [28.0665417,-82.4087582], [28.0665890,-82.4107541], [28.0619428,-82.4029260], [28.0598972,-82.4029098], [28.0668664,-82.4089528], [28.0661730,-82.4098889], [28.0676942,-82.4114296], [28.0685342,-82.4117649], [28.0675338,-82.4091030], [28.0684183,-82.4072753], [28.0600344,-82.4089220], [28.0600490,-82.4100958], [28.0582358,-82.4121799], [28.0591210,-82.4116568], [28.0662335,-82.4029024], [28.0589559,-82.4179827], [28.0596162,-82.4209013], [28.0594457,-82.4185302], [28.0601510,-82.4184505], [28.0630128,-82.4097381], [28.0629156,-82.4104837], [28.0605726,-82.4120424], [28.0610623,-82.4100948], [28.0620187,-82.4113286], [28.0628495,-82.4252844], [28.0567379,-82.4088338], [28.0611240,-82.4071658], [28.0582317,-82.4201016], [28.0617204,-82.4174919], [28.0678858,-82.4176509], [28.0581327,-82.4066318], [28.0626081,-82.4180444], [28.0580570,-82.4029953], [28.0581694,-82.4106393], [28.0583376,-82.4052632], [28.0590952,-82.4174743], [28.0582401,-82.4171404], [28.0591035,-82.4167762]], color: 'blue' },

        { name: 'car_share', target: '#carshare', icon: new L.layersIcon({icon: 'mdi mdi-car', color: 'red'}), type: 'static', title: 'Enterprise CarShare', popup: "<a target='_blank' href='https://www.enterprisecarshare.com/us/en/programs/university/usf.html'>Reserve a car</a>", locations: [[28.059951, -82.417575], [28.064287, -82.412130]], color: 'green' },

        { name: 'bike_repair', target: '#bikerepair', icon: new L.layersIcon({icon: 'mdi mdi-wrench', color: 'green'}), type: 'poi', search: 'bicycle_repair_station', popupTemplate: 'bikeRepair-template', color: '#006747' },
        { name: 'bike_rack', target: '#bikeracks', icon: new L.layersIcon({icon: 'mdi mdi-bike', color: 'green'}), type: 'poi', search: 'bicycle_parking', color: '#006747' },

        { name: 'car_charging', target: '#carcharging', icon: new L.layersIcon({icon: 'mdi mdi-battery-charging', color: 'red'}), type: 'poi', search: 'charging_station', popupTemplate: 'carCharging-template', color: "red" },

        { name: 'parking', target: '#parkinglots', icon: new L.layersIcon({icon: 'mdi mdi-parking', color: 'red'}), type: 'poi', search: 'amenity:parking', popupTemplate: 'parkingLots-template', condition: "permits", color: "red" },

        { name: 'athletics', target: '#athletics', icon: new L.layersIcon({icon: 'mdi mdi-', color: 'green'}), type: 'poi', search: 'amenity:athletics, sport', color: 'green' },
        { name: 'dining', target: '#dining', icon: new L.layersIcon({icon: 'mdi ', color: 'green'}), type: 'poi', search: 'fast_food, restaurant', color: "green" },

        { name: 'mailing', target: '#mailing', icon: new L.layersIcon({icon: 'mdi mdi-', color: 'green'}), type: 'poi', search: 'post_box', color: 'green' },

        { name: 'copiers', target: '#copiers', icon: new L.layersIcon({icon: 'mdi mdi-', color: 'green'}), type: 'poi', search: 'copy_machine', popupTemplate: 'copymachine-template', color: 'green' },

        { name: 'info_kiosks', target: '#help_kiosks', icon: new L.layersIcon({icon: 'mdi mdi-', color: 'green'}), type: 'poi', search: 'tourism:information', color: 'blue' },
        { name: 'smart_kiosks', target: '#smart_kiosks', icon: new L.layersIcon({icon: 'mdi mdi-', color: 'green'}), type: 'poi', search: 'tourism:board', color: 'blue' },

    ],
 

    /**
     * Formats to use for date and time displays, expressed as ISO-8601 strings.
     */    
     
    timeFormat  : "h:mma",
    dateFormat  : "MMM Do YYYY"

    	
}
