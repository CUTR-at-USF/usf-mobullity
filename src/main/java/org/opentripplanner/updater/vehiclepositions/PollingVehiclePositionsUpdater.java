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

package org.opentripplanner.updater.vehiclepositions;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.prefs.Preferences;

import org.opentripplanner.updater.PreferencesConfigurable;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.updater.GraphUpdaterManager;
import org.opentripplanner.updater.PollingGraphUpdater;
import org.opentripplanner.updater.stoptime.GtfsRealtimeFileTripUpdateSource;
import org.opentripplanner.updater.stoptime.GtfsRealtimeHttpTripUpdateSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.transit.realtime.GtfsRealtime.Position;
import com.google.transit.realtime.GtfsRealtime.VehiclePosition;

/**
 * Update OTP stop time tables from some (realtime) source
 *
 * Usage example ('rt' name is an example) in file 'Graph.properties':
 *
 * <pre>
 * rt.type = stop-time-updater
 * rt.frequencySec = 60
 * rt.sourceType = gtfs-http
 * rt.url = http://host.tld/path
 * rt.defaultAgencyId = TA
 * </pre>
 *
 */
public class PollingVehiclePositionsUpdater extends PollingGraphUpdater {
    private static final Logger LOG = LoggerFactory.getLogger(PollingVehiclePositionsUpdater.class);
    
    /**
     * Hash Map for Vehicle Positions
     */
    public static List<String> vehicleIds = new ArrayList<String>();
    public static Map<String, Vehicle> vehiclesById = new ConcurrentHashMap<String, Vehicle>();
    
    /**
     * Parent update manager. Is used to execute graph writer runnables.
     */
    private GraphUpdaterManager updaterManager;

    /**
     * Update streamer
     */
    private VehiclePositionSource updateSource;

    /**
     * Property to set on the RealtimeDataSnapshotSource
     */
    private Integer logFrequency;

    /**
     * Property to set on the RealtimeDataSnapshotSource
     */
    private Integer maxSnapshotFrequency;

    /**
     * Property to set on the RealtimeDataSnapshotSource
     */
    private Boolean purgeExpiredData;

    /**
     * Default agency id that is used for the trip ids in the Vehicle Positions
     */
    private String agencyId;

    @Override
    public void setGraphUpdaterManager(GraphUpdaterManager updaterManager) {
        this.updaterManager = updaterManager;
    }

    @Override
    public void configurePolling(Graph graph, Preferences preferences) throws Exception {
    	// Create update streamer from preferences
        agencyId = preferences.get("defaultAgencyId", "");
        String sourceType = preferences.get("sourceType", null);
        if (sourceType != null) {
            if (sourceType.equals("gtfs-http")) {
                updateSource = new GtfsRealtimeHttpVehiclePositionSource();
            } 
        }

        // Configure update source
        if (updateSource == null) {
            throw new IllegalArgumentException(
                    "Unknown update streamer source type: " + sourceType);
        } else if (updateSource instanceof PreferencesConfigurable) {
            ((PreferencesConfigurable) updateSource).configure(graph, preferences);
        }

        // Configure updater
        int logFrequency = preferences.getInt("logFrequency", -1);
        if (logFrequency >= 0) {
            this.logFrequency = logFrequency;
        }
        int maxSnapshotFrequency = preferences.getInt("maxSnapshotFrequencyMs", -1);
        if (maxSnapshotFrequency >= 0)
            this.maxSnapshotFrequency = maxSnapshotFrequency;
        String purgeExpiredData = preferences.get("purgeExpiredData", "");
        if (!purgeExpiredData.isEmpty()) {
            this.purgeExpiredData = preferences.getBoolean("purgeExpiredData", true);
        }

        LOG.info("Creating stop time updater running every {} seconds : {}",
                getFrequencySec(), updateSource);
    }

    @Override
    public void setup() throws InterruptedException, ExecutionException {
       
    }

    /**
     * Repeatedly makes blocking calls to an UpdateStreamer to retrieve new stop time updates, and
     * applies those updates to the graph.
     */
    @Override
    public void runPolling() {
        // Get update lists from update source and clear hashmap
    	final List<VehiclePosition> updates = updateSource.getUpdates();
        vehicleIds.clear();
        vehiclesById.clear();
        
        if (updates != null && updates.size() > 0) {
            //Handle vehicle position updates
        	//create new runnable thread with method run to update hashmaps
        	//print to console to test working
        	new Thread(){
        		public void run(){
        			for(int x = 0; x < updates.size(); x++){
        				//Print updates array to console to show vehicle positions:
        				//System.out.println("Veh: " + (x+1) + " Route: " + updates.get(x).getTrip().getRouteId() +" Lat: " + updates.get(x).getPosition().getLatitude() + " Long: " + updates.get(x).getPosition().getLongitude());
        				
        				//setting vehicle variables to set up hash map
        				Position position = updates.get(x).getPosition();
        				String vehicleId = updates.get(x).getVehicle().getId();
        				String routeId = updates.get(x).getTrip().getRouteId();
        				Vehicle v = new Vehicle();
        				v.id = vehicleId;
        				v.lat=position.getLatitude();
        				v.lon=position.getLongitude();
        				v.routeId=routeId;
        				v.agencyId=agencyId;
        				v.bearing=position.getBearing();
        				v.lastUpdate=System.currentTimeMillis();
        				
        				//setting up the hash map
        				Vehicle existing = vehiclesById.get(vehicleId);
        				if (existing == null || existing.lat != v.lat || existing.lon != v.lon) {
        					vehicleIds.add(vehicleId);
        					vehiclesById.put(vehicleId, v);
        				}
        				else { v.lastUpdate=existing.lastUpdate; }
        			}
        			//prints out hash map
//        			for(int y = 0; y < updates.size(); y++)
//        			{
//        				String tmp = updates.get(y).getVehicle().getId();
//        				if(vehiclesById.containsKey(tmp))
//        				{
//        					Vehicle x = vehiclesById.get(tmp);
//        					System.out.println("ID: " + x.id + " @ lat: " + x.lat + " long: " + x.lon + " On Route: " + x.routeId + " going " + x.bearing + " ... Last Update: " + x.lastUpdate);
//        				}
//        			}
        		}
        	}.start();
        }
    }

    @Override
    public void teardown() {
    }

    public String toString() {
        String s = (updateSource == null) ? "NONE" : updateSource.toString();
        return "Streaming vehicle position updater with update source = " + s;
    }
}
