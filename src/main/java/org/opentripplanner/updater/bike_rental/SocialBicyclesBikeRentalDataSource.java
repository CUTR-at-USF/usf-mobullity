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

package org.opentripplanner.updater.bike_rental;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;
import java.util.prefs.Preferences;

import javax.xml.parsers.ParserConfigurationException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.opentripplanner.updater.PreferencesConfigurable;
import org.opentripplanner.routing.bike_rental.BikeRentalStation;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.util.HttpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xml.sax.SAXException;

import org.opentripplanner.util.HttpUtils;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.StatusLine;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpHead;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.params.BasicHttpParams;
import org.apache.http.params.HttpConnectionParams;
import org.apache.http.params.HttpParams;
import org.apache.http.protocol.HttpContext;
import org.apache.http.protocol.BasicHttpContext;
import org.apache.http.Header;


// TODO This class could probably inherit from GenericJSONBikeRentalDataSource
public class SocialBicyclesBikeRentalDataSource implements BikeRentalDataSource, PreferencesConfigurable {

    private static final Logger log = LoggerFactory.getLogger(SocialBicyclesBikeRentalDataSource.class);

    private String url;
    private String network_id;
    private String dataType;

    private String oauth_client_id;
    private String oauth_token;

    ArrayList<BikeRentalStation> stations = new ArrayList<BikeRentalStation>();

    public SocialBicyclesBikeRentalDataSource() {

    }

    @Override
    public boolean update() {
        try {
	    int next_page = 1, count = 0;
	    // Loop to get each page of results from API with hard-limit of 15 pages

	    while (next_page > 0 && count < 15) {
		    count++;
		    String tmpurl = String.format("%s?page=%d&client_id=%s&network_id=%s", this.url, next_page, this.oauth_client_id, this.network_id);
	            InputStream stream = HttpUtils.getData(tmpurl, "Authorization", "Bearer " + this.oauth_token);
        	    if (stream == null) {
                	log.warn("Failed to get data from url " + tmpurl);
	                return false;
        	    }

	            Reader reader = new BufferedReader(new InputStreamReader(stream,
        	            Charset.forName("UTF-8")));
	            StringBuilder builder = new StringBuilder();
        	    char[] buffer = new char[4096];
	            int charactersRead;
        	    while ((charactersRead = reader.read(buffer, 0, buffer.length)) > 0) {
                	builder.append(buffer, 0, charactersRead);
	            }
        	    String data = builder.toString();

		    int tmp_page;
		    if (this.dataType.equals("hubs")) tmp_page = parseJson(data);
		    else tmp_page = parseBikesJson(data);

		    if (tmp_page > next_page) next_page = tmp_page;
		    else break;
	    }

        } catch (IOException e) {
            log.warn("Error reading bike rental feed from " + url, e);
            return false;
        } catch (ParserConfigurationException e) {
            throw new RuntimeException(e);
        } catch (SAXException e) {
            log.warn("Error parsing bike rental feed from " + url + "(bad XML of some sort)", e);
            return false;
        }

        return true;
    }

    private int parseJson(String data) throws ParserConfigurationException, SAXException,
            IOException {
        ArrayList<BikeRentalStation> out = new ArrayList<BikeRentalStation>();

        // Jackson ObjectMapper to read in JSON
        ObjectMapper mapper = new ObjectMapper();

	// https://app.socialbicycles.com/developer/#!/hubs/GET_hubs_format_get_0

        for (JsonNode stationNode : mapper.readTree(data).get("items")) {

            BikeRentalStation brStation = new BikeRentalStation();
            brStation.id = String.valueOf(stationNode.get("id").intValue());
            brStation.x = stationNode.get("middle_point").get("coordinates").get(1).doubleValue();// / 1000000.0;
            brStation.y = stationNode.get("middle_point").get("coordinates").get(0).doubleValue();// / 1000000.0;
            brStation.name = stationNode.get("name").textValue();

            brStation.bikesAvailable = stationNode.get("available_bikes").intValue();
            brStation.spacesAvailable = stationNode.get("free_racks").intValue();
          
            if (brStation != null && brStation.id != null) {
            	out.add(brStation);
            }            
        }

        synchronized (this) {
	    // Add/update new stations
	    for (int i=0; i < out.size(); i++) {
		if (Integer.parseInt(out.get(i).id) < stations.size()) {
			// XXX we need to ensure of the order we receive the stations...
			stations.set(Integer.parseInt(out.get(i).id), out.get(i) );
		}
		else stations.add(out.get(i));
	    }
        }

	int page = mapper.readTree(data).get("current_page").intValue();
	int per_page = mapper.readTree(data).get("per_page").intValue();
	int total_entries = mapper.readTree(data).get("total_entries").intValue();

	if (page*per_page < total_entries) return ++page;
	
	return 0;
    }

