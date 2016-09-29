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

package org.opentripplanner.geocoder.pelias;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.List;

import javax.ws.rs.core.UriBuilder;

import org.opentripplanner.geocoder.Geocoder;
import org.opentripplanner.geocoder.GeocoderResult;
import org.opentripplanner.geocoder.GeocoderResults;

import com.vividsolutions.jts.geom.Envelope;
import edu.usf.cutr.pelias.SearchRequest;
import edu.usf.cutr.pelias.SearchResponse;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.geojson.Feature;
import org.geojson.Point;

public class PeliasGeocoder implements Geocoder {
    private String apiKey;
    private Integer resultLimit;
    private Envelope viewBox;
    private String focusPoint;
    
    public PeliasGeocoder() {
    }
    
    public String getapiKey() {
        return apiKey;
    }
    
    public void setapiKey(String Url) {
        this.apiKey = Url; 
    }

    public String getFocusPoint() {
        return focusPoint;
    }
    
    public void setFocusPoint(String str) {
        this.focusPoint = str; 
    }
    
    public Integer getResultLimit() {
        return resultLimit;
    }

    public void setResultLimit(Integer resultLimit) {
        this.resultLimit = resultLimit;
    }

    public Envelope getViewBox() {
        return viewBox;
    }

    public void setViewBox(Envelope param) {
        this.viewBox = param;
    }   
    
    @Override 
    public GeocoderResults geocode(String address, Envelope bbox) {
        SearchResponse response = null;
        
        try {

            Double focusLat, focusLon;
            if (bbox != null) {
                focusLat = (bbox.getMinX() + bbox.getMaxX()) / 2;
                focusLon = (bbox.getMinY() + bbox.getMaxY()) / 2;
            } else {     
                focusLat = new Double(focusPoint.split(",")[0]);
                focusLon = new Double(focusPoint.split(",")[1]);
            }

            Double rectMinLat, rectMinLon, rectMaxLat, rectMaxLon;
            
            if (bbox != null) {
                rectMinLat = bbox.getMinX();
                rectMinLon = bbox.getMinY();
                rectMaxLat = bbox.getMinX() + bbox.getWidth();
                rectMaxLon = bbox.getMinY() + bbox.getHeight();                
            }
            else {
                rectMinLat = viewBox.getMinX();
                rectMinLon = viewBox.getMinY();
                rectMaxLat = viewBox.getMinX() + viewBox.getWidth();
                rectMaxLon = viewBox.getMinY() + viewBox.getHeight();
            }
            
            response = new SearchRequest.Builder(apiKey, address)
                    .setSources("osm")
                    .setSize(resultLimit)
                    .setFocusPoint(focusLat, focusLon)
                    .setBoundaryRect(rectMinLat, rectMinLon, rectMaxLat, rectMaxLon)                    
                    .build().call();           
        } catch (IOException e) {
            e.printStackTrace();
            return noGeocoderResult("Error parsing geocoder response");
        }
           
        GeocoderResults Results = new GeocoderResults();
        Point p = null;
        
        if (response != null) {
            for (Feature x : response.getFeatures()) {
                
                if (x.getGeometry().getClass() == Point.class) {
                    p = (Point) x.getGeometry();

                    Double lat = p.getCoordinates().getLatitude();
                    Double lng = p.getCoordinates().getLongitude();
                    
                    StringBuilder name = new StringBuilder();
                    
                    name.append(x.getProperties().get("name").toString());
                    if (x.getProperties().get("neighbourhood") != null) {
                        name.append(", ");                    
                        name.append(x.getProperties().get("neighbourhood").toString());
                    }
                    if (x.getProperties().get("locality") != null) {
                        name.append(", ");                    
                        name.append(x.getProperties().get("locality").toString());
                    }
                    if (x.getProperties().get("region_a") != null) {
                        name.append(", ");                    
                        name.append(x.getProperties().get("region_a").toString());                    
                    }
                    if (x.getProperties().get("country_a") != null) {
                        name.append(", ");                    
                        name.append(x.getProperties().get("country_a").toString());                     
                    }
                    
                    GeocoderResult geocoderResult = new GeocoderResult(lat, lng, name.toString());
                    Results.addResult(geocoderResult);
                }
            }
        }
                      
        return Results;
    }
       
    private GeocoderResults noGeocoderResult(String error) {
        return new GeocoderResults(error);
    }

}
