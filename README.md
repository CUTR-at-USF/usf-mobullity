# USF Mobullity
USF Mobullity is a branch off of the open source OpenTripPlanner located at http://opentripplanner.com/.

## Setting up the Server
1) OTP Standalone Server using usf-mobullity branch mobullityrebase: <br>
	-> Note: need graph.obj file and graph.properties file in appropriate place <br>
	-> Open command prompt <br>
	-> Navigate to usf-mobullity folder <br>
	-> Use command "mvn clean package" <br>
		-> This creates an otp.jar file in a test folder that is used to run the server <br>
	-> Run server with command "java -jar target/otp.jar -p port --server" <br>
		-> Use port 8080 or 8181 depending on what is open <br>

2) Geocoder Server using usf-mobullity branch usf-GTFSrt <br>
	-> Start server with Apache Tomcat 7.0 on port 80 <br>
	-> Use eclipse to export otp-geocoder.war file <br>
		-> Also use otp-leaflet-client.war and otp-rest-servlet.war but not necessary <br>
	-> Upload war file(s) into Tomcat manager
