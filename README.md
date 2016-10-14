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

More information available at https://docs.google.com/document/d/1AIgj9t7q_e2vD6kppMh1g6v5xt88FlHI2SiQdylm9vA/edit

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
  node["barrier"="bollard"]({{bbox}});
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




