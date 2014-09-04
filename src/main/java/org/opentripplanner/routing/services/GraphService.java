/* This program is free software: you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public License
 as published by the Free Software Foundation, either version 3 of
 the License, or (props, at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>. */

package org.opentripplanner.routing.services;

import java.io.InputStream;
import java.util.Collection;

import org.onebusaway.gtfs.services.calendar.CalendarService;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.routing.graph.Graph.LoadLevel;

/**
 * A GraphService maps RouterIds to Graphs.
 *
 * The service interface allows us to decouple the deserialization, loading, and management of 
 * the underlying graph objects from the classes that need access to the objects. This indirection
 * allows us to provide multiple graphs distringuished by routerIds or to dynamically swap in 
 * new graphs if underlying data changes.
 */
public interface GraphService {

    /** Specify whether additional debug information is loaded from the serialized graphs */
    public void setLoadLevel(LoadLevel level);
    
    /** @return the current default graph object */
    public Graph getGraph();

    /** @return the graph object for the given router ID */
    public Graph getGraph(String routerId);

    /** @return a collection of all valid router IDs for this server */
    public Collection<String> getRouterIds();

    /**
     * Blocking method to associate the specified router ID with the corresponding graph file on 
     * disk, load that serialized graph, and enable its use in routing.
     * The relationship between router IDs and paths in the filesystem is determined by the 
     * graphService implementation.
     * 
     * @param preEvict When true, release the existing graph (if any) before loading. This will
     * halve the amount of memory needed for the operation, but routing will be unavailable for 
     * that graph during the load process
     * .
     * @return whether the operation completed successfully 
     */
    public boolean registerGraph(String routerId, boolean preEvict);

    /** 
     * Associate the routerId with the supplied Graph object. 
     * 
     * @return whether a graph was already registered under this router ID (and was evicted).
     */
    public boolean registerGraph(String routerId, Graph graph);

    /** 
     * Reload all registered graphs from wherever they came from.
     * @param preEvict When true, release the existing graph (if any) before loading. This will
     * halve the amount of memory needed for the operation, but routing will be unavailable for 
     * that graph during the load process
     */
    public boolean reloadGraphs(boolean preEvict);

    /** 
     * Dissociate a router ID from the corresponding graph object, and disable that router ID
     * for use in routing.
     * 
     * @return whether a graph was associated with this router ID and was evicted.
     */
    public boolean evictGraph(String routerId);

    /** 
     * Dissocate all graphs from their router IDs and release references to the graphs to allow
     * garbage collection. Routing will not be possible until new graphs are registered. 
     * 
     * This is equivalent to calling evictGraph on every registered router ID.
     */
    public int evictAll();
    
    /**
     * Save the graph data, but don't load it in memory. The file location is based on the router id.
     * If the graph already exists, the graph will be overwritten. The relationship between router IDs
     * and paths in the filesystem is determined by the graphService implementation.
     * 
     * @param routerId the routerId of the graph
     * @param is graph data as input stream
     * @return
     */
    public boolean save(String routerId, InputStream is);
}
