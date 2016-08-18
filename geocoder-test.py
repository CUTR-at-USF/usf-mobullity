
import xml.etree.ElementTree as ET

def check_result(name, value):
    
    import requests

    url = "http://localhost:8181/opentripplanner-geocoder/geocode?address="

    v = value.split(" ")
    r = requests.get( url + name, headers = {'Accept': "application/json"} ).json()
    if ('error' not in r or r['error'] is None) and r['count'] == 1:
        ret = r['results'][0]
        if ret['description'] == name and ret['lat'] == float(v[0]) and ret['lng'] == float(v[1]): return True 
       
    return r 
    

tree = ET.parse("opentripplanner-geocoder/src/main/resources/org/opentripplanner/geocoder/application-context.xml")
root = tree.getroot()

for x in tree.findall("./*[@id='geocoderManual']//*"):
    if 'key' in x.attrib:
        ret = check_result(x.attrib['key'], x.attrib['value'])
        if ret == True: continue

        print "%s => False; error=%s count=%d equals %s =? %s" % (x.attrib['key'], ret['error'] if 'error' in ret else "N/A", ret['count'], "%0.5f %0.5f" % (ret['results'][0]['lat'], ret['results'][0]['lng']), x.attrib['value'])


