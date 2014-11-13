package org.opentripplanner.routing.graph;

import java.util.BitSet;
import java.util.Calendar;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.google.common.collect.HashMultimap;
import com.google.common.collect.Lists;
import com.google.common.collect.Multimap;
import org.joda.time.LocalDate;
import org.onebusaway.gtfs.model.Agency;
import org.onebusaway.gtfs.model.AgencyAndId;
import org.onebusaway.gtfs.model.Route;
import org.onebusaway.gtfs.model.Stop;
import org.onebusaway.gtfs.model.Trip;
import org.onebusaway.gtfs.model.calendar.ServiceDate;
import org.onebusaway.gtfs.services.calendar.CalendarService;
import org.opentripplanner.api.resource.SimpleIsochrone;
import org.opentripplanner.common.LuceneIndex;
import org.opentripplanner.common.geometry.DistanceLibrary;
import org.opentripplanner.common.geometry.HashGrid;
import org.opentripplanner.common.geometry.SphericalDistanceLibrary;
import org.opentripplanner.common.model.P2;
import org.opentripplanner.index.model.PatternShort;
import org.opentripplanner.index.model.StopTimesInPattern;
import org.opentripplanner.index.model.TripTimeShort;
import org.opentripplanner.profile.ProfileTransfer;
import org.opentripplanner.profile.StopAtDistance;
import org.opentripplanner.routing.core.RoutingRequest;
import org.opentripplanner.routing.core.ServiceDay;
import org.opentripplanner.routing.core.State;
import org.opentripplanner.routing.edgetype.TablePatternEdge;
import org.opentripplanner.routing.edgetype.Timetable;
import org.opentripplanner.routing.edgetype.TripPattern;
import org.opentripplanner.routing.trippattern.TripTimes;
import org.opentripplanner.routing.vertextype.TransitStop;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.Maps;
import com.google.common.collect.Sets;

/**
 * This class contains all the transient indexes of graph elements -- those that are not
 * serialized with the graph. Caching these maps is essentially an optimization, but a big one.
 * The index is bootstrapped from the graph's list of edges.
 */
public class GraphIndex {

    private static final Logger LOG = LoggerFactory.getLogger(GraphIndex.class);

    // TODO: consistently key on model object or id string
    public final Map<String, Vertex> vertexForId = Maps.newHashMap();
    public final Map<String, Agency> agencyForId = Maps.newHashMap();
    public final Map<AgencyAndId, Stop> stopForId = Maps.newHashMap();
    public final Map<AgencyAndId, Trip> tripForId = Maps.newHashMap();
    public final Map<AgencyAndId, Route> routeForId = Maps.newHashMap();
    public final Map<AgencyAndId, String> serviceForId = Maps.newHashMap();
    public final Map<String, TripPattern> patternForId = Maps.newHashMap();
    public final Map<Stop, TransitStop> stopVertexForStop = Maps.newHashMap();
    public final Map<Trip, TripPattern> patternForTrip = Maps.newHashMap();
    public final Multimap<Agency, TripPattern> patternsForAgency = ArrayListMultimap.create();
    public final Multimap<Route, TripPattern> patternsForRoute = ArrayListMultimap.create();
    public final Multimap<Stop, TripPattern> patternsForStop = ArrayListMultimap.create();
    public final Multimap<String, Stop> stopsForParentStation = ArrayListMultimap.create();
    public final HashGrid<TransitStop> stopSpatialIndex = new HashGrid<TransitStop>();

    /* Should eventually be replaced with new serviceId indexes. */
    private final CalendarService calendarService;
    private final Map<AgencyAndId,Integer> serviceCodes;

    /* Full-text search extensions */
    public LuceneIndex luceneIndex;

    /* Separate transfers for profile routing */
    public Multimap<Stop, ProfileTransfer> transfersForStop;

    /* This is a workaround, and should probably eventually be removed. */
    public Graph graph;

    /** Used for finding first/last trip of the day. This is the time at which service ends for the day. */
    public final int overnightBreak = 60 * 60 * 2; // FIXME not being set, this was done in transitIndex

