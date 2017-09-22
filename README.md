
Table of Contents
=================

   * [USF Maps App](#usf-maps-app)
      * [Setting up the Server](#setting-up-the-server)
      * [Development Configuration](#development-configuration)
      * [Build-Config.json](#build-configjson)
      * [Graph.properties](#graphproperties)
      * [GTFS updater](#gtfs-updater)
         * [Vehicle Positions](#vehicle-positions)
         * [Trip Updates](#trip-updates)
         * [Bike Rental](#bike-rental)
         * [Request Logging and Rotation](#request-logging-and-rotation)
      * [Production Configuration](#production-configuration)
      * [NSSM](#nssm)
      * [Eclipse Development Environment](#eclipse-development-environment)
      * [MapBox Styles](#mapbox-styles)
      * [Modified Files from original OTP in mobullityrebase branch:](#modified-files-from-original-otp-in-mobullityrebase-branch)
      * [Added Files into mobullityrebase branch:](#added-files-into-mobullityrebase-branch)
      * [Modified Files from original OTP in usf-GTFSrt branch:](#modified-files-from-original-otp-in-usf-gtfsrt-branch)
      * [Added Files into usf-GTFSrt branch:](#added-files-into-usf-gtfsrt-branch)
      * [OTP Documentation](#otp-documentation)
   * [Automated Deployment](#automated-deployment)
      * [Jenkins](#jenkins)
         * [Build Hooks](#build-hooks)
      * [Service Management](#service-management)
      * [Chef Dependencies](#chef-dependencies)
      * [Chef Environment](#chef-environment)
      * [GeocoderTomcat:](#geocodertomcat)
      * [OTP:](#otp)
      * [Pushing to Chef](#pushing-to-chef)
      * [Geocoder_Tomcat: ##](#geocoder_tomcat-)
      * [GTFSRealtime:](#gtfsrealtime)
   * [Steps to Install/Provision Servers w/ Chef:](#steps-to-installprovision-servers-w-chef)
      * [Install NSSM for OTP,GTFS:](#install-nssm-for-otpgtfs)
      * [Chef](#chef)
      * [Install Chef Client Development Kit](#install-chef-client-development-kit)
      * [Production Network Policies](#production-network-policies)
   * [Manual Deployment Steps](#manual-deployment-steps)


# USF Maps App
The USF Maps App (originally known as MoBullity) helps USF students, staff, and visitors get around the USF Tampa campus using various transportation options (walk, bike, [USF Bull Runner shuttle](http://www.usf.edu/administrative-services/parking/transportation/), [USF Share-A-Bull bikeshare](http://usfweb2.usf.edu/campusrec/outdoor/Share-A-Bull.html), [Hillsborough Area Regional Transit (HART)](http://www.gohart.org/), [Enterprise CarShare](https://www.enterprisecarshare.com/us/en/programs/university/usf.html)).

USF Maps App offers the following features:
* Multi-modal trip planning based on real-time transit and bikeshare information.  Also includes options to avoid stairs and prefer bike lanes.
* Real-time bus locations on map
* Real-time bikeshare locations on map
* USF Bike lanes on map

Available live at http://maps.usf.edu/.

See sneak peaks of new features at the beta version at http://mobullity.forest.usf.edu/.

This application is based on the open-source [OpenTripPlanner project](http://www.opentripplanner.org/).  It uses data from [OpenStreetMap.org](http://www.openstreetmap.org/) for walking, bike, and road data.

We would like to acknowledge the support and funding assistance provided by the [USF Student Green Energy Fund](http://www.usf.edu/student-affairs/green-energy-fund/), [USF Center for Urban Transportation Research](http://www.cutr.usf.edu/), and [Florida Department of Transportation](http://www.dot.state.fl.us/).


## Setting up the Server

1. OTP Standalone Server using usf-mobullity branch mobullityrebase:

  * Requires: Java 1.8 (JDK/JRE), and Maven.  For SSL, you may or may not need to install the "Unlimited Strength" JCE and US export policies from Oracle.

  * To Build:

    1) Open command prompt

    2) Navigate to `usf-mobullity` folder

    3) Use command `mvn clean package`.  This creates an `otp.jar` file in the target folder that is used to run the server

  * Build Graph:

    1) From the `usf-mobullity` folder, run: java -jar target/otp.jar -b /path/to/files

    The OSM file, GTFS file(s), and build-config.json should all be located at the root of the `/path/to/files` directory.

    2) Move Graph.obj (and any necessary Graph.properties) into the `graphs/` subdirectory for this configuration.

    To obtain the OSM data, browse to openstreetmap.org and "Export" a given region.  Larger regions may need to be downloaded from a site such as metroextracts, or using the overpass API (linked from the "Export" page, or similar to http://overpass-api.de/api/map?bbox=-82.9350,27.2790,-82.0120,28.3760)

  * To Run:
  *Note:*
	* You will need to first build the Graph.obj file from your OSM data.  You also may need `Graph.properties` in the same directory as your Graph.obj to specify runtime settings such as GTFS and bike rental updater frequencies.
	* Port and securePort default to `8080` and `8181` respectively.  To use the standard 80, and 443, you may need to run the server with elevated (root, administrative) privileges.

    1) Run server with command `java -jar target/otp.jar --basePath /path/to/files -s`

    For the standard ports, use: `java -jar target/otp.jar --basePath /path/to/files -s -p 80 --securePort 443`

2. Geocoder Server using usf-mobullity branch usf-gui

  This is configured to respond to geocode?address= requests looking for matches in the static application-resources.xml and falling back to the MapQuest Nominatim service.

  * Start server with Apache Tomcat 7.0 on port `8181`
  * Use Eclipse to export otp-geocoder.war file OR you can use Maven at the command-line from the opentripplanner-geocoder directory (with pom.xml)
  * Upload war file(s) into Tomcat Manager OR manually configure as below.

  Manual Configuration:

  1) Secure the Tomcat manager application to localhost by adding the following to context.xml:
	
```
	<Valve className="org.apache.catalina.valves.RemoteAddrValve"
         allow="127\.\d+\.\d+\.\d+|::1|0:0:0:0:0:0:0:1" />
```

  2) Set your manager username and password in tomcat-users.xml:

	<user username="USER" password="PASS" roles="manager-gui"/>

  3) Configure the HTTP/HTTPS ports in server.xml by adding or editing the following lines:

```
  <Connector port="8181" protocol="HTTP/1.1" connectionTimeout="20000"         redirectPort="8443" />
```

```
  <Connector port="8443" maxThreads="150" scheme="https" secure="true" SSLEnabled="true" keystoreFile="/path/to/keystore" keystorePass="PASSPHRASE" clientAuth="false" sslProtocol="TLS" />
```

  Note the keystoreFile and keystorePass - these should match what your SSL certificate was created with.  See the SSL section for more information.

  You can also verify the WAR directory with:

  ```
  <Host name="localhost"  appBase="webapps" unpackWARs="true" autoDeploy="true">
  ```

  4) Possibly configure the WEB-INF/web.xml inside of opentripplanner-geocoder

  5) Copy the otp-geocoder.war into the webapps directory, and start Tomcat.

  Then you should be able to access: http://localhost:8181/otp-geocoder/geocode?address=msc

  *Note* The WAR filename will determine how Tomcat autodeploys and the final endpoint you will use to access the application.

In order to test the local geocoder from a local deployment of OTP, you must allow CORS via the tomcat web.xml configuration below:

```
<filter>
  <filter-name>CorsFilter</filter-name>
  <filter-class>org.apache.catalina.filters.CorsFilter</filter-class>
  <init-param>
    <param-name>cors.allowed.origins</param-name>
    <param-value>*</param-value>
  </init-param>
  <init-param>
    <param-name>cors.allowed.methods</param-name>
    <param-value>GET,POST,HEAD,OPTIONS,PUT</param-value>
  </init-param>
  <init-param>
    <param-name>cors.allowed.headers</param-name>
    <param-value>Content-Type,X-Requested-With,accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers</param-value>
  </init-param>
  <init-param>
    <param-name>cors.exposed.headers</param-name>
    <param-value>Access-Control-Allow-Origin,Access-Control-Allow-Credentials</param-value>
  </init-param>
  <init-param>
    <param-name>cors.support.credentials</param-name>
    <param-value>true</param-value>
  </init-param>
  <init-param>
    <param-name>cors.preflight.maxage</param-name>
    <param-value>10</param-value>
  </init-param>
</filter>
<filter-mapping>
  <filter-name>CorsFilter</filter-name>
  <url-pattern>/*</url-pattern>
</filter-mapping>
```

3. GTFS-RT Service:

 https://github.com/CUTR-at-USF/bullrunner-gtfs-realtime-generator

  This is an internal service used by OTP to read vehicle positions and trip updates converted from the Bullrunner AVL system (Synchromatics).

  It requires the Bullrunner GTFS data to be stored in myGTFS/ one level below the JAR file.

  * To build:

  1) Open command prompt

  2) Navigate to `bullrunner-gtfs-realtime-generator` folder

  3) Use command `mvn clean package`.  This creates the `cutr-gtfs-realtime-bullrunner-0.9.0-SNAPSHOT.jar` file in the target folder that is used to run the server

  * To run: (from the base directory)

  ```
  java -jar \target\cutr-gtfs-realtime-bullrunner-0.9.0-SNAPSHOT.jar --tripUpdatesUrl=http://localhost:8088/trip-updates --vehiclePositionsUrl=http://localhost:8088/vehicle-positions
  ```

4. Deployment Testing: (From https://github.com/CUTR-at-USF/test/tree/WIP-jmfield2)

    A python unittest-based system that reads test parameters from spreadsheets (locally, or remotely via google sheets) against the specified server and checks that the output matches expected behavior.  More information available on github.
    
    Also, it might be helpful to know that USF IT uses two staging webapps for the MyUSF system: (m.usf.edu)

* https://usf-test.modolabs.net/ 


4. Automated/Continuous Deployment System

    Our development workflow includes nightly builds of all three applications with Jenkins on the mobullity server which pushes the resulting JARs to our Hosted Chef account.

    To access Jenkins, login to http://localhost:8080/ from mobullity.

    Chef is configured at (https://manage.chef.io/organizations/cutr-at-usf) and manages all three servers.

    We use a development and production environment to control which versions of a particular cookbook to deploy.    

    More detailed technical details are in the mobullity wiki.

## Development Configuration

  SSL:

  Note: keyStore must be in basePath, otherwise the SSL won't be properly initialized and connections will 'abort' (because of no matching ciphers, etc)

  1) Generate CSRs:

  openssl req -new -newkey rsa:2048 -nodes -out maps_usf_edu.csr -keyout maps_usf_edu.key -subj "/C=US/ST=Florida/L=Tampa/O=University of South Florida/OU=CUTR/CN=maps.usf.edu"

  openssl req -new -newkey rsa:2048 -nodes -out mobullity_usf_edu.csr -keyout mobullity_usf_edu.key -subj "/C=US/ST=Florida/L=Tampa/O=University of South Florida/OU=CUTR/CN=mobullity.usf.edu"

  2) Have USF IT create the certificates and download the "as x509, base64 encoded" file, or self-sign for internal testing and import into Java Keystore:

  USF IT:
  * Use the `as X509, Base64 encoded` CER file.
  * openssl pkcs12 -export -in cert.cer -inkey mobullity_forest_usf_edu.pem -passout pass:PASS > server.p12  
  * keytool -importkeystore -srckeystore server.p12 -destkeystore server.jks -srcstoretype pkcs12

  Self-signed:
  * openssl req -x509 -nodes -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -in mobullity_forest_usf_edu.csr
  * openssl pkcs12 -export -in cert.pem -inkey mobullity_forest_usf_edu.pem -passout pass:PASS > server.p12
  * keytool -importkeystore -srckeystore server.p12 -destkeystore server.jks -srcstoretype pkcs12

  To test, you can run the following nmap script to list all available ciphers which should yield something like:

  nmap --script +ssl-enum-ciphers -p 8081 localhost

  TLSv1.0, TLSv1.1, and TLSv1.2:  
  ```
  TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA - strong
        TLS_DHE_RSA_WITH_AES_128_CBC_SHA - strong      
        TLS_DHE_RSA_WITH_AES_128_CBC_SHA256 - strong
        TLS_DHE_RSA_WITH_AES_256_CBC_SHA - strong
        TLS_DHE_RSA_WITH_AES_256_CBC_SHA256 - strong
        TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA - strong
        TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA - strong
        TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256 - strong
        TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA - strong
        TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384 - strong
        TLS_RSA_WITH_3DES_EDE_CBC_SHA - strong
        TLS_RSA_WITH_AES_128_CBC_SHA - strong
        TLS_RSA_WITH_AES_128_CBC_SHA256 - strong
        TLS_RSA_WITH_AES_256_CBC_SHA - strong
        TLS_RSA_WITH_AES_256_CBC_SHA256 - strong
```

  *NOTE*: Forward-secrecy issues might cause e.g, SSLLabs to cap the grade of the server because of default Java 8 limitations on the Diffie-Helman key exchange (1024 bits).  

  Another nmap script to test:

  `nmap --script ssl-dh-params localhost`

  This can be fixed using a Java option:

  `-Djdk.tls.ephemeralDHKeySize=2048`

  More information @ www.weakdh.org and some other discussion of solutions at http://serverfault.com/questions/722182/how-to-generate-new-2048-bit-diffie-hellman-parameters-with-java-keytool

## Build-Config.json

This file should be in the same directory as the OSM file and is used currently to specify the OSM tags to capture when building the graph for use by the POI layers.

The structure is a basic JSON file:

```
    { pois: {
        amenity: {
            parking: [],
        },
        shop: {
             supermarket: [],
        }
        } }
```

This saves all OSM node and way information for amenity:parking, shop:supermarket tags.


## Graph.properties

This file should be in the same directory as the Graph.obj file, and specifies runtime settings.

The structure is `unique_name.field = value`

## GTFS updater

### Vehicle Positions

    g2.type = vehicle-position-updater
    g2.defaultAgencyId = USF Bull Runner
    g2.sourceType = gtfs-http
    g2.frequencySec = 5
    g2.url = http://mobullity.forest.usf.edu:8088/vehicle-positions

This specifies the vehicle position updater for the bus position layer.

### Trip Updates

This loads the stop time predictions converted from AVL to GTFS for use by the GTFS-RT extension proposed to OTP but not yet in use.

Any of the trip update or vehicle positions URLs can be viewed in human-readable form by appending `?debug` to the URL.

```
g.type = stop-time-updater
g.defaultAgencyId = USF Bull Runner
g.sourceType = gtfs-http
g.frequencySec = 30
g.url = http://mobullity.forest.usf.edu:8088/trip-updates
```

### Bike Rental

    bike1.type = bike-rental
    bike1.frequencySec = 100
    bike1.sourceType = opendata-bikes
    bike1.url = http://usf.socialbicycles.com/opendata/

    bike2.type = bike-rental
    bike2.frequencySec = 100
    bike2.sourceType = opendata-hubs
    bike2.url = http://usf.socialbicycles.com/opendata/

These specify the opendata base URLs for bike and hub real-time data from socialbicycles.  

### Request Logging and Rotation

Currently, trip planner requests are logged to a file named 'requests.log' and rotated daily.  The day is appended to the filename and retained for 7 days at which time OTP will delete the file.

The servers have a nightly task (12:30 AM) that adds any new requests.YYYY-MM-DD.log files to the existing requests.zip file so that the logs can be kept for longer than 7 days.

## Production Configuration

Public-facing ports balanced by Netscaler appliance:
* OTP - 80, 443
* Geocoder - 8181, 8443 (exposing /otp-geocoder)

Ports that should be opened to internal servers:
* GTFS-RT - 8088 (HTTP) exposing /vehicle-positions and /trip-updates

## NSSM

Since we use standalone Java files, we have to wrap these in another application - like NSSM - to be managed like a Windows service.

Chef stores cookbook files @ Amazon S3 (knife cookbook show otp 1.0.4)

The structure of these cookbooks files/default:

geocoder_tomcat:
* context.xml
* geocoder-web.xml  
* otp-geocoder.war  
* server.xml  
* tomcat-users.xml  
* web.xml

gtfsrealtime:
* bullrunner-gtfs.zip  
* cutr-gtfs-realtime-bullrunner-0.9.0-SNAPSHOT.jar  

otp:
* Graph.properties  
* build-config.json
* otp.jar  
* tampa_florida.osm.pbf
* maps.jks
* mobullity.jks

This cookbook will also schedule a task at 11:59 PM to rebuild the graph if any relevant file is changed.

Node attributes:

```
jks_filename: {maps, mobullity}
tomcat_path: "/path/to/tomcat"
```

* JKS specifies which keyStore to use (for maps.usf.edu, or mobullity.forest.usf.edu).
* Tomcat_Path just specifies the full path to Tomcat in case it is different on a given node.

## Eclipse Development Environment

Although Netbeans is probably easier and less painful to setup, the following steps should work to help get a dev environment working with Eclipse.  More information @ https://docs.google.com/document/d/1xn5RZmfijAqedt8asEMcIBS33rtDzvXlpVUTbuqXOSo (Documentation of how to setup various OTP versions with api.citybik.es)

1. Ensure your Eclipse workspace is clean.  It might also be helpful to ensure it is not within a directory that Google Drive or similar is monitoring (as building/cleaning processes can cause unexpected behavior)
1. Ensure your JDK is properly configured in Eclipse.  Window - Prefs - Java - Installed JREs  i.e: not just a JRE - I used jdk1.7.0_51
1. Follow the OTP guides to setting up Eclipse with plugins and the lombok.jar
1. Clone the target OTP repository 
1. Perform the Maven update process.  Right-click on the opentripplanner project - Maven - Update Project
1. May be unnecessary, but I found that also performing a maven package helped: Run - Run As - Maven build…   -- Goals: package -- also, skip tests to save some time.
1. Create the tomcat instance and add the otp-webapp and otp-api-webapp modules as described in the installation tutorial (https://readthedocs.org/projects/opentripplanner/)
1. NOTE: You may also need to “Clean work directory” from tomcat by right-clicking on the server within the servers tab especially if you have tested other versions recently.
1. Configure OTP - Graph, and Bicycle data source

Each version of OTP needs a corresponding graph object to be built.  You can either download a region, or build an object from an openstreetmap extract.

How to configure and perform the other various tasks are documented in the other sections.

## MapBox Styles

The current tiles are provided by three MapBox styles.  One for the normal 'streets', one for 'satellite', and one for 'hybrid'. The icons are from the "streets-v8" style from mapbox, and may require manually updating the sprite setting by downloading the JSON and changing the URL to: "mapbox://sprites/mapbox/streets-v8"

In order to correct the default MapBox POI label with the desired "(ABBR) Abbreviation" style, we maintain a separate POI tileset and give that label layer 'export2 copy' priority by moving it higher in the list of layers, and then by adding text padding under the placement tab so that other layers cannot render. This works in most cases, but should probably be replaced by a single tileset of all POIs in Tampa.

These are supported by 3 geojson tilesets that can be updated using the overpass turbo tool using the following data:

bollards:
28.06189;-82.41338;15
```
/*
This has been generated by the overpass-turbo wizard.
The original search was:
“barrier=bollard”
*/
[out:json][timeout:25];
// gather results
(
  // query part for: “barrier=bollard”
  node["barrier"="bollard"](28.05081075453498,-82.43016242980957,28.072586166612016,-82.39806175231934);  
);
// print results
out body;
>;
out skel qt;
```

poi:
```
http://overpass-turbo.eu/?q=LyoKVGhpcyBoYcSGYmVlbiBnxI1lcmF0ZWQgYnkgdGhlIG92xJJwxIlzLXR1cmJvIHdpemFyZC7EgsSdxJ9yaWdpbmFsIHNlxLBjaMSsxIk6CsOiwoDCnGJ1aWxkxLpnPXllc8WIwp0KKi8KW291dDpqc29uXVt0aW1lxZ3FnzI1XTsKLy_Ej8SUxJ1yIHLFlHVsdHMKKAogIMWyIHF1xJLEmsSjcnQgZm9yOiDFiMWKxYzFjsWQxZLFlMWWxoEgbm9kZVsixYvFjcWPbmciPSLFk3MiXSh7e2LEqnh9fSnFsMaCd2F5xqHGo8aWxqbGqMaqxZTGrcavxrHGs8a1xrfGm8W5bMSUacWjxr3GlcalxqfGqcarx4TGsMayb8a0xrbFsMeJxoRwxLduxozFuXPFu8W9CsWrxJjGnnnFsD7FsMeoc2tlxL1xdDs&c=An8IVLfjtP

/*
This has been generated by the overpass-turbo wizard.
The original search was:
“building=yes”
*/
[out:json][timeout:25];
// gather results
(
  // query part for: “building=yes”
  node["building"="yes"]({{bbox}});
  way["building"="yes"]({{bbox}});
  relation["building"="yes"]({{bbox}});
);
// print results
out body;
>;
out skel qt;
```

parking:
```
http://overpass-turbo.eu/?q=LyoKVGhpcyBoYcSGYmVlbiBnxI1lcmF0ZWQgYnkgdGhlIG92xJJwxIlzLXR1cmJvIHdpemFyZC7EgsSdxJ9yaWdpbmFsIHNlxLBjaMSsxIk6CsOiwoDCnGFtxI1pdHk9xKNya8S6Z8WIwp0KKi8KW291dDpqc29uXVt0acWMxZ7FoDI1XTsKLy_Ej8SUxJ1yIHJlc3VsdHMKKAogIMWyIHF1xJLEmsWSdCBmb3I6IMWIxYrFjG7FjsWQxZLFlG7FlsKAxZjGg25vZGVbIsWLxY3FjyI9IsaZxZUiXSh7e2LEqnh9fSnFsMaDd2F5xqTGpsaWxqjGqsasxpvGrsawxrLGtMa2xrjGgsW4ZWzElGnFpMa-xpXGl8apxqvEsMaaZ8eFxrHGs2_Gtca3xbDHisaFcMS3bsaMxbnFu8W9xb_Fq8SYxqF5xbA-xbDHq3Nrx43GhnQ7&c=An8KegjkHP

/*
This has been generated by the overpass-turbo wizard.
The original search was:
“amenity=parking”
*/
[out:json][timeout:25];
// gather results
(
  // query part for: “amenity=parking”
  node["amenity"="parking"]({{bbox}});
  way["amenity"="parking"]({{bbox}});
  relation["amenity"="parking"]({{bbox}});
);
// print results
out body;
>;
out skel qt;
```

tampa buildings: http://overpass-turbo.eu/s/hWR


## Modified Files from original OTP in mobullityrebase branch:
1) Config.js<br>
	-> src/client/js/otp/config.js<br>
	-> contains many settings for the leaflet client of the server<br>
2) Style.css<br>
	-> src/client/style.css<br>
	-> used for styling the looks of the leaflet client<br>
3) Map.js<br>
	-> src/client/js/otp/core/Map.js<br>
	-> added current location capabilities<br>
4) MultimodalPlannerModule.js<br>
	-> src/client/js/otp/modules/multimodal/MultimodalPlannerModule.js<br>
	-> editing of different modules such as the Trip options module<br>
	-> initializes BusPositionsLayer and StopsLayer<br>
5) PlannerModule.js<br>
	-> src/client/js/otp/modules/planner/PlannerModule.js<br>
	-> add welcome pop up and different color path legs for HART and Bull Runner<br>
6) TripOptionsWidget.js<br>
	-> src/client/js/otp/widgets/tripoptions/TripOptionsWidget.js<br>
	->changes to the looks of the trip options widget<br>
7) StopsLayer.js<br>
	-> src/client/js/otp/layers/StopsLayer.js<br>
	-> modified to work with both HART bus stops and Bull Runner bus stops<br>
	-> modified to work with rebase and new api call stopsinradias<br>
8) TransitIndex.js<br>
	-> src/client/js/otp/core/TransitIndex.js<br>
	-> added functions for making api calls and edited existing functions that were messed 	up in the rebase<br>
9) Webapp.js<br>
	-> src/client/js/otp/core/Webapp.js<br>
	-> used to edit the looks of all the modules and how they act<br>
<br>
## Added Files into mobullityrebase branch:
1) GtfsRealtimeHttpVehiclePositionSource.java<br>
	-> src/main/java/org/opentripplanner/updater/vehiclepositions/<br>
	GtfsRealtimeHttpVehiclePositionSource.java<br>
	-> parses the vehicle positions at http site<br>
2) PollingVehiclePositionsUpdater.java<br>
 	-> src/main/java/org/opentripplanner/updater/vehiclepositions/
	PollingVehiclePositionsUpdater.java<br>
	-> constantly calls the parser and sorts the vehicle position data<br>
3) Vehicle.java<br>
	-> src/main/java/org/opentripplanner/updater/vehiclepositions/Vehicle.java<br>
	-> defines a vehicle<br>
4) VehiclePositionSource.java<br>
	-> src/main/java/org/opentripplanner/updater/vehiclepositions/
	VehiclePositionSource.java<br>
	-> decodes the http site and returns a list of vehicles<br>
5) VehiclePositions.java<br>
	-> src/main/java/org/opentripplanner/api/resource/VehiclePosition.java<br>
	-> turns the list of vehicles from the polling into an api that can be called from the client<br>
6) VehiclePositionsList.java<br>
	-> src/main/java/org/opentripplanner/api/resource/
	VehiclePositiosnList.java<br>
	-> defines a vehicle position list as an xml element<br>
7) BusPositionsLayer.js<br>
	-> src/main/java/org/otp/layers/BusPositionsLayer.js<br>
	-> calls the Vehicle Position api to display vehicle positions on the map<br>
	-> displays the Bull Runner Routes on the map<br>
8) HartStopsLayer.js<br>
	-> src/main/java/org/otp/layers/HartStopsLayer.js<br>
	-> should display only HART stops on the map<br>
	-> currently interferes with StopsLayer because they make the same api call...<br>
9) Images<br>
	-> Added images for vehicle positions and current positions and bus stops<br>
	-> src/cliet/images<br>

## Modified Files from original OTP in usf-GTFSrt branch:
1) application-context.xml<br>
	-> otp-geocoder/src/main/resources/org/opentripplanner/geocoder/
	application-context.xml<br>
	-> contains the list of buildings at USF and other popular buildings in the area<br>

## Added Files into usf-GTFSrt branch: 
1) AlternatingGeocoderModified.java<br>
	->otp-geocoder/src/main/java/org/opentripplanner/geocoder


##OTP Documentation##

A good place to start is the official OTP docs @ http://opentripplanner.readthedocs.org/en/latest/ and http://dev.opentripplanner.org/apidoc/0.15.0/



# Automated Deployment 

## Jenkins#

The development machine (with Jenkins) automatically builds:
usf-mobullity/mobullityrebase, usf-mobullity/usf-gui (geocoder), and bullrunner-gtfs-realtime-generator/master every night at midnight if there were SCM changes.

After the build finishes, there are build hooks defined to run the following batch files (on the development machine) depending on the repository built:

NOTE: The last line is "cmd1 && cmd2" because on separate lines cmd2 was not executed - aka, the file was updated in the local c:/chef-repo but NOT uploaded to the server for use by chef.

### Build Hooks 

```
c:/OTPFILES/chef-geocoder.bat:
REM Copy geocoder WAR from jenkins
copy "C:\Program Files (x86)\Jenkins\jobs\OTP Geocoder\workspace\opentripplanner-geocoder\target\opentripplanner-geocoder.war" c:\chef-repo\cookbooks\geocoder_tomcat\files\default\otp-geocoder.war

cd c:\chef-repo

REM Bump cookbook version, Upload cookbook (XXX and freeze?)
C:\opscode\chef\bin\knife spork bump geocoder_tomcat && C:\opscode\chef\bin\knife cookbook upload geocoder_tomcat
```
This copies the newly built WAR and uploads it into a new revision of the geocoder_tomcat cookbook in Chef for deployment by the servers.

```
C:/OTPFiles/chef-otp.bat:
REM copy newly compiled JAR from Jenkins workspace into the chef cookbook
copy "C:\Program Files (x86)\Jenkins\jobs\Mobullity\workspace\target\otp.jar" c:\chef-repo\cookbooks\otp\files\default\otp.jar

cd c:\chef-repo

REM First, BUMP the cookbook patch version & Second, UPLOAD the changes (the file) to the chef repo server
C:\opscode\chef\bin\knife spork bump otp && c:\opscode\chef\bin\knife cookbook upload otp
```

Copies the new otp.jar from the Jenkins workspace, bumps the patch version of the OTP cookbook, and uploads to chef.

```
C:/OTPFiles/chef-gtfs.bat:
REM Copy JAR from jenkins workspace
copy "C:\Program Files (x86)\Jenkins\jobs\GTFS-RT\workspace\target\cutr-gtfs-realtime-bullrunner-0.9.0-SNAPSHOT.jar" c:\chef-repo\cookbooks\gtfsrealtime\files\default\cutr-gtfs-realtime-bullrunner-0.9.0-SNAPSHOT.jar

cd c:\chef-repo

REM Bump cookbook version
C:\opscode\chef\bin\knife spork bump gtfsrealtime && c:\opscode\chef\bin\knife cookbook upload gtfsrealtime
```

Copies the new gtfs-rt-bullrunner jar from Jenkins workspace, bumps the gtfsrealtime patch version, and uploads to chef.


## Service Management #

Non-sucking Service Manager (NSSM) is configured on the 3 mobullity servers to manage the following Java services: mobullityOTP, mobullityGTFS and allows for the use of the Windows services control panel to start and stop the processes.  The command-line configuration options are stored inside the NSSM wrapper and can be accessed by running:

`nssm.exe edit mobullityOTP`

* OTP: `-Xmx2G -jar c:\otpfiles\otp.jar -g c:\otpfiles -s --port 80`
* GTFS: `-jar c:\bullrunner-gtfs-realtime-generator\target\cutr-gtfs-realtime-bullrunner-0.9.0-SNAPSHOT.jar --tripUpdatesUrl=http://localhost:8088/trip-updates --vehiclePositionsUrl=http://localhost:8088/vehicle-positions`
  * *NOTE: GTFS must be in startup directory \target\ because of hard-coded ../myGTFS/ path.*

Tomcat7 is used to host the old-style geocoder WAR on the following paths:

Mobullity1: c:\Program Files\Apache Software Foundation\Tomcat 7.0\webapps
Mobullity2: 
Mobullity3:


## Chef Dependencies #
knife spork plugin
windows


## Chef Environment #

Development, Environment

This is defined under Policy -> Environment on the chef UI, in chef_environment per node (knife node edit), and knife environment [list|edit]

This will let you set e.g. default cookbook versions:
```
  "cookbook_versions": {
    "geocoder_tomcat": "= 1.0.0",
    "gtfsrealtime": "= 1.0.0",
    "otp": "= 1.0.4"
  },
```

## GeocoderTomcat:

attributes/default.rb:

default['tomcat']['path'] = 'C:/Program Files (x86)/Apache Software Foundation/Tomcat 7.0/'

This is overridden by node with: knife node edit as follows:

```
  "normal": {
    "tomcat": {
      "path": "c:/Program Files/Apache Software Foundation/Tomcat 7.0/"
    },
```

Files: context.xml, geocoder-web.xml, otp-geocoder.war, server.xml, tomcat-users.xml, web.xml

These are the Tomcat configuration files, and the WAR file to deploy.


Recipes:

```
cookbook_file "#{node["tomcat"]["path"]}/conf/context.xml" do
	source "context.xml"
	action :create
	notifies :stop, "windows_service[Tomcat7]", :immediately
end

cookbook_file "#{node["tomcat"]["path"]}/conf/server.xml" do
	source "server.xml"
	action :create
	notifies :stop, "windows_service[Tomcat7]", :immediately
end

execute "tomcat_copy_web" do
	action :nothing
	
	command "copy /y web.xml.stage web.xml"
	cwd "#{node["tomcat"]["path"]}/conf/"
	
	notifies :start, "windows_service[Tomcat7]"
end

cookbook_file "#{node["tomcat"]["path"]}/conf/web.xml.stage" do
	source "web.xml"
	action :create
	notifies :stop, "windows_service[Tomcat7]", :immediately
	notifies :run, "execute[tomcat_copy_web]", :immediately	
end

cookbook_file "#{node["tomcat"]["path"]}/conf/tomcat-users.xml" do
	source "tomcat-users.xml"
	action :create
	notifies :stop, "windows_service[Tomcat7]", :immediately
end

# deploy WAR
cookbook_file "#{node["tomcat"]["path"]}/webapps/otp-geocoder.war" do
	source "otp-geocoder.war"
	action :create
	
	notifies :stop, "windows_service[Tomcat7]", :immediately
	notifies :delete, "directory[#{node["tomcat"]["path"]}/webapps/otp-geocoder]"
end

directory "#{node["tomcat"]["path"]}/webapps/otp-geocoder" do
	
	recursive	true
	
	action :nothing
	
	notifies :start, "windows_service[Tomcat7]"	
end


# XXX extract war?
cookbook_file "#{node["tomcat"]["path"]}/webapps/otp-geocoder/WEB-INF/web.xml" do
	source "geocoder-web.xml"
	action :create
	notifies :stop, "windows_service[Tomcat7]", :immediately
end

# Manage Svc

windows_service "Tomcat7" do
	action :start
	startup_type :automatic
end
```

## OTP: ##

Attributes:

default["jks_filename"] = "mobullity.jks"

Files:
    build.vbs
    build_config.json
    build_map.bat
    Graph.properties
    maps.jks
    mobullity.jks
    monthly-log-rotation.js
    otp.jar
    RunAsService.exe.config
    tampa_florida.osm.pbf
    zip.vbs

Recipes:

```
#require 'win32-service'
#-Xms2G  -jar c:\otpfiles\otp.jar --basePath c:\otpfiles -s --port 80  --securePort 443

# This is a Chef recipe file. It can be used to specify resources which will
# apply configuration to a server.

# XXX does this work?
directory "C:/OTPFiles" do
	action :create
end
directory "C:/OTPFiles/graphs" do
	action :create
end

# Manage scheduled task for request log archive
windows_task 'requestlogs' do
  cwd 'C:\\otpfiles'
  command 'cscript c:\\otpfiles\\zip.vbs c:\\otpfiles c:\\otpfiles\\requests.zip'
  run_level :highest
  frequency :daily
  frequency_modifier 1
  start_time "01:00"
end

# P:\CUTR\TDM Team-USF Maps App Archive
# Monthly log backup
windows_task 'requestlogsmonthly' do
  cwd 'C:\\otpfiles'
  command 'cscript c:\\otpfiles\\monthly-log-rotation.js c:\\otpfiles'
  run_level :highest
  frequency :monthly
  frequency_modifier 1
  start_time "23:00"
  user "Administrators"
end

cookbook_file "c:/OTPfiles/zip.vbs" do
	source "zip.vbs"
	action :create
end

cookbook_file "c:/OTPfiles/monthly-log-rotation.js" do
	source "monthly-log-rotation.js"
	action :create
end

# Sync Properties and restart

cookbook_file "c:/OTPfiles/keyStore" do
	source "#{node["jks_filename"]}"
	
	action :create
	notifies :restart, "windows_service[mobullityOTP]"
end

cookbook_file "c:/OTPfiles/graphs/Graph.properties" do
	source "Graph.properties"
	action :create
	notifies :restart, "windows_service[mobullityOTP]"
end

# Sync OSM, and automatically rebuild Graph.obj + restart svc
# XXX if graph.obj doesnt exist

cookbook_file "c:/OTPFiles/build_map.bat" do
	source "build_map.bat"
	
	action :create
end

cookbook_file "c:/OTPFiles/build.vbs" do
	source "build.vbs"
	
	action :create
end

execute "osm_build" do
	
	#command "AT 00:00 C:\OTPFiles\build_map.bat"
	# we have to schedule this for 11:5PM instead of 12:00AM because schtasks
	# insists on the time being 'in the future', so 11:59 is always in the future # # # except for the 1 minute between 11:59 and 12:00.. 
	command "schtasks /f /create /tn mapbuild /tr \"cscript c:\\otpfiles\\build.vbs\" /sc once /st 23:59 /ru system"
	
	action :nothing
end

# BullRunner GTFS
remote_file "C:/OTPFiles/graphs/bullrunner-gtfs.zip" do
	source "https://github.com/CUTR-at-USF/bullrunner-gtfs-realtime-generator/raw/master/bullrunner-gtfs.zip"
	action :create
	
	notifies :run, "execute[osm_build]"
end

# HART GTFS
remote_file "C:/OTPFiles/graphs/hart.zip" do
	source "http://www.gohart.org/google/google_transit.zip"
	action :create
	
	notifies :run, "execute[osm_build]"
end

# PSTA GTFS
remote_file "C:/OTPFiles/graphs/psta.zip" do
	source "http://www.psta.net/latest/google_transit.zip"
	action :create
	
	notifies :run, "execute[osm_build]"
end

# Map build_config
cookbook_file "C:/OTPFiles/graphs/build-config.json" do
	source "build_config.json"
	action :create
	
	notifies :run, "execute[osm_build]"
end

# File is Tampa extract from - https://s3.amazonaws.com/metro-extracts.mapzen.com/tampa_florida.osm.pbf
cookbook_file "C:/OTPFiles/graphs/map.osm.pbf" do
	source "tampa_florida.osm.pbf"
	action :create
	
	notifies :run, "execute[osm_build]"
end

# Sync JAR, and restart
execute "otp_copy_jar" do

	command "copy /y c:\\otpfiles\\otp.jar.stage c:\\otpfiles\\otp.jar"	
	cwd "C:/OTPFiles"

	action :nothing
	notifies :start, "windows_service[mobullityOTP]"
end

cookbook_file "C:/OTPFiles/otp.jar.stage" do

	source "otp.jar"
	action :create
	
	# XXX rebuild graph?
	
	notifies :stop, "windows_service[mobullityOTP]", :immediately
	notifies :run, "execute[otp_copy_jar]", :immediately
	
	#notifies :start, "windows_service[mobullityOTP]"
end

# Manage Svc

windows_service "mobullityOTP" do
	action :start
	startup_type :automatic
	
    supports :status => true, :restart => true, :start => true
end
```

Manage Graph.properties config for OTP deployment for consistent settings and restart service.

```
cookbook_file "c:/OTPfiles/Graph.properties" do
	source "Graph.properties"
	action :create
	notifies :restart, "windows_service[mobullityOTP]"
end
```

## Pushing to Chef

To make a change and distribute to chef, simply open the file in c:\chef-repo\cookbooks\otp\files\, save, and after optionally bumping the version (in cookbooks\otp\metadata.rb or with knife spork bump) you upload the new file to chef with: knife cookbooks upload otp.

This block defines the commands used to build a new graph using the OSM and GTFS data in the working directory. It must be scheduled independently of chef (via e.g schtasks) so that the server does not go down every time a change is detected.  

```
execute "osm_build" do
	#notifies :stop, "windows_service[mobullityOTP]", :immediately
	
	command "java -jar otp.jar -g . -b ."
	creates "C:/OTPFiles/Graph.obj"
	cwd "C:/OTPFiles"

	action :nothing
	notifies :start, "windows_service[mobullityOTP]"
end
```

These blocks manage the HART, PSTA, and Bullrunner GTFS files from the remote sites shown and updates the local file if any changes are found.  This also schedules a graph rebuild.

```
remote_file "C:/OTPFiles/bullrunner-gtfs.zip" do
	source "https://github.com/CUTR-at-USF/bullrunner-gtfs-realtime-generator/raw/master/bullrunner-gtfs.zip"
	action :create
	
	notifies :run, "execute[osm_build]"
end

remote_file "C:/OTPFiles/hart.zip" do
	source "http://www.gohart.org/google/google_transit.zip"
	action :create
	
	notifies :run, "execute[osm_build]"
end

remote_file "C:/OTPFiles/psta.zip" do
	source "http://www.psta.net/latest/google_transit.zip"
	action :create
	
	notifies :run, "execute[osm_build]"
end
```

Makes sure the Tampa, FL extract from https://s3.amazonaws.com/metro-extracts.mapzen.com/tampa_florida.osm.pbf is being used on the server and copies it to map.osm.pbf if any changes occur.  If this happens it will run the osm_build block to schedule a graph rebuild.  

The OSM File is not automatically polled since changes would happen at least daily, but instead must be manually pulled from the metro-extracts URL and uploaded to chef the same way as Graph.properties.

```
cookbook_file "C:/OTPFiles/map.osm.pbf" do
	source "tampa_florida.osm.pbf"
	action :create
	
	notifies :run, "execute[osm_build]"
end
```

These two blocks copy any newly built JAR files from files/otp.jar into OTPFiles/otp.jar.stage, stops the service, and then runs copy_jar which copies this file to otp.jar and restarts the service.  This will happen every time Jenkins builds the project and pushes the new JAR to chef when the build hook executes.

```
execute "copy_jar" do

	command "copy /y otp.jar.stage otp.jar"	
	cwd "C:/OTPFiles"

	action :nothing
	notifies :start, "windows_service[mobullityOTP]"
end

cookbook_file "C:/OTPFiles/otp.jar.stage" do

	source "otp.jar"
	action :create
	
	# XXX rebuild graph?
	
	notifies :stop, "windows_service[mobullityOTP]", :immediately
	notifies :run, "execute[copy_jar]", :immediately
	
	#notifies :start, "windows_service[mobullityOTP]"
end
```

Finally, this block makes chef ensure the OTP service is running every time it runs (30 minute intervals).

```
windows_service "mobullityOTP" do
	action :start
	startup_type :automatic
	
    supports :status => true, :restart => true, :start => true
end
```


## Geocoder_Tomcat: ## 

Sync the Tomcat/Geocoder configuration files from chef and restart Tomcat.  This allows the path to tomcat to change based on the installation and is configured by node attribute.

knife node edit NODE-NAME

```
cookbook_file "#{node["tomcat"]["path"]}/conf/context.xml" do
	source "context.xml"
	action :create
	notifies :restart, "windows_service[Tomcat7]"
end

cookbook_file "#{node["tomcat"]["path"]}/conf/server.xml" do
	source "server.xml"
	action :create
	notifies :restart, "windows_service[Tomcat7]"
end

cookbook_file "#{node["tomcat"]["path"]}/conf/web.xml" do
	source "web.xml"
	action :create
	notifies :restart, "windows_service[Tomcat7]"
end

cookbook_file "#{node["tomcat"]["path"]}/conf/tomcat-users.xml" do
	source "tomcat-users.xml"
	action :create
	notifies :restart, "windows_service[Tomcat7]"
end

cookbook_file "#{node["tomcat"]["path"]}/webapps/otp-geocoder/WEB-INF/web.xml" do
	source "geocoder-web.xml"
	action :create
	notifies :restart, "windows_service[Tomcat7]"
end
```

Using either the default attribute for this cookbook, or the node attribute, copy the WAR from chef to the tomcat webapps dir, and restart tomcat.

```
cookbook_file "#{node["tomcat"]["path"]}/webapps/otp-geocoder.war" do
	source "otp-geocoder.war"
	action :create
	
	notifies :restart, "windows_service[Tomcat7]"
end
```

```
windows_service "Tomcat7" do
	action :start
	startup_type :automatic
end
```

files/:
otp-geocoder.war
context.xml
geocoder-web.xml
server.xml
tomcat-users.xml
web.xml

## GTFSRealtime: ##

This copies new bullrunner GTFS data to the working directory and extracts the zipfile (as expected by the server) to myGTFS.

```
windows_zipfile "c:/bullrunner-gtfs-realtime-generator/myGTFS" do
	source "c:/bullrunner-gtfs-realtime-generator/bullrunner-gtfs.zip"
	action :nothing
	notifies :restart, "windows_service[mobullityGTFS]"
end

cookbook_file "c:/bullrunner-gtfs-realtime-generator/bullrunner-gtfs.zip" do
	source "bullrunner-gtfs.zip"
	action :create
	
	notifies :unzip, "windows_zipfile[c:/bullrunner-gtfs-realtime-generator/myGTFS]"
end
```

As above, copy any new gtfsrealtime jars to a staging area, stop the service, copy it over, and restart.

```
execute "copy_jar" do

	command "copy /y cutr-gtfs-realtime-bullrunner-0.9.0-SNAPSHOT.jar.stage cutr-gtfs-realtime-bullrunner-0.9.0-SNAPSHOT.jar"
	cwd "C:/bullrunner-gtfs-realtime-generator/target"

	action :nothing
	notifies :start, "windows_service[mobullityGTFS]"
end

cookbook_file "c:/bullrunner-gtfs-realtime-generator/target/cutr-gtfs-realtime-bullrunner-0.9.0-SNAPSHOT.jar.stage" do
	
	source "cutr-gtfs-realtime-bullrunner-0.9.0-SNAPSHOT.jar"
	action :create

	notifies :stop, "windows_service[mobullityGTFS]", :immediately
	notifies :run, "execute[copy_jar]", :immediately
	
end
```

As above, just keep the service running.

```
windows_service "mobullityGTFS" do
	action :start
	startup_type :automatic
end
```

files/:
cutr-gtfs-realtime-bullrunner-0.9.0-SNAPSHOT.jar


# Steps to Install/Provision Servers w/ Chef:

Install the following software manually:

1. Oracle Java 1.8 64bit
1. Tomcat 64bit service installer
1. http://nssm.cc (the non-sucking service manager) (OTP, GTFS)
1. Chef-client https://downloads.chef.io/chef-client/windows/

## Install NSSM for OTP,GTFS:

* Download package from website, extract win64\nssm.exe to desktop and in command prompt run:

```
nssm install mobullityotp java -jar c:\otpfiles\otp.jar -g c:\otpfiles -s --port 80
nssm set mobullityotp AppDirectory c:\otpfiles # for startup dir

nssm install mobullitygtfs java -jar c:\bullrunner-gtfs-realtime-generator\target\cutr-gtfs-realtime-generator-0.9.0-SNAPSHOT.jar --tripUpdatesUrl=http://localhost:8088/trip-updates --vehiclePositionsUrl=http://localhost:8088/vehicle-positions
```
"Service "mobullitygtfs" installed successfully!"

Individual settings can be set via commandline:
```
nssm set mobullitygtfs AppDirectory c:\bullrunner-gtfs-realtime-generator
```
"Set parameter "AppDirectory" for service "mobullitygtfs"."
                     
## Chef

We use Opscode Chef (Hosted) on the free tier which allows monitoring of 5 nodes.

1. Install the client (instructions @ https://docs.chef.io/release/12-5/install_dk.html)
2. Setup the client and node information and keys: knife client create, knife node create
3. Add chef permission for client:
(on manage.chef.io or knife download/upload /acls/nodes)
* chef-client -c c:\chef-repo\.chef\knife.rb -N mobullity2
* copy new .rb config to c:\chef\client.rb for chef-windows-service to find

Install knife-spork plugin using embedded ruby:
c:\opscode\chef\embedded\bin\gem install knife-spork

NOTE: Chef stores cookbook files @ Amazon S3 (knife cookbook show otp 1.0.4)
Also, you may need to install the knife 'spork' plugin (used by development build hooks)

After this, you just have to specify which environment this node is in (production, development), and make sure the chef-client service is running.

Every 30 minutes (the default), chef-client will run and process the cookbook recipes specified in the environment. Upgrading or downgrading versions and files as necessary.

## Install Chef Client Development Kit

These were done in a stock debian docker container, but are similar for other platforms.

```
dpkg -i chefdk_1.1.16-1_amd64.deb
chef verify
apt-get install git

create a directory for chef repo
copy knife.rb, user.pem, org-validator.pem into (chef repo)\.chef
knife download .
```

Now you can make changes to the cookbook recipes, files, or anything you can change in the manage.chef.io interface and upload them with knife.

knife cookbook show  will output the direct Amazon S3 links to view the files.

## Production Network Policies

We use a Netscaler appliance managed by USF IT to load balance requests to the production servers.  It is configured to remember the server used by a particular session (sticky routing) for cases where that might be necessary or benefit performance (e.g. trip plans are faster after the first request, so using the same server will benefit a bit on subsequent requests).

Public-facing ports balanced by Netscaler appliance:

OpenTripPlanner - 80, 443
Geocoder - 8181, 8443
GTFS-RT - 8088

SSL is enabled on the 443 and 8443 ports, the others are standard HTTP endpoints.

The ACLs should allow 80, 443, 8181, 8443, and 8088 between mobullity.forest.usf.edu, mobullity2.forest.usf.edu, and mobullity3.forest.usf.edu)


# Manual Deployment Steps

In case you cannot or don't want to wait until midnight to push a new version to each of the servers:

1. Push the desired changes to GitHub, PR and merge.
2. RDP into Mobullity
3. Login to Jenkins (http://localhost:8080/)
4. Click on the "OTP" project
5. On the left, click "Build Now"
6. When the build is finished, check the log (at the bottom) and make sure the Chef build hooks ran.
7. Restart chef client service

To update the production environment with the latest changes ahead of schedule:
1. Login to Manage.chef.io
2. Policy - Cookbooks - OTP (make a note of the latest version #)
3. Policy - Environments - Production
4. Cookbook Constraints - Edit: OTP (update the version to the version saved in step 2)
5. Optionally RDP into mobullity2 and mobullity3 to manually restart the chef client service

The steps are the same for the gtfsrealtime, and geocoder_tomcat cookbooks.

For OTP, you may also need to rebuild the graph depending on the changes needed.  This should automatically schedule for midnight, but you can run them immediately:

1. RDP into each server
2. From a command prompt, run: schtasks /run /tn mapbuild

NOTE: This will cause service interruption while it builds, so try to do one at a time.  You will know when the process is finished because the "Java" process will consume 99% CPU while processing the graph.


