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

import java.text.ParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.TimeZone;

import lombok.Setter;

import org.onebusaway.gtfs.model.AgencyAndId;
import org.onebusaway.gtfs.model.calendar.ServiceDate;
import org.opentripplanner.routing.edgetype.TableTripPattern;
import org.opentripplanner.routing.edgetype.TimetableResolver;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.routing.services.TransitIndexService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.transit.realtime.GtfsRealtime.VehiclePosition;

/**
 * This class should be used to create snapshots of lookup tables of realtime data. This is
 * necessary to provide planning threads a consistent constant view of a graph with realtime data at
 * a specific point in time.
 */
public class TimetableSnapshotSource {
    private static final Logger LOG = LoggerFactory.getLogger(TimetableSnapshotSource.class);

    @Setter
    private int logFrequency = 2000;

    private int appliedBlockCount = 0;

    /**
     * If a timetable snapshot is requested less than this number of milliseconds after the previous
     * snapshot, just return the same one. Throttles the potentially resource-consuming task of
     * duplicating a TripPattern -> Timetable map and indexing the new Timetables.
     */
    @Setter private int maxSnapshotFrequency = 1000; // msec

    /**
     * The last committed snapshot that was handed off to a routing thread. This snapshot may be
     * given to more than one routing thread if the maximum snapshot frequency is exceeded.
     */
    private TimetableResolver snapshot = null;

    /** The working copy of the timetable resolver. Should not be visible to routing threads. */
    private TimetableResolver buffer = new TimetableResolver();

    /** Should expired realtime data be purged from the graph. */
    @Setter private boolean purgeExpiredData = true;

    /** The TransitIndexService */
    private TransitIndexService transitIndexService;

    protected ServiceDate lastPurgeDate = null;

    protected long lastSnapshotTime = -1;

    private final TimeZone timeZone;

    public TimetableSnapshotSource(Graph graph) {
        timeZone = graph.getTimeZone();
        transitIndexService = graph.getService(TransitIndexService.class);
        if (transitIndexService == null)
            throw new RuntimeException("Real-time updates need a TransitIndexService. " +
                    "Please setup one during graph building.");
    }

    /**
     * @return an up-to-date snapshot mapping TripPatterns to Timetables. This snapshot and the
     *         timetable objects it references are guaranteed to never change, so the requesting
     *         thread is provided a consistent view of all TripTimes. The routing thread need only
     *         release its reference to the snapshot to release resources.
     */
    public TimetableResolver getTimetableSnapshot() {
        return getTimetableSnapshot(false);
    }

    protected synchronized TimetableResolver getTimetableSnapshot(boolean force) {
        long now = System.currentTimeMillis();
        if (force || now - lastSnapshotTime > maxSnapshotFrequency) {
            if (force || buffer.isDirty()) {
                LOG.debug("Committing {}", buffer.toString());
                snapshot = buffer.commit(force);
            } else {
                LOG.debug("Buffer was unchanged, keeping old snapshot.");
            }
            lastSnapshotTime = System.currentTimeMillis();
        } else {
            LOG.debug("Snapshot frequency exceeded. Reusing snapshot {}", snapshot);
        }
        return snapshot;
    }

    /**
     * Method to apply a trip update list to the most recent version of the timetable snapshot.
     */
    public void applyVehiclePositions(List<VehiclePosition> updates, String agencyId) {
        if (updates == null) {
            LOG.warn("updates is null");
            return;
        }
        
        
        
        
        LOG.debug("end of update message");

        // Make a snapshot after each message in anticipation of incoming requests
        // Purge data if necessary (and force new snapshot if anything was purged)
        if(purgeExpiredData) {
            boolean modified = purgeExpiredData();
            getTimetableSnapshot(modified);
        } else {
            getTimetableSnapshot();
        }
    }

    protected boolean purgeExpiredData() {
        ServiceDate today = new ServiceDate();
        ServiceDate previously = today.previous().previous(); // Just to be safe...

        if(lastPurgeDate != null && lastPurgeDate.compareTo(previously) > 0) {
            return false;
        }

        LOG.debug("purging expired realtime data");
        // TODO: purge expired realtime data

        lastPurgeDate = previously;

        return buffer.purgeExpiredData(previously);
    }

    protected TableTripPattern getPatternForTrip(AgencyAndId tripId) {
        TableTripPattern pattern = transitIndexService.getTripPatternForTrip(tripId);
        return pattern;
    }
}
