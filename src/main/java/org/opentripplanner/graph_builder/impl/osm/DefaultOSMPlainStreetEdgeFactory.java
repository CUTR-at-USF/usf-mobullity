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

package org.opentripplanner.graph_builder.impl.osm;

import org.opentripplanner.openstreetmap.model.OSMNode;
import org.opentripplanner.openstreetmap.model.OSMWithTags;
import org.opentripplanner.routing.edgetype.AreaEdge;
import org.opentripplanner.routing.edgetype.AreaEdgeList;
import org.opentripplanner.routing.edgetype.PlainStreetEdge;
import org.opentripplanner.routing.edgetype.StreetTraversalPermission;
import org.opentripplanner.routing.vertextype.IntersectionVertex;

import com.vividsolutions.jts.geom.LineString;

public class DefaultOSMPlainStreetEdgeFactory implements OSMPlainStreetEdgeFactory {

    private static final String wayLabelFormat = "osm:way:%d";
    
    private static final String areaLabelFormat = "osm:area:%d";
    
    private String getLabelForWay(OSMWithTags way) {
        return String.format(wayLabelFormat, way.getId());
    }
    
    private String getLabelForArea(OSMWithTags way) {
        return String.format(areaLabelFormat, way.getId());
    }
    
    @Override
    public PlainStreetEdge createEdge(OSMNode fromNode, OSMNode toNode, OSMWithTags way,
            IntersectionVertex startEndpoint, IntersectionVertex endEndpoint, LineString geometry,
            String name, double length, StreetTraversalPermission permissions, boolean back,
            float carSpeed) {
        PlainStreetEdge pse = new PlainStreetEdge(startEndpoint, endEndpoint, geometry, name, length, permissions,
                back, carSpeed);
        pse.setLabel(getLabelForWay(way));
        return pse;
    }

    @Override
    public AreaEdge createAreaEdge(OSMNode nodeI, OSMNode nodeJ,
            OSMWithTags areaEntity, IntersectionVertex startEndpoint,
            IntersectionVertex endEndpoint, LineString geometry, String name,
            double length, StreetTraversalPermission permissions,
            boolean back, float carSpeed, AreaEdgeList area) {
        AreaEdge ae = new AreaEdge(startEndpoint, endEndpoint, geometry, name, length, permissions,
                back, carSpeed, area);
        ae.setLabel(getLabelForArea(areaEntity));
        return ae;
    }
}
