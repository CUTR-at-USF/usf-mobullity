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

otp.namespace("otp.locale");

/**
  * @class
  */
otp.locale.English = {

    config :
    {
        metricsSystem : "english",
        rightClickMsg : "Right-click on the map to designate the start and end of your trip.",
        attribution   : {
            title   : "License Attribution",
            content : "Disclaimer goes here"
        }
    },

    contextMenu : 
    {
        fromHere         : "Start a trip here",
        toHere           : "End a trip here",
        intermediateHere : "Add intermediate point",

        centerHere       : "Center map here",
        zoomInHere       : "Zoom in",
        zoomOutHere      : "Zoom out",
        previous         : "Last map position",
        next             : "Next map position",

        analysisLocation : "Set as Analysis Location",

        minimize         : "Minimize",
        bringToFront     : "Bring to front",
        sendToBack       : "Send to back"
    },

    widgets : 
    {
        managerMenu : 
        {
            minimizeAll     : "Minimize all",
            unminimizeAll   : "Unminimize all"
        },

        ItinerariesWidget : 
        {
            title               : "Itineraries",
            itinerariesLength   : "Itineraries Returned",
            linkToSearch        : "Link to search",
            buttons             :
            {
                first           : "First",
                previous        : "Previous",
                next            : "Next",
                last            : "Last"
            },
            realtimeDelay       :
            {
                late            : "min late",
                early           : "min early", 
                onTime          : "on time"
            }
        },

        AnalystLegend :
        {
            title               : "Legend : travel time in minutes"
        },

        MultimodalPlannerModule : 
        {
            title               : "Trip Options"
        },

        TripOptionsWidget       :
        {
            title               : "Travel Options"
        }
    },

    modules :
    {
        analyst : {
            AnalystModule : 
            {
                name        : "Analyst",
                refresh     : "Refresh"
            }
        },

        multimodal : {
            MultimodalPlannerModule : 
            {
                name        : "Multimodal Trip Planner"
            }
        }
    },

    bikeTriangle : 
    {
        safeName : "Bike friendly",
        safeSym  : "B",

        hillName : "Flat",
        hillSym  : "F",

        timeName : "Quick",
        timeSym  : "Q"
    },

    service : 
    {
        weekdays:  "Weekdays",
        saturday:  "Saturday",
        sunday:    "Sunday",
        schedule:  "Schedule"
    },

    indicators : 
    {
        ok         : "OK",
        date       : "Date",
        loading    : "Loading",
        searching  : "Searching...",
        qEmptyText : "Address, intersection, landmark or Stop ID..."
    },

    buttons: 
    {
        reverse       : "Reverse",
        reverseTip    : "<b>Reverse directions</b><br/>Plan a return trip by reversing this trip's start and end points, and adjusting the time forward.",
        reverseMiniTip: "Reverse directions",

        edit          : "Edit",
        editTip       : "<b>Edit trip</b><br/>Return to the main trip planner input form with the details of this trip.",

        clear         : "Clear",
        clearTip      : "<b>Clear</b><br/>Clear the map and all active tools.",

        fullScreen    : "Full Screen",
        fullScreenTip : "<b>Full Screen</b><br/>Show -or- hide tool panels",

        print         : "Print",
        printTip      : "<b>Print</b><br/>Print friendly version of the trip plan (without map).",

        link          : "Link",
        linkTip      : "<b>Link</b><br/>Show link url for this trip plan.",

        feedback      : "Feedback",
        feedbackTip   : "<b>Feedback</b><br/>Send your thoughts or experiences with the map",

        submit       : "Submit",
        clearButton  : "Clear",
        ok           : "OK",
        cancel       : "Cancel",
        yes          : "Yes",
        no           : "No",
        showDetails  : "&darr; Show details &darr;",
        hideDetails  : "&uarr; Hide details &uarr;"
    },

    // note: keep these lower case (and uppercase via template / code if needed)
    directions : 
    {
        southeast:      "southeast",
        southwest:      "southwest",
        northeast:      "northeast",
        northwest:      "northwest",
        north:          "north",
        west:           "west",
        south:          "south",
        east:           "east",
        bound:          "bound",
        left:           "left",
        right:          "right",
        slightly_left:  "slight left",
        slightly_right: "slight right",
        hard_left:      "hard left",
        hard_right:     "hard right",
        'continue':     "continue on",
        to_continue:    "to continue on",
        becomes:        "becomes",
        at:             "at",
        on:             "on",
        to:             "to",
        via:            "via",
        circle_counterclockwise: "take roundabout counterclockwise",
        circle_clockwise:        "take roundabout clockwise",
        // rather than just being a direction, this should be
        // full-fledged to take just the exit name at the end
        elevator: "take elevator to"
    },

    // see otp.planner.Templates for use
    instructions :
    {
        walk         : "Walk",
        walk_toward  : "Walk",
        walk_verb    : "Walk",
        bike         : "Bike",
        bike_toward  : "Bike",
        bike_verb    : "Bike",
        drive        : "Drive",
        drive_toward : "Drive",
        drive_verb   : "Drive",
        move         : "Proceed",
        move_toward  : "Proceed",

        transfer     : "transfer",
        transfers    : "transfers",

        continue_as  : "Continues as",
        stay_aboard  : "stay on board",

        depart       : "Depart",
        arrive       : "Arrive",
        now          : "Now",

        presets_label: "Presets",

        preferredRoutes_label : "Preferred Routes",
        edit         : "Edit",
        none         : "None",
        weight       : "Weight",

        allRoutes    : "All Routes",

        save         : "Save",
        close        : "Close",

        start_at     : "Start at",
        end_at       : "End at",

        start        : "Start",
        end          : "End",

        geocoder     : "Geocoder"
    },

    // see otp.planner.Templates for use
    labels : 
    {
        agency_msg   : "Service run by",
        agency_msg_tt: "Open agency website in separate window...",
        about        : "About",
        stop_id      : "Stop ID",
        trip_details : "Trip details",
        travel       : "Travel",
        valid        : "Valid",
        trip_length  : "Time",
        with_a_walk  : "with a walk of",
        alert_for_rt : "Alert for route",
        fare         : "Fare",
        regular_fare : "Regular",
        student_fare : "Student",
        senior_fare  : "Senior",
        fare_symbol  : "$"
    },

    // see otp.planner.Templates for use -- one output are the itinerary leg headers
    modes :
    {
        WALK:           "Walk",
        BICYCLE:        "Bicycle",
        CAR:            "Car",
        TRAM:           "Tram",
        SUBWAY:         "Subway",
        RAIL:           "Rail",
        BUS:            "Bus",
        FERRY:          "Ferry",
        CABLE_CAR:      "Cable Car",
        GONDOLA:        "Gondola",
        FUNICULAR:      "Funicular"
    },

    ordinal_exit:
    {
        1:  "to first exit",
        2:  "to second exit",
        3:  "to third exit",
        4:  "to fourth exit",
        5:  "to fifth exit",
        6:  "to sixth exit",
        7:  "to seventh exit",
        8:  "to eighth exit",
        9:  "to ninth exit",
        10: "to tenth exit"
    },

    time:
    {
        hour_abbrev    : "hour",
        hours_abbrev   : "hours",
        hour           : "hour",
        hours          : "hours",

        minute         : "minute",
        minutes        : "minutes",
        minute_abbrev  : "min",
        minutes_abbrev : "mins",
        second_abbrev  : "sec",
        seconds_abbrev : "secs",
        format         : "MMM Do YYYY, h:mma", //moment.js
        date_format    : "MM/DD/YYYY", //momentjs must be same as date_picker format which is by default: mm/dd/yy
        time_format    : "h:mma", //momentjs
        time_format_picker : "hh:mmtt", //http://trentrichardson.com/examples/timepicker/#tp-formatting
        months         : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },

    systemmap :
    {
        labels :
        {
            panelTitle : "System Map"
        }
    },

    tripPlanner :
    {
        // see otp/planner/*.js for where these values are used
        labels : 
        {
            panelTitle    : "Trip Planner",
            tabTitle      : "Plan a Trip",
            inputTitle    : "Trip Details",
            optTitle      : "Trip Preferences (optional)",
            submitMsg     : "Planning Your Trip...",
            optionalTitle : "",
            date          : "Date",
            time          : "Time",
            when          : "When",
            from          : "From",
            fromHere      : "From here",
            to            : "To",
            toHere        : "To here",
            intermediate  : "Intermediate Places",
            minimize      : "Show me the",
            maxWalkDistance: "Maximum walk",
            walkSpeed     : "Walk speed",
            maxBikeDistance: "Maximum bike",
            bikeSpeed     : "Bike speed",
            arriveDepart  : "Arrive by/Depart at",
            mode          : "Travel by",
            wheelchair    : "Wheelchair accessible trip", 
            go            : "Go",
            planTrip      : "Plan Your Trip",
            newTrip       : "New trip",
            bannedRoutes  : "Banned routes"
        },

        // see otp/config.js for where these values are used
        link : 
        {
            text           : "Link to this trip (OTP)",
            trip_separator : "This trip on other transit planners",
            bike_separator : "On other bike trip planners",
            walk_separator : "On other walking direction planners",
            google_transit : "Google Transit",
            google_bikes   : "Google Bike Directions",
            google_walk    : "Google Walking Directions",
            google_domain  : "http://www.google.com"
        },

        // see otp.planner.Forms for use
        geocoder:
        {
            working      : "Looking up address ....",
            error        : "Did not receive any results",
            msg_title    : "Review trip plan",
            msg_content  : "Please correct errors before planning your trip",
            select_result_title : "Please select a result",
            address_header : "Address"
        },

        error:
        {
            title        : 'Trip Planner Error',
            deadMsg      : "Map Trip Planner is currently not responding. Please wait a few minutes to try again, or try the text trip planner (see link below).",
            geoFromMsg   : "Please select the 'From' location for your trip: ",
            geoToMsg     : "Please select the 'To' location for your trip: "
        },
        
        // default messages from server if a message was not returned ... 'Place' error messages also used when trying to submit without From & To coords.
        msgcodes:
        {
            200: "Plan OK",
            500: "Server error",
            400: "Trip out of bounds",
            404: "Path not found",
            406: "No transit times",
            408: "Request timed out",
            413: "Invalid parameter",
            440: "The 'From' place is not found ... please re-enter it.",
            450: "The 'To' place is not found ... please re-enter it.",
            460: "Places 'From' and 'To' are not found ... please re-enter them.",
            470: "Places 'From' or 'To' are not wheelchair accessible",
            409: "Too close",
            340: "Geocode 'From' ambiguous",
            350: "Geocode 'To' ambiguous",
            360: "Geocodes 'From' and 'To' are ambiguous"
        },

        options: 
        [
          ['TRANSFERS', 'Fewest transfers'],
          ['QUICK',     'Quick trip'],
          ['SAFE',      'Bike friendly trip'],
          ['TRIANGLE',  'Custom trip...']
        ],
    
        arriveDepart: 
        [
          ['false', 'Depart'], 
          ['true',  'Arrive']
        ],
    
        maxWalkDistance : 
        [
            ['160',   '1/10 mile'],
            ['420',   '1/4 mile'],
            ['840',   '1/2 mile'],
            ['1260',  '3/4 mile'],
            ['1609',  '1 mile'],
            ['3219',  '2 miles'],
            ['4828',  '3 miles'],
            ['6437',  '4 miles'],
            ['8047',  '5 miles'],
            ['16093',  '10 miles'],
            ['24140',  '15 miles'],
            ['32187',  '20 miles'],
            ['48280',  '30 miles'],
            ['64374',  '40 miles'],
            ['80467',  '50 miles'],
            ['160934',  '100 miles']
        ],

    	walkSpeed :
    	[
    		['0.447',  '1 mph'],
    		['0.894',  '2 mph'],
    		['1.341',  '3 mph'],
    		['1.788',  '4 mph'],
    		['2.235',  '5 mph']
    	],

        modes : // leaflet client
        {
            "TRANSIT,WALK"              : "Transit",
            "BUSISH,WALK"               : "Bus Only",
            "TRAINISH,WALK"             : "Rail Only",
            "BICYCLE"                   : 'Bicycle Only',
            "WALK"                      : 'Walk Only',
            "TRANSIT,BICYCLE"           : "Bicycle &amp; Transit",
            "CAR"                       : 'Drive Only',
            "CAR_PARK,WALK,TRANSIT"     : 'Park and Ride',
            "CAR,WALK,TRANSIT"          : 'Kiss and Ride',
            "BICYCLE_PARK,WALK,TRANSIT" : 'Bike and Ride'
        },

        mode : // OL client
        [
            ['TRANSIT,WALK', 'Transit'],
            ['BUSISH,WALK', 'Bus only'],
            ['TRAINISH,WALK', 'Train only'],
            ['WALK', 'Walk only'],
            ['BICYCLE', 'Bicycle only'],
            ['TRANSIT,BICYCLE', 'Transit & Bicycle']
        ],

        // TODO: remove this hack, and provide code that allows the mode array to be configured with different transit modes.
        //       (note that we've been broken for awhile here, since many agencies don't have a 'Train' mode either...this needs attention)
        // IDEA: maybe we start with a big array (like below), and the pull out modes from this array when turning off various modes...
        with_bikeshare_mode : 
        [
            ['TRANSIT,WALK', 'Transit'],
            ['BUSISH,WALK', 'Bus only'],
            ['TRAINISH,WALK', 'Train only'],
            ['WALK', 'Walk only'],
            ['BICYCLE', 'Bicycle only'],
            ['WALK,BICYCLE', 'Rented Bicycle'],
            ['TRANSIT,BICYCLE', 'Transit & Bicycle'],
            ['TRANSIT,WALK,BICYCLE', 'Transit & Rented Bicycle']
        ],

        wheelchair :
        [
            ['false', 'Not required'],
            ['true', 'Required']
        ]
    },

    CLASS_NAME : "otp.locale.English"
};

