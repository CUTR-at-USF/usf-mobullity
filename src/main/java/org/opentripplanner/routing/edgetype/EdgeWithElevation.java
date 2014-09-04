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

package org.opentripplanner.routing.edgetype;

import org.opentripplanner.common.geometry.PackedCoordinateSequence;
import org.opentripplanner.routing.graph.Edge;
import org.opentripplanner.routing.graph.Vertex;
import org.opentripplanner.routing.util.ElevationProfileSegment;

/**
 * An edge which has an elevation profile -- a street, basically.
 *
 */
public abstract class EdgeWithElevation extends Edge {    
    private static final long serialVersionUID = 4603374694558661207L;
    
    public EdgeWithElevation(Vertex fromv, Vertex tov) {
        super(fromv, tov);
    }
    
    public abstract PackedCoordinateSequence getElevationProfile();
    public abstract PackedCoordinateSequence getElevationProfile(double from, double to);
    public abstract boolean 
        setElevationProfile(PackedCoordinateSequence elevPCS, boolean computed);
    public abstract ElevationProfileSegment getElevationProfileSegment();
    public abstract boolean isElevationFlattened();
}
