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

package org.opentripplanner.graph_builder.services;

import java.util.HashMap;
import java.util.List;

import org.opentripplanner.routing.graph.Graph;

public interface GraphBuilder {
    public void buildGraph(Graph graph, HashMap<Class<?>, Object> extra);
    /** An set of ids which identifies what stages this graph builder provides (i.e. streets, elevation, transit) */
    public List<String> provides();
    /** A list of ids of stages which must be provided before this stage */
    public List<String> getPrerequisites();
    
    /** Check that all inputs to the graphbuilder are valid; throw an exception if not */
    public void checkInputs();
}
