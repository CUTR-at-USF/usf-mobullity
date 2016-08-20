"""
A simple sanity checker for the OTP manual geocoder XML file.

The code will read and parse the application-context.xml file (with manual geocoder entries) with hard-coded path based on the usf-gui branch and assuming a current working directory of the OTP root.  It uses the Python XML processing library.

Then, it will loop through each entry KEY and request the answer from a tomcat instance of the otp-geocoder and check that the resulting (with no error, and count=1) latlng matches what was provided in the XML (space-delimited). The URL to the testing API endpoint is currently hard-coded as http://localhost:8181/otp-geocoder/

Some errors that it will catch:
- Basic XML parsing errors should throw corresponding Python exceptions.
- Incorrectly delimited or formatted latlng in XML

Usage: python geocoder-test.py

"""

import xml.etree.ElementTree as ET

def check_result(name, value):
    # Accept a KEY representing an address to send to the geocoder, and the expected (space-delimited) value 
    # returns True on success, and the requests response on error/failure (for debugging)

    import requests

    url = "http://localhost:8181/opentripplanner-geocoder/geocode?address="

    # split the latlng pair so we can check the float value of each later
    v = value.split(" ")

    # use requests to GET the url and request a JSON response
    r = requests.get( url + name, headers = {'Accept': "application/json"} ).json()

    # if no error, and count=1
    if ('error' not in r or r['error'] is None) and r['count'] == 1:

        # check the result matches the provided key, and the latlngs match our expected values
        ret = r['results'][0]
        if ret['description'] == name and ret['lat'] == float(v[0]) and ret['lng'] == float(v[1]): return True 
    
    # return the requests response
    return r 
    

tree = ET.parse("opentripplanner-geocoder/src/main/resources/org/opentripplanner/geocoder/application-context.xml")
root = tree.getroot()

# loop through each geocoderManual key/value entity using xpath
for x in tree.findall("./*[@id='geocoderManual']//*"):
    if 'key' in x.attrib:

        # check against server
        ret = check_result(x.attrib['key'], x.attrib['value'])
        if ret == True: continue

        # print some info on failure
        print "%s => False; error=%s count=%d equals %s =? %s" % (x.attrib['key'], ret['error'] if 'error' in ret else "N/A", ret['count'], "%0.5f %0.5f" % (ret['results'][0]['lat'], ret['results'][0]['lng']), x.attrib['value'])


