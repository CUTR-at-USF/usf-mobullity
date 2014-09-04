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

import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;

import org.opentripplanner.common.MavenVersion;
import org.opentripplanner.routing.core.State;
import org.opentripplanner.routing.core.RoutingRequest;
import org.opentripplanner.routing.edgetype.PlainStreetEdge;
import org.opentripplanner.routing.graph.Edge;
import org.opentripplanner.routing.graph.Vertex;

/**
 * A ShortestPathTree implementation that corresponds to a basic Dijkstra search, where there is a
 * single optimal state per vertex. It maintains a closed vertex list since decrease-key operations
 * are not guaranteed to be supported by the priority queue.
 * 
 * @author andrewbyrd
 */
public class BasicShortestPathTree extends AbstractShortestPathTree {
    
    private static final long serialVersionUID = MavenVersion.VERSION.getUID();
    
    public static final class FactoryImpl implements ShortestPathTreeFactory {
        @Override
        public ShortestPathTree create(RoutingRequest options) {
            return new BasicShortestPathTree(options);
        }
    }
    
    private static final int DEFAULT_CAPACITY = 500;

    Map<Vertex, State> states;

    /**
     * Parameterless constructor that uses a default capacity for internal vertex-keyed data
     * structures.
     */
    public BasicShortestPathTree(RoutingRequest options) {
        this(options, DEFAULT_CAPACITY);
    }

    /**
     * Constructor with a parameter indicating the initial capacity of the data structures holding
     * vertices. This can help avoid resizing and rehashing these objects during path searches.
     * 
     * @param n
     *            - the initial size of vertex-keyed maps
     */
    public BasicShortestPathTree(RoutingRequest options, int n) {
        super(options);
        states = new IdentityHashMap<Vertex, State>(n);
    }

    @Override
    public Collection<State> getAllStates() {
        return states.values();
    }

    /****
     * {@link ShortestPathTree} Interface
     ****/

    @Override
    public boolean add(State state) {
        Vertex here = state.getVertex();
        State existing = states.get(here);
        if (existing == null || state.betterThan(existing)) {
            states.put(here, state);
            return true;
        } else {
            final Edge backEdge = existing.getBackEdge();
            if (backEdge instanceof PlainStreetEdge) {
                PlainStreetEdge pseBack = (PlainStreetEdge) backEdge;
                if (pseBack.hasExplicitTurnRestrictions()) {
                    // If the previous back edge had turn restrictions, we need to continue
                    // the search because the previous path may be prevented by from reaching the end by turn restrictions.
                    return true;
                }
            }

            return false;
        }
    }

    @Override
    public List<State> getStates(Vertex dest) {
        State s = states.get(dest);
        if (s == null)
            return Collections.emptyList();
        else
            return Arrays.asList(s); // single-element array-backed list
    }

    @Override
    public State getState(Vertex dest) {
        return states.get(dest);
    }

    @Override
    public boolean visit(State s) {
        final State existing = states.get(s.getVertex());
        final Edge backEdge = existing.getBackEdge();
        if (backEdge instanceof PlainStreetEdge) {
            PlainStreetEdge pseBack = (PlainStreetEdge) backEdge;
            if (pseBack.hasExplicitTurnRestrictions()) {
                // If the previous back edge had turn restrictions, we need to continue
                // the search because the previous path may be prevented by from reaching the end by turn restrictions.
                return true;
            }
        }
        return (s == existing);
    }

    @Override
    public int getVertexCount() {
        return states.size();
    }

}
