package org.opentripplanner.api.resource;

import static org.opentripplanner.api.resource.ServerInfo.Q;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import org.opentripplanner.routing.graph.PoiNode;

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

@Path("/routers/{routerId}/pois")
@XmlRootElement
public class POIs {

    	@Context // FIXME inject Application context
    	@Setter
    	private GraphService graphService;

		@GET
		@Produces({ MediaType.APPLICATION_JSON })
		public Map<String, ArrayList<PoiNode>> get(@PathParam("routerId") String routerId,
            @QueryParam("query") String query) {

			Graph g = graphService.getGraph(routerId);
			if (g == null) return null;
		
            // Map for result
            Map<String, ArrayList<PoiNode>> res = new HashMap<String, ArrayList<PoiNode>>();
            
            // Map of matching POI keys 
            Map<String, ArrayList<PoiNode>> q = new HashMap<String, ArrayList<PoiNode>>();

            // Exact match on POI Key
            if (g.pois.containsKey( query )) {
                q.put( query, g.pois.get(query) );
            }
            // iterative matching for e.g: key:value* queries
            else {
                for (String k : g.pois.keySet()) {
                    if ( query != null && ! k.toLowerCase().contains( query.toLowerCase() )) continue;
                    q.put( k, g.pois.get(k) );
                }
            }

            // Find all matching PoiNodes, and create JSON string
            return q;
		}
	
}
