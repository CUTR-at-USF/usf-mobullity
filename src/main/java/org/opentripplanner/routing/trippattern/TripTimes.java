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

package org.opentripplanner.routing.trippattern;

import java.io.Serializable;
import java.util.Arrays;
import java.util.BitSet;
import java.util.List;

import org.onebusaway.gtfs.model.StopTime;
import org.onebusaway.gtfs.model.Trip;
import org.opentripplanner.common.MavenVersion;
import org.opentripplanner.gtfs.BikeAccess;
import org.opentripplanner.routing.core.RoutingRequest;
import org.opentripplanner.routing.core.State;
import org.opentripplanner.routing.core.TraverseMode;
import org.opentripplanner.routing.request.BannedStopSet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A TripTimes represents the arrival and departure times for a single trip in an Timetable. It is carried
 * along by States when routing to ensure that they have a consistent, fast view of the trip when
 * realtime updates have been applied. All times are expressed as seconds since midnight (as in GTFS).
 */
public class TripTimes implements Serializable, Comparable<TripTimes>, Cloneable {

    private static final long serialVersionUID = MavenVersion.VERSION.getUID();
    private static final Logger LOG = LoggerFactory.getLogger(TripTimes.class);

    /**
     * This constant is used for indicating passed stops, fully canceled trips and trips that are
     * otherwise unavailable during routing. It should only be used in a contiguous block at the
     * beginning of the trip and may or may not cover the entire trip. Partially canceling a trip in
     * this way is specifically not allowed.
     */
    public static final int UNAVAILABLE = -1;

    /**
     * This allows re-using the same scheduled arrival and departure time arrays for many
     * different TripTimes. It is also used in materializing frequency-based TripTimes.
     */
    private int timeShift;

    /** The trips whose arrivals and departures are represented by this TripTimes */
    public final Trip trip;

    /** The code for the service on which this trip runs. For departure search optimizations. */
    // not final because these are set later, after TripTimes construction.
    public int serviceCode = -1;
    
    /**
     * Both trip_headsign and stop_headsign (per stop on a particular trip) are optional GTFS
     * fields. If the headsigns array is null, we will report the trip_headsign (which may also
     * be null) at every stop on the trip. If all the stop_headsigns are the same as the
     * trip_headsign we may also set the headsigns array to null to save space.
     * Field is private to force use of the getter method which does the necessary fallbacks.
     */
    private final String[] headsigns;

    /**
     * The time in seconds after midnight at which the vehicle should arrive at each stop according
     * to the original schedule.
     */
    private final int[] scheduledArrivalTimes;

    /**
     * The time in seconds after midnight at which the vehicle should leave each stop according
     * to the original schedule.
     */
    private final int[] scheduledDepartureTimes;

    /**
     * The time in seconds after midnight at which the vehicle arrives at each stop, accounting for
     * any real-time updates. Non-final to allow updates.
     */
    private int[] arrivalTimes;

    /**
     * The time in seconds after midnight at which the vehicle leaves each stop, accounting for
     * any real-time updates. Non-final to allow updates.
     */
    private int[] departureTimes;

    /**
     * These are the GTFS stop sequence numbers, which show the order in which the vehicle visits
     * the stops. Despite the face that the StopPattern or TripPattern enclosing this TripTimes
     * provides an ordered list of Stops, the original stop sequence numbers may still be needed for
     * matching with GTFS-RT update messages. Unfortunately, each individual trip can have totally
     * different sequence numbers for the same stops, so we need to store them at the individual
     * trip level. An effort is made to re-use the sequence number arrays when they are the same
     * across different trips in the same pattern.
     */
    private final int[] stopSequences;

    /**
     * Is this trip cancelled?
     */
    private boolean cancelled = false;

    /** A Set of stop indexes that are marked as timepoints in the GTFS input. */
    private final BitSet timepoints;

    /**
     * The provided stopTimes are assumed to be pre-filtered, valid, and monotonically increasing.
     * The non-interpolated stoptimes should already be marked at timepoints by a previous filtering step.
     */
    public TripTimes(Trip trip, List<StopTime> stopTimes, Deduplicator deduplicator) {
        this.trip = trip;
        int nStops = stopTimes.size();
        int[] departures = new int[nStops];
        int[] arrivals   = new int[nStops];
        int[] sequences  = new int[nStops];
        BitSet timepoints = new BitSet(nStops);
        // Times are always shifted to zero. This is essential for frequencies and deduplication.
        timeShift = stopTimes.get(0).getArrivalTime();
        int s = 0;
        for (StopTime st : stopTimes) {
            departures[s] = st.getDepartureTime() - timeShift;
            arrivals[s] = st.getArrivalTime() - timeShift;
            sequences[s] = st.getStopSequence();
            timepoints.set(s, st.getTimepoint() == 1);
            s++;
        }
        this.scheduledDepartureTimes = deduplicator.deduplicateIntArray(departures);
        this.scheduledArrivalTimes = deduplicator.deduplicateIntArray(arrivals);
        this.stopSequences = deduplicator.deduplicateIntArray(sequences);
        this.headsigns = deduplicator.deduplicateStringArray(makeHeadsignsArray(stopTimes));
        // We set these to null to indicate that this is a non-updated/scheduled TripTimes.
        // We cannot point to the scheduled times because they are shifted, and updated times are not.
        this.arrivalTimes = null;
        this.departureTimes = null;
        this.timepoints = deduplicator.deduplicateBitSet(timepoints);
        LOG.trace("trip {} has timepoint at indexes {}", trip, timepoints);
    }

