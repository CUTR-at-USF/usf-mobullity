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

import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.prefs.Preferences;

import org.opentripplanner.updater.PreferencesConfigurable;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.updater.GraphUpdaterManager;
import org.opentripplanner.updater.PollingGraphUpdater;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
        // If zero-time dwell edges have been deleted, stop time updates can't be applied to them anymore,
        // so we don't want to run a stop time updater.
        if (graph.isDwellsDeleted()) {
            throw new IllegalStateException("Can't apply vehicle position updates to absent dwell edges.");
        }

        // Create update streamer from preferences
        agencyId = preferences.get("defaultAgencyId", "");
        String sourceType = preferences.get("sourceType", null);
        if (sourceType != null) {
            if (sourceType.equals("gtfs-http")) {
                updateSource = new GtfsRealtimeHttpVehiclePositionSource();
            } else {
            	throw new IllegalStateException("Invalid Source type");
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

        LOG.info("Creating vehicle position updater running every {} seconds : {}",
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
        // Get update lists from update source
        List<VehiclePosition> updates = updateSource.getUpdates();

        if (updates != null && updates.size() > 0) {
            // Handle trip updates via graph writer runnable
        	//create new runnable thread with method run to update hashmaps
        	//print to console to test working

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
