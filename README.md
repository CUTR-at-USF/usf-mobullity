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
  * Start server with Apache Tomcat 7.0 on port `8181`
  * Use Eclipse to export otp-geocoder.war file OR you can use Maven at the command-line from the opentripplanner-geocoder directory (with pom.xml)
  * Upload war file(s) into Tomcat Manager OR manually configure as below.

  Manual Configuration:
  1) Secure the Tomcat manager application to localhost by adding the following to context.xml:
	<Valve className="org.apache.catalina.valves.RemoteAddrValve"
         allow="127\.\d+\.\d+\.\d+|::1|0:0:0:0:0:0:0:1" />

  2) Set your manager username and password in tomcat-users.xml:

  <user username="USER" password="PASS" roles="manager-gui"/>

  3) Configure the HTTP/HTTPS ports in server.xml by adding or editing the following lines:

  <Connector port="8181" protocol="HTTP/1.1" connectionTimeout="20000"         redirectPort="8443" />

  <Connector port="8443" maxThreads="150" scheme="https" secure="true" SSLEnabled="true" keystoreFile="/path/to/keystore" keystorePass="PASSPHRASE" clientAuth="false" sslProtocol="TLS" />

  Note the keystoreFile and keystorePass - these should match what your SSL certificate was created with.  See the SSL section for more information.

  You can also verify the WAR directory with:

  <Host name="localhost"  appBase="webapps" unpackWARs="true" autoDeploy="true">

  4) Possibly configure the WEB-INF/web.xml inside of opentripplanner-geocoder

  5) Copy the otp-geocoder.war into the webapps directory, and start Tomcat.

  Then you should be able to access: http://localhost:8181/otp-geocoder/geocode?address=msc

  *Note* The WAR filename will determine how Tomcat autodeploys and the final endpoint you will use to access the application.

3. GTFS-RT Service: https://github.com/CUTR-at-USF/bullrunner-gtfs-realtime-generator
  This is an internal service used by OTP to read vehicle positions and trip updates converted from the Bullrunner AVL system (Synchromatics).

  It requires the Bullrunner GTFS data to be stored in myGTFS/ one level below the JAR file.

  * To build:
  1) Open command prompt
  2) Navigate to `bullrunner-gtfs-realtime-generator` folder
  3) Use command `mvn clean package`.  This creates the `cutr-gtfs-realtime-bullrunner-0.9.0-SNAPSHOT.jar` file in the target folder that is used to run the server

  * To run: (from the base directory)
  java -jar \target\cutr-gtfs-realtime-bullrunner-0.9.0-SNAPSHOT.jar --tripUpdatesUrl=http://localhost:8088/trip-updates --vehiclePositionsUrl=http://localhost:8088/vehicle-positions

4. Deployment Testing: (From https://github.com/CUTR-at-USF/test/tree/WIP-jmfield2)

    XXX

4. Automated/Continuous Deployment System

    XXX Jenkins, Chef


## Development Configuration

  SSL:

  Note: keyStore must be in basePath, otherwise the SSL won't be properly initialized and connections will 'abort' (because of no matching ciphers, etc)

  1) Generate CSRs:

  openssl req -new -newkey rsa:2048 -nodes -out maps_usf_edu.csr -keyout maps_usf_edu.key -subj "/C=US/ST=Florida/L=Tampa/O=University of South Florida/OU=CUTR/CN=maps.usf.edu"

  openssl req -new -newkey rsa:2048 -nodes -out mobullity_usf_edu.csr -keyout mobullity_usf_edu.key -subj "/C=US/ST=Florida/L=Tampa/O=University of South Florida/OU=CUTR/CN=mobullity.usf.edu"

  2) Have USF IT create the certificates and download the XXX, or self-sign for internal testing and import into Java Keystore:

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
  ```   TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA - strong
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

XXX build-config, OSM
XXX NSSM: mobullityotp, mobullitygtfsrt, mobullitygeocoder
XXX chef, tomcat

## Production Configuration

Public-facing ports balanced by Netscaler appliance:
OTP - 80, 443
Geocoder - 8181, 8443 (exposing /otp-geocoder)

Ports that should be opened to internal servers:
GTFS-RT - 8088 (HTTP) exposing /vehicle-positions and /trip-updates

jks_filename
tomcat path
XXX request logging, rotation
