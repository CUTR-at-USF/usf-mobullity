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

public class CsvBikeRentalDataSource extends GenericCsvBikeRentalDataSource {
	
    private static final Logger log = LoggerFactory.getLogger(CsvBikeRentalDataSource.class);
    
    public CsvBikeRentalDataSource() {
        super(",");
    }

    public BikeRentalStation makeStation(Map<String, String> attributes) {
    	
        BikeRentalStation brstation = new BikeRentalStation();
                
        brstation.id = attributes.get("S.No");
        brstation.x = Double.parseDouble(attributes.get("Longitude"));
        brstation.y = Double.parseDouble(attributes.get("Latitude"));
        brstation.name = brstation.id; //attributes.get("name");
        //brstation.bikesAvailable = Integer.parseInt(attributes.get("bikesAvailable"));
        try {
        	brstation.spacesAvailable = Integer.parseInt(attributes.get("No of racks"));
        }
        catch (java.lang.NumberFormatException ex) {
        	brstation.spacesAvailable = 0;
        }
        brstation.bikesAvailable = brstation.spacesAvailable;        
        
        return brstation;
    }
}
