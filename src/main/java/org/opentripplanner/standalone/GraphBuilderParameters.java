package org.opentripplanner.standalone;

import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Iterator;

import org.opentripplanner.graph_builder.services.osm.CustomNamer;
import org.opentripplanner.routing.impl.DefaultFareServiceFactory;
import org.opentripplanner.routing.services.FareServiceFactory;

import org.opentripplanner.standalone.GraphBuilderParameters;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * These are parameters that when changed, necessitate a Graph rebuild.
 * They are distinct from the RouterParameters which can be applied to a pre-built graph or on the fly at runtime.
 * Eventually both classes may be initialized from the same config file so make sure there is no overlap
 * in the JSON keys used.
 *
 * These used to be command line parameters, but there were getting to be too many of them and besides, we want to
 * allow different graph builder configuration for each Graph.
 * <p>
 * TODO maybe have only one giant config file and just annotate the parameters to indicate which ones trigger a rebuild
 * ...or just feed the same JSON tree to two different classes, one of which is the build configuration and the other is the router configuration.
 */
public class GraphBuilderParameters {

    public static double DEFAULT_SUBWAY_ACCESS_TIME = 2.0; // minutes

    /**
     * Generates nice HTML report of Graph errors/warnings (annotations). They are stored in the same location as the graph.
     */
    public final boolean htmlAnnotations;

    /**
     * If number of annotations is larger then specified number annotations will be split in multiple files.
     * Since browsers have problems opening large HTML files.
     */
    public final int maxHtmlAnnotationsPerFile;

    /**
     * Include all transit input files (GTFS) from scanned directory.
     */
    public final boolean transit;

    /**
     * Create direct transfer edges from transfers.txt in GTFS, instead of based on distance.
     */
    public final boolean useTransfersTxt;

    /**
     * Link GTFS stops to their parent stops.
     */
    public final boolean parentStopLinking;

    /**
     * Create direct transfers between the constituent stops of each parent station.
     */
    public final boolean stationTransfers;

    /**
     * Minutes necessary to reach stops served by trips on routes of route_type=1 (subway) from the street.
     * Perhaps this should be a runtime router parameter rather than a graph build parameter.
     */
    public final double subwayAccessTime;

    /**
     * Include street input files (OSM/PBF).
     */
    public final boolean streets;

    /**
     * Embed the Router config in the graph, which allows it to be sent to a server fully configured over the wire.
     */
    public final boolean embedRouterConfig;

    /**
     * Perform visibility calculations on OSM areas (these calculations can be time consuming).
     */
    public final boolean areaVisibility;

    /**
     * Based on GTFS shape data, guess which OSM streets each bus runs on to improve stop linking.
     */
    public final boolean matchBusRoutesToStreets;

    /**
     * Download US NED elevation data and apply it to the graph.
     */
    public final boolean fetchElevationUS;

    /**
     * A specific fares service to use.
     */

    /**
     * A custom OSM namer to use.
     */

    /**
     * Whether bike rental stations should be loaded from OSM, rather than periodically dynamically pulled from APIs.
     */
    public boolean staticBikeRental = false;

    /**
     * Whether we should create car P+R stations from OSM data.
     */
    public boolean staticParkAndRide = true;

    /**
     * Whether we should create bike P+R stations from OSM data.
     */
    public boolean staticBikeParkAndRide = false;

    /**
      * Map of points of interest that we should find and save in the graph from OSM. 
      * 'tag_to_search_for': { 'value': ['related_settings'], },
      */
    public Map<String, List<JsonNode>> pois;
 
    /**
     * Set all parameters from the given Jackson JSON tree, applying defaults.
     * Supplying MissingNode.getInstance() will cause all the defaults to be applied.
     * This could be done automatically with the "reflective query scraper" but it's less type safe and less clear.
     * Until that class is more type safe, it seems simpler to just list out the parameters by name here.
     */
    public GraphBuilderParameters(JsonNode config) {

        htmlAnnotations = config.path("htmlAnnotations").asBoolean(false);
        transit = config.path("transit").asBoolean(true);
        useTransfersTxt = config.path("useTransfersTxt").asBoolean(false);
        parentStopLinking = config.path("parentStopLinking").asBoolean(false);
        stationTransfers = config.path("stationTransfers").asBoolean(false);
        subwayAccessTime = config.path("subwayAccessTime").asDouble(DEFAULT_SUBWAY_ACCESS_TIME);
        streets = config.path("streets").asBoolean(true);
        embedRouterConfig = config.path("embedRouterConfig").asBoolean(true);
        areaVisibility = config.path("areaVisibility").asBoolean(false);
        matchBusRoutesToStreets = config.path("matchBusRoutesToStreets").asBoolean(false);
        fetchElevationUS = config.path("fetchElevationUS").asBoolean(false);
        staticBikeRental = config.path("staticBikeRental").asBoolean(false);
        staticParkAndRide = config.path("staticParkAndRide").asBoolean(true);
        staticBikeParkAndRide = config.path("staticBikeParkAndRide").asBoolean(false);
        maxHtmlAnnotationsPerFile = config.path("maxHtmlAnnotationsPerFile").asInt(1000);

        pois = new HashMap<String, List<JsonNode>>();
        for (Iterator<Map.Entry<String, JsonNode>> it = config.path("pois").fields(); it.hasNext(); ) {
            Map.Entry<String, JsonNode> r = it.next();

            for (Iterator<Map.Entry<String, JsonNode>> it2 = r.getValue().fields(); it2.hasNext(); ) {
                Map.Entry<String, JsonNode> node = it2.next();
                String tagName = String.format("%s:%s", r.getKey(), node.getKey());
// XXX instead of key:name, use an object with tag, value properties

                if (!pois.containsKey( tagName )) pois.put( tagName, new ArrayList<JsonNode>() );

                pois.get(tagName).add( node.getValue() );
            }
        }

    }

}
