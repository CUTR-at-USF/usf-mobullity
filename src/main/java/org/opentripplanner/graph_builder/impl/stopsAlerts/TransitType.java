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

package org.opentripplanner.graph_builder.impl.stopsAlerts;

import lombok.Setter;
import org.opentripplanner.routing.core.TraverseMode;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.routing.vertextype.TransitStop;

import java.util.Set;

public class TransitType extends AbstractStopTester {

    @Setter
    TraverseMode transitType;


    /**
     * @retrun return true if a transit type of type transitType is pass through that stop
     */
    @Override
    public boolean fulfillDemands(TransitStop ts, Graph graph) {
        if (ts.getModes().contains(transitType))
            return true;
        return false;
    }
}
