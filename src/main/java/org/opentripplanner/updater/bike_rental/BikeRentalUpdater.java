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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Map.Entry;
import java.util.concurrent.ExecutionException;
import java.util.prefs.Preferences;

import lombok.AllArgsConstructor;
import lombok.Setter;

import org.opentripplanner.routing.bike_rental.BikeRentalStation;
import org.opentripplanner.routing.bike_rental.BikeRentalStationService;
import org.opentripplanner.routing.edgetype.RentABikeOffEdge;
import org.opentripplanner.routing.edgetype.RentABikeOnEdge;
import org.opentripplanner.routing.edgetype.loader.LinkRequest;
import org.opentripplanner.routing.edgetype.loader.NetworkLinkerLibrary;
import org.opentripplanner.routing.graph.Edge;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.routing.vertextype.BikeRentalStationVertex;
import org.opentripplanner.updater.GraphUpdaterManager;
import org.opentripplanner.updater.GraphWriterRunnable;
import org.opentripplanner.updater.PollingGraphUpdater;
import org.opentripplanner.updater.PreferencesConfigurable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Dynamic bike-rental station updater which encapsulate one BikeRentalDataSource.
 * 
 * Usage example ('bike1' name is an example) in the file 'Graph.properties':
 * 
 * <pre>
 * bike1.type = bike-rental
 * bike1.frequencySec = 60
 * bike1.networks = V3,V3N
 * bike1.sourceType = jcdecaux
 * bike1.url = https://api.jcdecaux.com/vls/v1/stations?contract=Xxx?apiKey=Zzz
 * </pre>
 */
public class BikeRentalUpdater extends PollingGraphUpdater {

    private static final Logger LOG = LoggerFactory.getLogger(BikeRentalUpdater.class);

    private GraphUpdaterManager updaterManager;

    private static final String DEFAULT_NETWORK_LIST = "default";

    Map<BikeRentalStation, BikeRentalStationVertex> verticesByStation = new HashMap<BikeRentalStation, BikeRentalStationVertex>();

    private BikeRentalDataSource source;

    private Graph graph;

    private NetworkLinkerLibrary networkLinkerLibrary;

    private BikeRentalStationService service;

    @Setter
    private String network = "default";

    @Override
    public void setGraphUpdaterManager(GraphUpdaterManager updaterManager) {
        this.updaterManager = updaterManager;
    }

    @Override
    protected void configurePolling(Graph graph, Preferences preferences) throws Exception {
        // Set source from preferences
        String sourceType = preferences.get("sourceType", null);
        BikeRentalDataSource source = null;
        if (sourceType != null) {
            if (sourceType.equals("jcdecaux")) {
                source = new JCDecauxBikeRentalDataSource();
            } else if (sourceType.equals("b-cycle")) {
                source = new BCycleBikeRentalDataSource();
            } else if (sourceType.equals("bixi")) {
                source = new BixiBikeRentalDataSource();
            } else if (sourceType.equals("keolis-rennes")) {
                source = new KeolisRennesBikeRentalDataSource();
            } else if (sourceType.equals("ov-fiets")) {
                source = new OVFietsKMLDataSource();
            } else if (sourceType.equals("city-bikes")) {
                source = new CityBikesBikeRentalDataSource();            
	    } else if (sourceType.equals("socialbicycles")) {
                source = new SocialBicyclesBikeRentalDataSource();
	    } else if (sourceType.equals("local-file")) {
        	source = new LocalFileBikeRentalDataSource();    
            } else if (sourceType.equals("csv-file")) {
        	source = new CsvBikeRentalDataSource();
            }                
        }

        if (source == null) {
            throw new IllegalArgumentException("Unknown bike rental source type: " + sourceType);
        } else if (source instanceof PreferencesConfigurable) {
            ((PreferencesConfigurable) source).configure(graph, preferences);
        }

        // Configure updater
        LOG.info("Setting up bike rental updater.");
        this.graph = graph;
        this.source = source;
        setNetwork(preferences.get("networks", DEFAULT_NETWORK_LIST));
        LOG.info("Creating bike-rental updater running every {} seconds : {}", getFrequencySec(),
                source);
    }

    @Override
    public void setup() throws InterruptedException, ExecutionException {
        // Creation of network linker library will not modify the graph
        networkLinkerLibrary = new NetworkLinkerLibrary(graph,
                Collections.<Class<?>, Object> emptyMap());

        // Adding a bike rental station service needs a graph writer runnable
        updaterManager.executeBlocking(new GraphWriterRunnable() {
            @Override
            public void run(Graph graph) {
                service = graph.getService(BikeRentalStationService.class);
                if (service == null) {
                    service = new BikeRentalStationService();
                    graph.putService(BikeRentalStationService.class, service);
                }
            }
        });
    }

    @Override
    protected void runPolling() throws Exception {
        LOG.debug("Updating bike rental stations from " + source);
        if (!source.update()) {
            LOG.debug("No updates");
            return;
        }
        List<BikeRentalStation> stations = source.getStations();

        // Create graph writer runnable to apply these stations to the graph
        BikeRentalGraphWriterRunnable graphWriterRunnable = new BikeRentalGraphWriterRunnable(stations);
        updaterManager.execute(graphWriterRunnable);
    }

    @Override
    public void teardown() {
    }

    @AllArgsConstructor
    private class BikeRentalGraphWriterRunnable implements GraphWriterRunnable {

        private List<BikeRentalStation> stations;

        @Override
        public void run(Graph graph) {
            // Apply stations to graph
            Set<BikeRentalStation> stationSet = new HashSet<BikeRentalStation>();
            Set<String> networks = new HashSet<String>(Arrays.asList(network));
            /* add any new stations and update bike counts for existing stations */
            for (BikeRentalStation station : stations) {
                service.addStation(station);
                stationSet.add(station);
                BikeRentalStationVertex vertex = verticesByStation.get(station);
                if (vertex == null) {
                    vertex = new BikeRentalStationVertex(graph, station);
                    LinkRequest request = networkLinkerLibrary.connectVertexToStreets(vertex);
                    for (Edge e : request.getEdgesAdded()) {
                        graph.addTemporaryEdge(e);
                    }
                    verticesByStation.put(station, vertex);
                    new RentABikeOnEdge(vertex, vertex, networks);
                    new RentABikeOffEdge(vertex, vertex, networks);
                } else {
                    vertex.setBikesAvailable(station.bikesAvailable);
                    vertex.setSpacesAvailable(station.spacesAvailable);
                }
            }
            /* remove existing stations that were not present in the update */
            List<BikeRentalStation> toRemove = new ArrayList<BikeRentalStation>();
            for (Entry<BikeRentalStation, BikeRentalStationVertex> entry : verticesByStation.entrySet()) {
                BikeRentalStation station = entry.getKey();
                if (stationSet.contains(station))
                    continue;
                BikeRentalStationVertex vertex = entry.getValue();
                if (graph.containsVertex(vertex)) {
                    graph.removeVertexAndEdges(vertex);
                }
                toRemove.add(station);
                service.removeStation(station);
                // TODO: need to unsplit any streets that were split
            }
            for (BikeRentalStation station : toRemove) {
                // post-iteration removal to avoid concurrent modification
                verticesByStation.remove(station);
            }
        }
    }
}
