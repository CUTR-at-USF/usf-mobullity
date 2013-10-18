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

package org.opentripplanner.geocoder;

import java.util.ArrayList;
import java.util.List;

import com.vividsolutions.jts.geom.Envelope;


public class AlternatingGeocoderModified implements Geocoder {
    
    private Geocoder geocoder1;
    private Geocoder geocoder2;
    private boolean useFirstGeocoderOnly;  //use 1st geocoder results; if empty, then use 2nd geocoder

    
    public AlternatingGeocoderModified(Geocoder geocoder1, Geocoder geocoder2, boolean useFirstGeocoderOnly) {
        this.geocoder1 = geocoder1;
        this.geocoder2 = geocoder2;
        this.useFirstGeocoderOnly = useFirstGeocoderOnly;
    }

   	@Override
	public GeocoderResults geocode(String address, Envelope bbox) {
		GeocoderResults geocoderResult1 = geocoder1.geocode(address,null);
    	GeocoderResults geocoderResult2 = geocoder2.geocode(address,null);
    	if(useFirstGeocoderOnly){
    		if(! geocoderResult1.getResults().isEmpty()) 
    			return geocoderResult1;
    		else return geocoderResult2;
    	} else {
    		List<GeocoderResult> geocoderResults = new ArrayList<GeocoderResult>();
    		geocoderResults.addAll(geocoderResult1.getResults());
    		geocoderResults.addAll(geocoderResult2.getResults());
    		return new GeocoderResults(geocoderResults);
    	}
	}

}