    public GraphIndex (Graph graph) {
        LOG.info("Indexing graph...");
        for (Agency a : graph.getAgencies()) {
            agencyForId.put(a.getId(), a);
        }
        Collection<Edge> edges = graph.getEdges();
        /* We will keep a separate set of all vertices in case some have the same label. 
         * Maybe we should just guarantee unique labels. */
        Set<Vertex> vertices = Sets.newHashSet();
        for (Edge edge : edges) {
            vertices.add(edge.getFromVertex());
            vertices.add(edge.getToVertex());
            if (edge instanceof TablePatternEdge) {
                TablePatternEdge patternEdge = (TablePatternEdge) edge;
                TripPattern pattern = patternEdge.getPattern();
                patternForId.put(pattern.getCode(), pattern);
            }
        }
        for (Vertex vertex : vertices) {
            vertexForId.put(vertex.getLabel(), vertex);
            if (vertex instanceof TransitStop) {
                TransitStop transitStop = (TransitStop) vertex;
                Stop stop = transitStop.getStop();
                stopForId.put(stop.getId(), stop);
                stopVertexForStop.put(stop, transitStop);
                stopsForParentStation.put(stop.getParentStation(), stop);
            }
        }
        stopSpatialIndex.setProjectionMeridian(vertices.iterator().next().getCoordinate().x);
        for (TransitStop stopVertex : stopVertexForStop.values()) {
            stopSpatialIndex.put(stopVertex.getCoordinate(), stopVertex);
        }
        for (TripPattern pattern : patternForId.values()) {
            patternsForAgency.put(pattern.route.getAgency(), pattern);
            patternsForRoute.put(pattern.route, pattern);
            for (Trip trip : pattern.getTrips()) {
                patternForTrip.put(trip, pattern);
                tripForId.put(trip.getId(), trip);
            }
            for (Stop stop: pattern.getStops()) {
                patternsForStop.put(stop, pattern);
            }
        }
        for (Route route : patternsForRoute.asMap().keySet()) {
            routeForId.put(route.getId(), route);
        }
        // Copy these two service indexes from the graph until we have better ones.
        calendarService = graph.getCalendarService();
        serviceCodes = graph.serviceCodes;
        this.graph = graph;
        LOG.info("Done indexing graph.");
    }

    private void analyzeServices() {
        // This is a mess because CalendarService, CalendarServiceData, etc. are all in OBA.
        // TODO catalog days of the week and exceptions for each service day.
        // Make a table of which services are running on each calendar day.
        // Really the calendarService should be entirely replaced with a set
        // of simple indexes in GraphIndex.
    }

    private static DistanceLibrary distlib = new SphericalDistanceLibrary();

    /**
     * Initialize transfer data needed for profile routing.
     * Find the best transfers between each pair of routes that pass near one another.
     */
    public void initializeProfileTransfers() {
        transfersForStop = HashMultimap.create();
        final double TRANSFER_RADIUS = 500.0; // meters
        SimpleIsochrone.MinMap<P2<TripPattern>, ProfileTransfer> bestTransfers = new SimpleIsochrone.MinMap<P2<TripPattern>, ProfileTransfer>();
        LOG.info("Finding transfers...");
        for (Stop s0 : stopForId.values()) {
            Collection<TripPattern> ps0 = patternsForStop.get(s0);
            for (StopAtDistance sd : findTransitStops(s0.getLon(), s0.getLat(), TRANSFER_RADIUS)) {
                Stop s1 = sd.stop;
                Collection<TripPattern> ps1 = patternsForStop.get(s1);
                for (TripPattern p0 : ps0) {
                    for (TripPattern p1 : ps1) {
                        if (p0 == p1)
                            continue;
                        bestTransfers.putMin(new P2<TripPattern>(p0, p1), new ProfileTransfer(p0, p1,
                                s0, s1, sd.distance));
                    }
                }
            }
        }
        for (ProfileTransfer tr : bestTransfers.values()) {
            transfersForStop.put(tr.s1, tr);
        }
        /*
         * for (Stop stop : transfersForStop.keys()) { System.out.println("STOP " + stop); for
         * (Transfer transfer : transfersForStop.get(stop)) { System.out.println("    " +
         * transfer.toString()); } }
         */
        LOG.info("Done finding transfers.");
    }

