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

package org.opentripplanner;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import junit.framework.TestCase;

import org.onebusaway.gtfs.model.AgencyAndId;
import org.opentripplanner.api.model.Itinerary;
import org.opentripplanner.api.model.Leg;
import org.opentripplanner.api.model.TripPlan;
import org.opentripplanner.api.resource.PlanGenerator;
import org.opentripplanner.common.model.GenericLocation;
import org.opentripplanner.graph_builder.impl.GtfsGraphBuilderImpl;
import org.opentripplanner.graph_builder.model.GtfsBundle;
import org.opentripplanner.routing.algorithm.GenericAStar;
import org.opentripplanner.routing.core.RoutingRequest;
import org.opentripplanner.routing.core.ServiceDay;
import org.opentripplanner.routing.core.TraverseMode;
import org.opentripplanner.routing.core.TraverseModeSet;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.routing.impl.AlertPatchServiceImpl;
import org.opentripplanner.routing.impl.DefaultStreetVertexIndexFactory;
import org.opentripplanner.routing.impl.LongDistancePathService;
import org.opentripplanner.routing.impl.RetryingPathServiceImpl;
import org.opentripplanner.routing.services.PathService;
import org.opentripplanner.updater.alerts.AlertsUpdateHandler;
import org.opentripplanner.updater.stoptime.TimetableSnapshotSource;

import com.google.transit.realtime.GtfsRealtime.FeedEntity;
import com.google.transit.realtime.GtfsRealtime.FeedMessage;
import com.google.transit.realtime.GtfsRealtime.TripUpdate;

/** Common base class for many test classes which need to load a GTFS feed in preparation for tests. */
public abstract class GtfsTest extends TestCase {

    public Graph graph;
    AlertsUpdateHandler alertsUpdateHandler;
    PlanGenerator planGenerator;
    PathService pathService;
    GenericAStar genericAStar;
    TimetableSnapshotSource timetableSnapshotSource;
    AlertPatchServiceImpl alertPatchServiceImpl;

    public abstract String getFeedName();

    public boolean isLongDistance() { return false; }

    private String agencyId;

    public Itinerary itinerary = null;

    protected void setUp() {
        File gtfs = new File("src/test/resources/" + getFeedName());
        File gtfsRealTime = new File("src/test/resources/" + getFeedName() + ".pb");
        GtfsBundle gtfsBundle = new GtfsBundle(gtfs);
        List<GtfsBundle> gtfsBundleList = Collections.singletonList(gtfsBundle);
        GtfsGraphBuilderImpl gtfsGraphBuilderImpl = new GtfsGraphBuilderImpl(gtfsBundleList);

        alertsUpdateHandler = new AlertsUpdateHandler();
        graph = new Graph();
        gtfsBundle.setTransfersTxtDefinesStationPaths(true);
        gtfsGraphBuilderImpl.buildGraph(graph, null);
        // Set the agency ID to be used for tests to the first one in the feed.
        agencyId = graph.getAgencyIds().iterator().next();
        System.out.printf("Set the agency ID for this test to %s\n", agencyId);
        graph.index(new DefaultStreetVertexIndexFactory());
        timetableSnapshotSource = new TimetableSnapshotSource(graph);
        timetableSnapshotSource.setPurgeExpiredData(false);
        graph.setTimetableSnapshotSource(timetableSnapshotSource);
        alertPatchServiceImpl = new AlertPatchServiceImpl(graph);
        alertsUpdateHandler.setAlertPatchService(alertPatchServiceImpl);
        alertsUpdateHandler.setDefaultAgencyId("MMRI");

        try {
            InputStream inputStream = new FileInputStream(gtfsRealTime);
            FeedMessage feedMessage = FeedMessage.PARSER.parseFrom(inputStream);
            List<FeedEntity> feedEntityList = feedMessage.getEntityList();
            List<TripUpdate> updates = new ArrayList<TripUpdate>(feedEntityList.size());
            for (FeedEntity feedEntity : feedEntityList) {
                updates.add(feedEntity.getTripUpdate());
            }
            timetableSnapshotSource.applyTripUpdates(updates, agencyId);
            alertsUpdateHandler.update(feedMessage);
        } catch (Exception exception) {}

        genericAStar = new GenericAStar();
        if (isLongDistance()) {
            pathService = new LongDistancePathService(null, genericAStar);
        } else {
            pathService = new RetryingPathServiceImpl(null, genericAStar);
            genericAStar.setNPaths(1);
        }
        planGenerator = new PlanGenerator(null, pathService);
    }

