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

package org.opentripplanner.routing.graph;

import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;

import javax.xml.bind.annotation.XmlTransient;

import lombok.Getter;

import org.onebusaway.gtfs.model.Trip;
import org.opentripplanner.common.MavenVersion;
import org.opentripplanner.routing.core.RoutingRequest;
import org.opentripplanner.routing.core.State;
import org.opentripplanner.routing.edgetype.PlainStreetEdge;
import org.opentripplanner.routing.util.IncrementingIdGenerator;
import org.opentripplanner.routing.util.UniqueIdGenerator;

import com.vividsolutions.jts.geom.LineString;

/**
 * This is the standard implementation of an edge with fixed from and to Vertex instances; all standard OTP edges are subclasses of this.
 */
public abstract class Edge implements Serializable {

    private static final long serialVersionUID = MavenVersion.VERSION.getUID();

    /**
     * Generates globally unique edge IDs.
     */
    private static final UniqueIdGenerator<Edge> idGenerator = new IncrementingIdGenerator<Edge>();

    /**
     * Identifier of the edge. Negative means not set.
     */
    @Getter
    private int id;

    protected Vertex fromv;

    protected Vertex tov;

    protected Edge(Vertex v1, Vertex v2) {
        if (v1 == null || v2 == null) {
            String err = String.format("%s constructed with null vertex : %s %s", this.getClass(),
                    v1, v2);
            throw new IllegalStateException(err);
        }

        this.fromv = v1;
        this.tov = v2;
        this.id = idGenerator.getId(this);

        // if (! vertexTypesValid()) {
        // throw new IllegalStateException(this.getClass() +
        // " constructed with bad vertex types");
        // }

        fromv.addOutgoing(this);
        tov.addIncoming(this);
    }

    public Vertex getFromVertex() {
        return fromv;
    }

    public Vertex getToVertex() {
        return tov;
    }
    
    /**
     * Returns true if this edge is partial - overriden by subclasses.
     */
    public boolean isPartial() {
        return false;
    }
    
    /**
     * Checks equivalency to another edge. Default implementation is trivial equality, but subclasses may want to do something more tricky.
     */
    public boolean isEquivalentTo(Edge e) {
        return this == e;
    }
    
    /**
     * Returns true if this edge is the reverse of another.
     */
    public boolean isReverseOf(Edge e) {
        return (this.getFromVertex() == e.getToVertex() &&
                this.getToVertex() == e.getFromVertex());
    }
    
    public void attachFrom(Vertex fromv) {
        detachFrom();
        if (fromv == null)
            throw new IllegalStateException("attaching to fromv null");
        this.fromv = fromv;
        fromv.addOutgoing(this);
    }

    public void attachTo(Vertex tov) {
        detachTo();
        if (tov == null)
            throw new IllegalStateException("attaching to tov null");
        this.tov = tov;
        tov.addIncoming(this);
    }

    /** Attach this edge to new endpoint vertices, keeping edgelists coherent */
    public void attach(Vertex fromv, Vertex tov) {
        attachFrom(fromv);
        attachTo(tov);
    }

    /**
     * Get a direction on paths where it matters, or null
     * 
     * @return
     */
    public String getDirection() {
        return null;
    }

    protected boolean detachFrom() {
        boolean detached = false;
        if (fromv != null) {
            detached = fromv.removeOutgoing(this);
            fromv = null;
        }
        return detached;
    }

    protected boolean detachTo() {
        boolean detached = false;
        if (tov != null) {
            detached = tov.removeIncoming(this);
            tov = null;
        }
        return detached;
    }

    /**
     * Disconnect this edge from its endpoint vertices, keeping edgelists coherent
     * 
     * @return
     */
    public int detach() {
        int nDetached = 0;
        if (detachFrom()) {
            ++nDetached;
        }
        if (detachTo()) {
            ++nDetached;
        }
        return nDetached;
    }