    /** This copy constructor does not copy the actual times, only the scheduled times. */
    // It might be more maintainable to clone the triptimes then null out the scheduled times.
    // However, we then lose the "final" modifiers on the fields, and the immutability.
    public TripTimes(TripTimes object) {
        this.trip = object.trip;
        this.serviceCode = object.serviceCode;
        this.timeShift = object.timeShift;
        this.headsigns = object.headsigns;
        this.scheduledDepartureTimes = object.scheduledDepartureTimes;
        this.scheduledArrivalTimes = object.scheduledArrivalTimes;
        this.stopSequences = object.stopSequences;
        this.timepoints = object.timepoints;
    }

    /**
     * @return either an array of headsigns (one for each stop on this trip) or null if the
     * headsign is the same at all stops (including null) and can be found in the Trip object.
     */
    private String[] makeHeadsignsArray(List<StopTime> stopTimes) {
        String tripHeadsign = trip.getTripHeadsign();
        boolean useStopHeadsigns = false;
        if (tripHeadsign == null) {
            useStopHeadsigns = true;
        } else {
            for (StopTime st : stopTimes) {
                if ( ! (tripHeadsign.equals(st.getStopHeadsign()))) {
                    useStopHeadsigns = true;
                    break;
                }
            }
        }
        if (!useStopHeadsigns) {
            return null; //defer to trip_headsign
        }
        boolean allNull = true;
        int i = 0;
        String[] hs = new String[stopTimes.size()];
        for (StopTime st : stopTimes) {
            String headsign = st.getStopHeadsign();
            hs[i++] = headsign;
            if (headsign != null) allNull = false;
        }
        if (allNull) {
            return null;
        } else {
            return hs;
        }
    }

    /**
     * Trips may also have null headsigns, in which case we should fall back on a Timetable or
     * Pattern-level headsign. Such a string will be available when we give TripPatterns or
     * StopPatterns unique human readable route variant names, but a TripTimes currently does not
     * have a pointer to its enclosing timetable or pattern.
     */
    public String getHeadsign(int stop) {
        if (headsigns == null) {
            return trip.getTripHeadsign();
        } else {
            return headsigns[stop];
        }
    }

    /** @return the time in seconds after midnight that the vehicle arrives at the stop. */
    public int getScheduledArrivalTime(int stop) {
        return scheduledArrivalTimes[stop] + timeShift;
    }

    /** @return the amount of time in seconds that the vehicle waits at the stop. */
    public int getScheduledDepartureTime(int stop) {
        return scheduledDepartureTimes[stop] + timeShift;
    }

    /** @return the time in seconds after midnight that the vehicle arrives at the stop. */
    public int getArrivalTime(int stop) {
        if (arrivalTimes == null) return getScheduledArrivalTime(stop);
        else return arrivalTimes[stop]; // updated times are not time shifted.
    }

    /** @return the amount of time in seconds that the vehicle waits at the stop. */
    public int getDepartureTime(int stop) {
        if (departureTimes == null) return getScheduledDepartureTime(stop);
        else return departureTimes[stop]; // updated times are not time shifted.
    }

    /** @return the amount of time in seconds that the vehicle waits at the stop. */
    public int getDwellTime(int stop) {
        // timeShift is not relevant since this involves updated times and is relative.
        return getDepartureTime(stop) - getArrivalTime(stop);
    }

    /** @return the amount of time in seconds that the vehicle takes to reach the following stop. */
    public int getRunningTime(int stop) {
        // timeShift is not relevant since this involves updated times and is relative.
        return getArrivalTime(stop + 1) - getDepartureTime(stop);
    }

    /** @return the difference between the scheduled and actual arrival times at this stop. */
    public int getArrivalDelay(int stop) {
        return getArrivalTime(stop) - (scheduledArrivalTimes[stop] + timeShift);
    }

    /** @return the difference between the scheduled and actual departure times at this stop. */
    public int getDepartureDelay(int stop) {
        return getDepartureTime(stop) - (scheduledDepartureTimes[stop] + timeShift);
    }

    /**
     * @return true if this TripTimes represents an unmodified, scheduled trip from a published
     * timetable or false if it is a updated, cancelled, or otherwise modified one.
     */
    public boolean isScheduled() {
        return departureTimes == null && arrivalTimes == null;
    }

