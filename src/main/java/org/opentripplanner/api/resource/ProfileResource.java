package org.opentripplanner.api.resource;

import java.util.List;

import javax.inject.Singleton;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.opentripplanner.api.param.HourMinuteSecond;
import org.opentripplanner.api.param.LatLon;
import org.opentripplanner.api.param.QueryParameter;
import org.opentripplanner.api.param.YearMonthDay;
import org.opentripplanner.profile.Option;
import org.opentripplanner.profile.ProfileRequest;
import org.opentripplanner.profile.ProfileResponse;
import org.opentripplanner.profile.ProfileRouter;
import org.opentripplanner.routing.core.TraverseModeSet;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.routing.services.GraphService;
import org.opentripplanner.standalone.OTPServer;

/**
 * A Jersey resource class which exposes OTP profile routing functionality
 * as a web service.
 */
@Path("routers/{routerId}/profile")
public class ProfileResource {

    private Graph graph;

    public ProfileResource (@Context OTPServer otpServer, @PathParam("routerId") String routerId) {
        graph = otpServer.graphService.getGraph(routerId);
    }

    @GET
    @Produces({ MediaType.APPLICATION_JSON })
    public Response profileRoute (
            @QueryParam("from")  LatLon from,
            @QueryParam("to")    LatLon to,
            @QueryParam("date")       @DefaultValue("today") YearMonthDay date,
            @QueryParam("startTime")  @DefaultValue("07:00") HourMinuteSecond fromTime,
            @QueryParam("endTime")    @DefaultValue("09:00") HourMinuteSecond toTime,
            @QueryParam("walkSpeed")  @DefaultValue("1.4")   float walkSpeed, // m/sec
            @QueryParam("bikeSpeed")  @DefaultValue("4.1")   float bikeSpeed, // m/sec
            @QueryParam("streetTime") @DefaultValue("200")   int streetTime,  // max minutes to reach destination with no transit
            @QueryParam("accessTime") @DefaultValue("15")    int accessTime,  // max minutes to reach transit
            @QueryParam("orderBy")    @DefaultValue("MIN")   Option.SortOrder orderBy,
            @QueryParam("limit")      @DefaultValue("10")    int limit,
            @QueryParam("modes")      @DefaultValue("WALK,TRANSIT") TraverseModeSet modes)
            throws Exception {

        QueryParameter.checkRangeInclusive(limit, 0, Integer.MAX_VALUE);
        QueryParameter.checkRangeInclusive(walkSpeed, 0, 7);
        QueryParameter.checkRangeInclusive(bikeSpeed, 0, 21);
        QueryParameter.checkRangeInclusive(streetTime, 1, 480);
        QueryParameter.checkRangeInclusive(accessTime, 1, 480);
        ProfileRequest req = new ProfileRequest();
        req.from       = from;
        req.to         = to;
        req.fromTime   = fromTime.toSeconds();
        req.toTime     = toTime.toSeconds();
        req.walkSpeed  = walkSpeed;
        req.bikeSpeed  = bikeSpeed;
        req.streetTime = streetTime;
        req.accessTime = accessTime;
        req.date       = date.toJoda();
        req.orderBy    = orderBy;
        req.limit      = limit;
        req.modes      = modes;

        ProfileRouter router = new ProfileRouter(graph, req);
        ProfileResponse response = router.route();
        return Response.status(Status.OK).entity(response).build();
    
    }
    
}