    /**
     * This should only be called inside State; other methods should call {@link org.opentripplanner.routing.core.State.getBackTrip()}.
     * 
     * @author mattwigway
     */
    public Trip getTrip() {
        return null;
    }

    // Notes are now handled by State

    @Override
    public int hashCode() {
        return fromv.hashCode() * 31 + tov.hashCode();
    }

    /**
     * Edges are not roundabouts by default.
     */
    public boolean isRoundabout() {
        return false;
    }

    /**
     * Traverse this edge.
     * 
     * @param s0 The State coming into the edge.
     * @return The State upon exiting the edge.
     */
    public abstract State traverse(State s0);

    public State optimisticTraverse(State s0) {
        return this.traverse(s0);
    }

    /**
     * Returns a lower bound on edge weight given the routing options.
     * 
     * @param options
     * @return edge weight as a double.
     */
    public double weightLowerBound(RoutingRequest options) {
        // Edge weights are non-negative. Zero is an admissible default lower
        // bound.
        return 0;
    }

    /**
     * Returns a lower bound on traversal time given the routing options.
     * 
     * @param options
     * @return edge weight as a double.
     */
    public double timeLowerBound(RoutingRequest options) {
        // No edge should take less than zero time to traverse.
        return 0;
    }

    public abstract String getName();

    public boolean hasBogusName() {
        return false;
    }

    public String toString() {
        if (id >= 0) {
            return String.format("%s:%s (%s -> %s)", getClass().getName(), id, fromv, tov);
        }
        return String.format("%s (%s -> %s)", getClass().getName(), fromv, tov);
    }

    // The next few functions used to live in EdgeNarrative, which has now been
    // removed
    // @author mattwigway

    public LineString getGeometry() {
        return null;
    }

    /**
     * Returns the azimuth of this edge from head to tail.
     * 
     * @return
     */
    public double getAzimuth() {
        // TODO(flamholz): cache?
        return getFromVertex().azimuthTo(getToVertex());
    }

    public double getDistance() {
        return 0;
    }

    /* SERIALIZATION */

    private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {
        in.defaultReadObject();
        // edge lists are transient, reconstruct them
        fromv.addOutgoing(this);
        tov.addIncoming(this);
    }

    private void writeObject(ObjectOutputStream out) throws IOException, ClassNotFoundException {
        if (fromv == null) {
            if (this instanceof PlainStreetEdge)
                System.out.println(((PlainStreetEdge) this).getGeometry());
            System.out.printf("fromv null %s \n", this);
        }
        if (tov == null) {
            if (this instanceof PlainStreetEdge)
                System.out.println(((PlainStreetEdge) this).getGeometry());
            System.out.printf("tov null %s \n", this);
        }
        out.defaultWriteObject();
    }

    /* GRAPH COHERENCY AND TYPE CHECKING */

    @SuppressWarnings("unchecked")
    private static final ValidVertexTypes VALID_VERTEX_TYPES = new ValidVertexTypes(Vertex.class,
            Vertex.class);

    @XmlTransient
    public ValidVertexTypes getValidVertexTypes() {
        return VALID_VERTEX_TYPES;
    }

    /*
     * This may not be necessary if edge constructor types are strictly specified
     */
    public final boolean vertexTypesValid() {
        return getValidVertexTypes().isValid(fromv, tov);
    }

    public static final class ValidVertexTypes {
        private final Class<? extends Vertex>[] classes;

        // varargs constructor:
        // a loophole in the law against arrays/collections of parameterized
        // generics
        public ValidVertexTypes(Class<? extends Vertex>... classes) {
            if (classes.length % 2 != 0) {
                throw new IllegalStateException("from/to/from/to...");
            } else {
                this.classes = classes;
            }
        }

        public boolean isValid(Vertex from, Vertex to) {
            for (int i = 0; i < classes.length; i += 2) {
                if (classes[i].isInstance(from) && classes[i + 1].isInstance(to))
                    return true;
            }
            return false;
        }
    }

}
