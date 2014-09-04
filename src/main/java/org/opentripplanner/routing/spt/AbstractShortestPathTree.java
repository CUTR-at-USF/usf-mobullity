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

package org.opentripplanner.routing.spt;

import java.util.Collections;
import java.util.LinkedList;
import java.util.List;

import org.opentripplanner.routing.core.State;
import org.opentripplanner.routing.core.RoutingRequest;
import org.opentripplanner.routing.graph.Vertex;

/**
 * Common base class for common {@link ShortestPathTree} functionality.
 * 
 * @author bdferris
 */
public abstract class AbstractShortestPathTree implements ShortestPathTree {

    public final RoutingRequest options;
    
    protected AbstractShortestPathTree () {
        this.options = null;
    }

    protected AbstractShortestPathTree (RoutingRequest options) {
        this.options = options;
    }
    
    @Override
    public List<GraphPath> getPaths() {
        return getPaths(options.getRoutingContext().target, true);
    }
    
    @Override
    public List<GraphPath> getPaths(Vertex dest, boolean optimize) {
        List<? extends State> stateList = getStates(dest);
        if (stateList == null)
            return Collections.emptyList();
        List<GraphPath> ret = new LinkedList<GraphPath>();
        for (State s : stateList) {
            if (s.isFinal() && s.allPathParsersAccept())
                ret.add(new GraphPath(s, optimize));
        }
        return ret;
    }

    @Override
    public GraphPath getPath(Vertex dest, boolean optimize) {
        State s = getState(dest);
        if (s == null)
            return null;
        else
            return new GraphPath(s, optimize);
    }

    @Override
    public void postVisit(State u) {
    }
    
    @Override
    public RoutingRequest getOptions() {
        return options;
    }

}