    /** Used in debugging / dumping times. */
    public static String formatSeconds(int s) {
        int m = s / 60;
        s = s % 60;
        int h = m / 60;
        m = m % 60;
        return String.format("%02d:%02d:%02d", h, m, s);
    }

    /**
     * When creating a scheduled TripTimes or wrapping it in updates, we could potentially imply
     * negative running or dwell times. We really don't want those being used in routing.
     * This method check that all times are increasing, and logs errors if this is not the case.
     * @return whether the times were found to be increasing.
     */
    public boolean timesIncreasing() {
        int nStops = scheduledArrivalTimes.length;
        int prevDep = -1;
        for (int s = 0; s < nStops; s++) {
            int arr = getArrivalTime(s);
            int dep = getDepartureTime(s);

            if (dep < arr) {
                LOG.error("Negative dwell time in TripTimes at stop index {}.", s);
                return false;
            }
            if (prevDep > arr) {
                LOG.error("Negative running time in TripTimes after stop index {}.", s);
                return false;
            }
            prevDep = dep;
        }
        return true;
    }

    /**
     * Once a trip has been found departing or arriving at an appropriate time, check whether that
     * trip fits other restrictive search criteria such as bicycle and wheelchair accessibility
     * and transfers with minimum time or forbidden transfers.
     */
    public boolean tripAcceptable(State state0, int stopIndex) {
        RoutingRequest options = state0.getOptions();
        BannedStopSet banned = options.bannedTrips.get(trip.getId());
        if (banned != null && banned.contains(stopIndex)) {
            return false;
        }
        if (options.wheelchairAccessible && trip.getWheelchairAccessible() != 1) {
            return false;
        }
        // Establish whether we have a rented _or_ owned bicycle.
        boolean bicycle = state0.getNonTransitMode() == TraverseMode.BICYCLE;
        if (bicycle && BikeAccess.fromTrip(trip) != BikeAccess.ALLOWED) {
            return false;
        }
        return true;
    }

    /** Cancel this entire trip */
    public void cancel() {
        cancelled = true;
        arrivalTimes = new int[getNumStops()];
        Arrays.fill(arrivalTimes, UNAVAILABLE);
        departureTimes = arrivalTimes;
    }

    public void updateDepartureTime(int stop, int time) {
        checkCreateTimesArrays();
        departureTimes[stop] = time;
    }

    public void updateDepartureDelay(int stop, int delay) {
        checkCreateTimesArrays();
        departureTimes[stop] = scheduledDepartureTimes[stop] + timeShift + delay;
    }

    public void updateArrivalTime(int stop, int time) {
        checkCreateTimesArrays();
        arrivalTimes[stop] = time;
    }

    public void updateArrivalDelay(int stop, int delay) {
        checkCreateTimesArrays();
        arrivalTimes[stop] = scheduledArrivalTimes[stop] + timeShift + delay;
    }

    /**
     * If they don't already exist, create arrays for updated arrival and departure times
     * that are just time-shifted copies of the zero-based scheduled departure times.
     */
    private void checkCreateTimesArrays() {
        if (arrivalTimes == null) {
            arrivalTimes = Arrays.copyOf(scheduledArrivalTimes, scheduledArrivalTimes.length);
            departureTimes = Arrays.copyOf(scheduledDepartureTimes, scheduledDepartureTimes.length);
            for (int i = 0; i < arrivalTimes.length; i++) {
                arrivalTimes[i] += timeShift;
                departureTimes[i] += timeShift;
            }
        }
    }

    public int getNumStops () {
        return scheduledArrivalTimes.length;
    }

    /** Sort TripTimes based on first departure time. */
    @Override
    public int compareTo(TripTimes other) {
        return this.getDepartureTime(0) - other.getDepartureTime(0);
    }

    public TripTimes clone() {
        TripTimes ret = null;
        try {
            ret = (TripTimes) super.clone();
        } catch (CloneNotSupportedException e) {
            LOG.error("This is not happening.");
        }
        return ret;
    }

   /**
    * Returns a time-shifted copy of this TripTimes in which the vehicle passes the given stop
    * index (not stop sequence number) at the given time. We only have a mechanism to shift the
    * scheduled stoptimes, not the real-time stoptimes. Therefore, this only works on trips
    * without updates for now (frequency trips don't have updates).
    */
    public TripTimes timeShift (int stop, int time, boolean depart) {
        if (arrivalTimes != null || departureTimes != null) return null;
        TripTimes shifted = this.clone();
        // Adjust 0-based times to match desired stoptime.
        int shift = time - (depart ? getDepartureTime(stop) : getArrivalTime(stop));
        shifted.timeShift += shift; // existing shift should usually (always?) be 0 on freqs
        return shifted;
    }

    /** Just to create uniform getter-syntax across the whole public interface of TripTimes. */
    public int getStopSequence(int stop) {
        return stopSequences[stop];
    }

    /** @return whether or not stopIndex is considered a timepoint in this TripTimes. */
    public boolean isTimepoint(int stopIndex) {
        return timepoints.get(stopIndex);
    }
}
