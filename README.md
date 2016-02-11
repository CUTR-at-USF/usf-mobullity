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
    
  * *Note: need graph.obj file and graph.properties file in appropriate place*
  * Open command prompt
  * Navigate to `usf-mobullity` folder
  * Use command `mvn clean package`.  This creates an `otp.jar` file in a test folder that is used to run the server
  * Run server with command `java -jar target/otp.jar -p port --server`
  * Use port `8080` or `8181` depending on what is open

2. Geocoder Server using usf-mobullity branch usf-GTFSrt <br>
  * Start server with Apache Tomcat 7.0 on port `80` <br>
  * Use Eclipse to export otp-geocoder.war file <br>
  * Also use `otp-leaflet-client.war` and `otp-rest-servlet.war` but not necessary <br>
  * Upload war file(s) into Tomcat Manager
