/* This program is free software: you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public License
 as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>. */

package org.opentripplanner.geocoder.manual;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.opentripplanner.geocoder.Geocoder;
import org.opentripplanner.geocoder.GeocoderResult;
import org.opentripplanner.geocoder.GeocoderResults;

import com.vividsolutions.jts.geom.Envelope;

public class ManualGeocoder implements Geocoder {
    private Map<String, String> pois;
    
    public ManualGeocoder() {
    }
        
    @Override 
    public GeocoderResults geocode(String address, Envelope bbox) {
    	List<GeocoderResult> geocoderResults = new ArrayList<GeocoderResult>();
    	
    	ArrayList<String> poiNames = new ArrayList<String>();
    	poiNames.addAll(pois.keySet());
    	
        for (String name : poiNames) {
        	name = name.toUpperCase();
        	String addr = address.toUpperCase();
        	if(name.contains(addr) || addr.contains(name)) {
        		String value = (String)pois.get(name);
        		String[] latlon = value.split(" ");
        		Double lat = Double.parseDouble(latlon[0]);
        		Double lon = Double.parseDouble(latlon[1]);
        		String displayName = name;
        		GeocoderResult geocoderResult = new GeocoderResult(lat, lon, displayName);
        		geocoderResults.add(geocoderResult);
        	}
        }
        return new GeocoderResults(geocoderResults);
    }
    
//    private GeocoderResults noGeocoderResult(String error) {
//        return new GeocoderResults(error);
//    }

	public Map<String, String> getPois() {
		return pois;
	}

	public void setPois(Map<String, String> pois) {
		this.pois = pois;
	}
    
}