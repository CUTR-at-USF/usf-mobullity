package org.opentripplanner.api.resource;

import static org.opentripplanner.api.resource.ServerInfo.Q;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.xml.bind.annotation.XmlRootElement;

import lombok.Setter;

import org.opentripplanner.routing.edgetype.PlainStreetEdge;
import org.opentripplanner.routing.edgetype.StreetTraversalPermission;
import org.opentripplanner.routing.graph.Edge;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.routing.services.GraphService;
import org.opentripplanner.util.model.EncodedPolylineBean;

@Path("/routers/{routerId}/bike_lanes")
@XmlRootElement
public class BikeLanes {

    	@Context // FIXME inject Application context
    	@Setter
    	private GraphService graphService;

		@GET
		@Produces({ MediaType.APPLICATION_JSON })
		public ArrayList<String> getBikeLanes(@PathParam("routerId") String routerId) {
			ArrayList<String> tmp = new ArrayList<String>();
		
			Graph g = graphService.getGraph(routerId);
			if (g == null) return null;
			
			for (EncodedPolylineBean s : g.getBikeLanesStr())
				tmp.add(s.getPoints());
			//tmp.add(g.getBikeLanesStr().getPoints());
			
			return tmp;
		}
	
}