    /**
     * For profile routing. Actually, now only used for finding transfers.
     * TODO replace with an on-street search.
     */
    public List<StopAtDistance> findTransitStops(double lon, double lat, double radius) {
        List<StopAtDistance> ret = Lists.newArrayList();
        for (TransitStop tstop : stopSpatialIndex.query(lon, lat, radius)) {
            Stop stop = tstop.getStop();
            int distance = (int) distlib.distance(lat, lon, stop.getLat(), stop.getLon());
            if (distance < radius)
                ret.add(new StopAtDistance(stop, distance));
        }
        return ret;
    }

    /** An OBA Service Date is a local date without timezone, only year month and day. */
    public BitSet servicesRunning (ServiceDate date) {
        BitSet services = new BitSet(calendarService.getServiceIds().size());
        for (AgencyAndId serviceId : calendarService.getServiceIdsOnDate(date)) {
            int n = serviceCodes.get(serviceId);
            if (n < 0) continue;
            services.set(n);
        }
        return services;
    }

    /**
     * Wraps the other servicesRunning whose parameter is an OBA ServiceDate.
     * Joda LocalDate is a similar class.
     */
    public BitSet servicesRunning (LocalDate date) {
        return servicesRunning(new ServiceDate(date.getYear(), date.getMonthOfYear(), date.getDayOfMonth()));
    }

    /** Dynamically generate the set of Routes passing though a Stop on demand. */
    public Set<Route> routesForStop(Stop stop) {
        Set<Route> routes = Sets.newHashSet();
        for (TripPattern p : patternsForStop.get(stop)) {
            routes.add(p.route);
        }
        return routes;
    }

    /**
     * Fetch upcoming vehicle arrivals at a stop.
     * This is a rather convoluted process because all of the departure search functions currently assume the
     * existence of a State and a routing context. It would be nice to have another function that gives
     * all departures within a time window at a stop, being careful to get a mix of all patterns passing through
     * that stop. In fact, such a function could replace the current boarding logic if we want to allow boarding
     * more than one trip on the same route at once (return more than one state).
     * The current implementation is a sketch and does not adequately
     */
    public Collection<StopTimesInPattern> stopTimesForStop(Stop stop) {
        List<StopTimesInPattern> ret = Lists.newArrayList();

        RoutingRequest req = new RoutingRequest();

        Calendar dt = Calendar.getInstance();
        dt.setTime(new Date());
        
        /*
        dt.set(Calendar.HOUR_OF_DAY, 0);
        dt.set(Calendar.MINUTE, 0);
        dt.set(Calendar.SECOND, 0);       
        
        req.setDateTime(dt.getTime()); // Set State to midnight so we receive ALL of the scheduled trips like we used to
        */
        
        dt.add(Calendar.SECOND, 1);
        
        req.setRoutingContext(graph, (Vertex)null, (Vertex)null);
        State state = new State(req);
        for (TripPattern pattern : patternsForStop.get(stop)) {
            StopTimesInPattern times = new StopTimesInPattern(pattern);
            
            req.setDateTime(dt.getTime());
            state = new State(req);
            Timetable table = pattern.getUpdatedTimetable(req, state.getServiceDay());
                        
            // A Stop may occur more than once in a pattern, so iterate over all Stops.
            for (int sidx = 0; sidx < table.getPattern().getStopPattern().stops.length; sidx++) {
            //for (Stop currStop : table.getPattern().getStopPattern().stops) {
            	Stop currStop = table.getPattern().getStop(sidx);
                if (currStop != stop) continue;
                                
                for (ServiceDay sd : req.rctx.serviceDays) {
                	
                   		TripTimes tt = table.getNextTrip(state, sd, sidx, true);
                   
                		if (tt != null) {  
                    		
                            times.times.add(new TripTimeShort(tt, sidx, stop));
                            
                		}
              		               		
                }
                
                if ( ! times.times.isEmpty()) ret.add(times);
                
            }
    		                       
        }
        return ret;
    }

}
