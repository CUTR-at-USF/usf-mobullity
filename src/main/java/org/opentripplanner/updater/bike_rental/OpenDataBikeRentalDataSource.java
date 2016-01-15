package org.opentripplanner.updater.bike_rental;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.prefs.Preferences;

import org.opentripplanner.updater.PreferencesConfigurable;
import org.opentripplanner.routing.bike_rental.BikeRentalStation;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.util.HttpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;


/**
 * Fetch Bike Rental JSON feeds and pass each record on to the specific rental subclass
 *
 * @see BikeRentalDataSource
 */
public final class OpenDataBikeRentalDataSource extends GenericJSONBikeRentalDataSource {

    private static final Logger log = LoggerFactory.getLogger(OpenDataBikeRentalDataSource.class);
    private String url;

    ArrayList<BikeRentalStation> stations = new ArrayList<BikeRentalStation>();

    public OpenDataBikeRentalDataSource() {
        super("data/bikes");
    }

    public void configure(Graph graph, Preferences preferences) {
        String url = preferences.get("url", null);
        if (url == null)
            throw new IllegalArgumentException("Missing mandatory 'url' configuration.");
        setUrl(url + "/free_bike_status.json");
    }

    public BikeRentalStation makeStation(JsonNode stationNode) {

         BikeRentalStation brStation = new BikeRentalStation();

         brStation.id = String.valueOf(stationNode.get("bike_id").textValue());
         brStation.name = stationNode.get("name").textValue();

         brStation.x = stationNode.get("lon").doubleValue();// / 1000000.0;
         brStation.y = stationNode.get("lat").doubleValue();// / 1000000.0;

         brStation.bikesAvailable = 1;
         brStation.spacesAvailable = 0;

	 if (stationNode.get("is_reserved").intValue() != 0 || stationNode.get("is_disabled").intValue() != 0) 
		return null; // don't add a broken or unavailable bike

	return brStation;
    }

}
