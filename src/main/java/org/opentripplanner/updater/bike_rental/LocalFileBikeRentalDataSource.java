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

import java.io.IOException;
import java.io.InputStream;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;

import org.opentripplanner.routing.bike_rental.BikeRentalStation;
import org.opentripplanner.util.HttpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;
import java.io.FileInputStream;

public class LocalFileBikeRentalDataSource extends GenericXmlBikeRentalDataSource {
	
    private static final Logger log = LoggerFactory.getLogger(LocalFileBikeRentalDataSource.class);
    
    public LocalFileBikeRentalDataSource() {
        super("//stations/station");
    }

    @Override
    public boolean update() {
        try {
            InputStream data = new FileInputStream(url);
            if (data == null) {
                log.warn("Failed to get data from url " + url);
                return false;
            }
            parseXML(data);
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

    public BikeRentalStation makeStation(Map<String, String> attributes) {
        if (!"true".equals(attributes.get("installed"))) {
            return null;
        }
        BikeRentalStation brstation = new BikeRentalStation();
        brstation.id = attributes.get("id");
        brstation.x = Double.parseDouble(attributes.get("long"));
        brstation.y = Double.parseDouble(attributes.get("lat"));
        brstation.name = attributes.get("name");
        brstation.bikesAvailable = Integer.parseInt(attributes.get("bikesAvailable"));
        brstation.spacesAvailable = Integer.parseInt(attributes.get("spacesAvailable"));
        
        return brstation;
    }
}