    public Leg plan(long dateTime, String fromVertex, String toVertex, String onTripId,
             boolean wheelchairAccessible, boolean preferLeastTransfers, TraverseMode preferredMode,
             String excludedRoute, String excludedStop) {
        return plan(dateTime, fromVertex, toVertex, onTripId, wheelchairAccessible,
                preferLeastTransfers, preferredMode, excludedRoute, excludedStop, 1)[0];
    }

    public Leg[] plan(long dateTime, String fromVertex, String toVertex, String onTripId,
               boolean wheelchairAccessible, boolean preferLeastTransfers, TraverseMode preferredMode,
               String excludedRoute, String excludedStop, int legCount) {
        final TraverseMode mode = preferredMode != null ? preferredMode : TraverseMode.TRANSIT;
        RoutingRequest routingRequest = new RoutingRequest();

        routingRequest.setArriveBy(dateTime < 0);
        routingRequest.dateTime = Math.abs(dateTime);
        if (fromVertex != null && !fromVertex.isEmpty()) {
            routingRequest.setFrom(new GenericLocation(null, agencyId + "_" + fromVertex));
        }
        if (toVertex != null && !toVertex.isEmpty()) {
            routingRequest.setTo(new GenericLocation(null, agencyId + "_" + toVertex));
        }
        if (onTripId != null && !onTripId.isEmpty()) {
            routingRequest.setStartingTransitTripId(new AgencyAndId(agencyId, onTripId));
        }
        routingRequest.setRoutingContext(graph);
        routingRequest.setWheelchairAccessible(wheelchairAccessible);
        routingRequest.setTransferPenalty(preferLeastTransfers ? 300 : 0);
        routingRequest.setModes(new TraverseModeSet(TraverseMode.WALK, mode));
        if (excludedRoute != null && !excludedRoute.isEmpty()) {
            routingRequest.setBannedRoutes(agencyId + "__" + excludedRoute);
        }
        if (excludedStop != null && !excludedStop.isEmpty()) {
            routingRequest.setBannedStopsHard(agencyId + "_" + excludedStop);
        }
        routingRequest.setOtherThanPreferredRoutesPenalty(0);
        // The walk board cost is set low because it interferes with test 2c1.
        // As long as boarding has a very low cost, waiting should not be "better" than riding
        // since this makes interlining _worse_ than alighting and re-boarding the same line.
        // TODO rethink whether it makes sense to weight waiting to board _less_ than 1.
        routingRequest.setWaitReluctance(1);
        routingRequest.setWalkBoardCost(30);

        TripPlan tripPlan = planGenerator.generate(routingRequest);
        // Stored in instance field for use in individual tests
        itinerary = tripPlan.itinerary.get(0);

        assertEquals(legCount, itinerary.legs.size());

        return itinerary.legs.toArray(new Leg[legCount]);
    }

    public void validateLeg(Leg leg, long startTime, long endTime, String toStopId, String fromStopId,
                     String alert) {
        assertEquals(startTime, leg.startTime.getTimeInMillis());
        assertEquals(endTime, leg.endTime.getTimeInMillis());
        assertEquals(toStopId, leg.to.stopId.getId());
        assertEquals(agencyId, leg.to.stopId.getAgencyId());
        if (fromStopId != null) {
            assertEquals(agencyId, leg.from.stopId.getAgencyId());
            assertEquals(fromStopId, leg.from.stopId.getId());
        } else {
            assertNull(leg.from.stopId);
        }
        if (alert != null) {
            assertNotNull(leg.alerts);
            assertEquals(1, leg.alerts.size());
            assertEquals(alert, leg.alerts.get(0).alertHeaderText.getSomeTranslation());
        } else {
            assertNull(leg.alerts);
        }
    }
}
