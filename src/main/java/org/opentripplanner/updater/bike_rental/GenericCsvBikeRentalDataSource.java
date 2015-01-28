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

import java.io.FileInputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.prefs.Preferences;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.opentripplanner.updater.PreferencesConfigurable;
import org.opentripplanner.routing.bike_rental.BikeRentalStation;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.util.HttpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import java.io.BufferedInputStream;
import java.io.BufferedReader;

public abstract class GenericCsvBikeRentalDataSource implements BikeRentalDataSource, PreferencesConfigurable {

    private static final Logger log = LoggerFactory.getLogger(GenericCsvBikeRentalDataSource.class);

    protected String url;

    ArrayList<BikeRentalStation> stations = new ArrayList<BikeRentalStation>();

    private String delimiter;

    public GenericCsvBikeRentalDataSource(String delim) {
    	this.delimiter = delim;    	
    }

    @Override
    public boolean update() {
        try {
            BufferedReader data = new BufferedReader(new FileReader(url));
            if (data == null) {
                log.warn("Failed to get data from url " + url);
                return false;
            }
            parse(data);
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

    protected void parse(BufferedReader data) throws ParserConfigurationException, SAXException,
            IOException {
        ArrayList<BikeRentalStation> out = new ArrayList<BikeRentalStation>();

        // XXX line.split should be replaced by a more sophisticated csv parser
        
        List<String> headers = new ArrayList<String>();        
        String line = data.readLine();       
        String[] p = line.split(this.delimiter);

		for (String column : p) {
        	headers.add(column);
        }

		while ((line = data.readLine()) != null) {

			p = line.split(this.delimiter);
            HashMap<String, String> attributes = new HashMap<String, String>();
            for (int i=0; i < p.length; i++) {
            	attributes.put(headers.get(i), p[i]);
            }
            
            BikeRentalStation brstation = makeStation(attributes);
            if (brstation != null)
                out.add(brstation);
                       
        }
        synchronized(this) {
            stations = out;
        }
    }

    @Override
    public synchronized List<BikeRentalStation> getStations() {
        return stations;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public abstract BikeRentalStation makeStation(Map<String, String> attributes);

    @Override
    public String toString() {
        return getClass().getName() + "(" + url + ")";
    }
    
    @Override
    public void configure(Graph graph, Preferences preferences) {
        String url = preferences.get("url", null);
        if (url == null)
            throw new IllegalArgumentException("Missing mandatory 'url' configuration.");
        setUrl(url);
    }
}