    // XXX NOTE: Since OTP BikeRentalStations are limited to an id, name, x/y coords, and the # of bikes/spaces available, we try to map the global bikes.json API
    // data to these fields as appropriately as possible. 
    private int parseBikesJson(String data) throws ParserConfigurationException, SAXException,
            IOException {
        ArrayList<BikeRentalStation> out = new ArrayList<BikeRentalStation>();

        // Jackson ObjectMapper to read in JSON
        ObjectMapper mapper = new ObjectMapper();

        for (JsonNode stationNode : mapper.readTree(data).get("items")) {

            BikeRentalStation brStation = new BikeRentalStation();
            brStation.id = String.valueOf(stationNode.get("id").intValue());
            brStation.x = stationNode.get("current_position").get("coordinates").get(1).doubleValue();// / 1000000.0;
            brStation.y = stationNode.get("current_position").get("coordinates").get(0).doubleValue();// / 1000000.0;
            brStation.name = stationNode.get("name").textValue();

            brStation.bikesAvailable = 1;
            brStation.spacesAvailable = 0;  // Not a rack, this is a bike :)

	    if (! stationNode.get("repair_state").textValue().equals("working")) {
		brStation.bikesAvailable = -1; 
	    }
	    else if (! stationNode.get("state").textValue().equals("available")) {
		brStation.bikesAvailable = 0;
	    }

            if (brStation != null && brStation.id != null) {
                out.add(brStation);
            }
        }

        synchronized (this) {
            // Add/update new stations
            for (int i=0; i < out.size(); i++) {
                if (Integer.parseInt(out.get(i).id) < stations.size()) {
                        // XXX we need to ensure of the order we receive the stations...
                        stations.set(Integer.parseInt(out.get(i).id), out.get(i) );
                }
                else stations.add(out.get(i));
            }
        }

        int page = mapper.readTree(data).get("current_page").intValue();
        int per_page = mapper.readTree(data).get("per_page").intValue();
        int total_entries = mapper.readTree(data).get("total_entries").intValue();

        if (page*per_page < total_entries) return ++page;

        return 0;
    }

    @Override
    public synchronized List<BikeRentalStation> getStations() {
        return stations;
    }

    public String getDataType() {
        return this.dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public void setNetworkId(String network) {
        this.network_id = network;
    }

    public void setOAuthClient(String client) {
        this.oauth_client_id = client;
    }

    public void setOAuthToken(String token) {
        this.oauth_token = token;
    }


    @Override
    public String toString() {
        return getClass().getName() + "(" + network_id + ")";
    }
    
    @Override
    public void configure(Graph graph, Preferences preferences) {

        String url = preferences.get("url", null);
        if (url == null)
            throw new IllegalArgumentException("Missing mandatory 'url' configuration.");
        setUrl(url);

        String network = preferences.get("network_id", null);
        if (network == null)
            throw new IllegalArgumentException("Missing mandatory 'network_id' configuration.");
        setNetworkId(network);

        String client_id = preferences.get("oauth_client_id", null);
        if (client_id == null)
            throw new IllegalArgumentException("Missing mandatory 'oauth_client_id' configuration.");
        setOAuthClient(client_id);

        String token = preferences.get("oauth_token", null);
        if (token == null)
            throw new IllegalArgumentException("Missing mandatory 'oauth_token' configuration.");
        setOAuthToken(token);

        String dataType = preferences.get("datatype", "hubs");
        setDataType(dataType);

    }

/*
bike1.oauth_client_id = "eecb4d722a30ce01a3ba39315b26bcf0c3e370e46f12efdaadc0c0110ff13695"
bike1.oauth_token = "e7306884e3084169a5f6b08e47525e4f46139a3d400a78154ea31c519698e81d"
bike1.network_id = 48
bike1.url = https://app.socialbicycles.com
*/

}
