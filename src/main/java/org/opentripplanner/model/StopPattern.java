package org.opentripplanner.model;

import java.io.Serializable;
import java.util.Arrays;
import java.util.List;

import org.onebusaway.gtfs.model.Stop;
import org.onebusaway.gtfs.model.StopTime;

/**
 * This class represents what is called a JourneyPattern in Transmodel: the sequence of stops at
 * which a trip (GTFS) or vehicle journey (Transmodel) calls, irrespective of the day on which 
 * service runs.
 * 
 * An important detail: Routes in GTFS are not a structurally important element, they just serve as
 * user-facing information. It is possible for the same journey pattern to appear in more than one
 * route. 
 * 
 * OTP already has several classes that represent this same thing: A TripPattern in the context of
 * routing. It represents all trips with the same stop pattern A ScheduledStopPattern in the GTFS
 * loading process. A RouteVariant in the TransitIndex, which has a unique human-readable name and
 * belongs to a particular route.
 * 
 * We would like to combine all these different classes into one.
 * 
 * Any two trips with the same stops in the same order, and that operate on the same days, can be
 * combined using a TripPattern to simplify the graph. This saves memory and reduces search
 * complexity since we only consider the trip that departs soonest for each pattern. AgencyAndId
 * calendarId has been removed. See issue #1320.
 * 
 * A StopPattern is very closely related to a TripPattern -- it essentially serves as the unique key for a TripPattern.
 * Should the route be included in the StopPattern?
 */
public class StopPattern implements Serializable {

    private static final long serialVersionUID = 20140101L;
    
    /* Constants for the GTFS pick up / drop off type fields. */
    // It would be nice to have an enum for these, but the equivalence with integers is important.
    public static final int PICKDROP_SCHEDULED = 0;
    public static final int PICKDROP_NONE = 1;
    public static final int PICKDROP_CALL_AGENCY = 2;
    public static final int PICKDROP_COORDINATE_WITH_DRIVER = 3;
    
    public final int size; // property could be derived from arrays
    public final Stop[] stops;
    public final int[]  pickups;
    public final int[]  dropoffs;

    public boolean equals(Object other) {
        if (other instanceof StopPattern) {
            StopPattern that = (StopPattern) other;
            return Arrays.equals(this.stops,    that.stops) && 
                   Arrays.equals(this.pickups,  that.pickups) && 
                   Arrays.equals(this.dropoffs, that.dropoffs);
        } else {
            return false;
        }
    }

    public int hashCode() {
        int hash = size;
        hash += Arrays.hashCode(this.stops);
        hash *= 31;
        hash += Arrays.hashCode(this.pickups);
        hash *= 31;
        hash += Arrays.hashCode(this.dropoffs);
        return hash;
    }

    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("StopPattern: ");
        for (int i = 0, j = stops.length; i < j; ++i) {
            sb.append(String.format("%s_%d%d ", stops[i].getCode(), pickups[i], dropoffs[i]));
        }
        return sb.toString();
    }

    private StopPattern (int size) {
        this.size = size;
        stops     = new Stop[size];
        pickups   = new int[size];
        dropoffs  = new int[size];
    }

    /** Assumes that stopTimes are already sorted by time. */
    public StopPattern (List<StopTime> stopTimes) {
        this (stopTimes.size());
        if (size == 0) return;
        for (int i = 0; i < size; ++i) {
            StopTime stopTime = stopTimes.get(i);
            stops[i] = stopTime.getStop();
            // should these just be booleans? anything but 1 means pick/drop is allowed.
            // pick/drop messages could be stored in individual trips
            pickups[i] = stopTime.getPickupType();
            dropoffs[i] = stopTime.getDropOffType();
        }
        /*
         * TriMet GTFS has many trips that differ only in the pick/drop status of their initial and
         * final stops. This may have something to do with interlining. They are turning pickups off
         * on the final stop of a trip to indicate that there is no interlining, because they supply
         * block IDs for all trips, even those followed by dead runs. See issue 681. Enabling
         * dropoffs at the initial stop and pickups at the final merges similar patterns while
         * having no effect on routing.
         */
        dropoffs[0] = 0;
        pickups[size - 1] = 0;
    }

    /**
     * @param stopId in agency_id format
     */
    public boolean containsStop (String stopId) {
        if (stopId == null) return false;
        for (Stop stop : stops) if (stopId.equals(stop.getId().toString())) return true;
        return false;
    }
}
