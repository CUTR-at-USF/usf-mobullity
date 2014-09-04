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

package org.opentripplanner.api.resource;

import java.util.HashSet;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import org.opentripplanner.routing.core.TraverseMode;
import org.opentripplanner.routing.edgetype.PatternHop;
import org.opentripplanner.routing.graph.Edge;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.routing.graph.Vertex;

import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Envelope;

@XmlRootElement
public class GraphMetadata {

    /** The bounding box of the graph, in decimal degrees. */
    private double lowerLeftLatitude, lowerLeftLongitude, upperRightLatitude, upperRightLongitude;

    private HashSet<TraverseMode> transitModes = new HashSet<TraverseMode>();

    private double centerLatitude;

    private double centerLongitude;

    public GraphMetadata() {
    	// 0-arg constructor avoids com.sun.xml.bind.v2.runtime.IllegalAnnotationsException
    }

    public GraphMetadata(Graph graph) {
        /* generate extents */
        Envelope leftEnv = new Envelope();
        Envelope rightEnv = new Envelope();
        double aRightCoordinate = 0;
        for (Vertex v : graph.getVertices()) {
            for (Edge e: v.getOutgoing()) {
                if (e instanceof PatternHop) {
                    transitModes.add(((PatternHop) e).getMode());
                }
            }
            Coordinate c = v.getCoordinate();
            if (c.x < 0) {
                leftEnv.expandToInclude(c);
            } else {
                rightEnv.expandToInclude(c);
                aRightCoordinate = c.x;
            }
        }

        if (leftEnv.getArea() == 0) {
            //the entire area is in the eastern hemisphere
            setLowerLeftLongitude(rightEnv.getMinX());
            setUpperRightLongitude(rightEnv.getMaxX());
            setLowerLeftLatitude(rightEnv.getMinY());
            setUpperRightLatitude(rightEnv.getMaxY());
        } else if (rightEnv.getArea() == 0) {
            //the entire area is in the western hemisphere
            setLowerLeftLongitude(leftEnv.getMinX());
            setUpperRightLongitude(leftEnv.getMaxX());
            setLowerLeftLatitude(leftEnv.getMinY());
            setUpperRightLatitude(leftEnv.getMaxY());
        } else {
            //the area spans two hemispheres.  Either it crosses the prime meridian,
            //or it crosses the 180th meridian (roughly, the international date line).  We'll check a random
            //coordinate to find out

            if (aRightCoordinate < 90) {
                //assume prime meridian
                setLowerLeftLongitude(leftEnv.getMinX());
                setUpperRightLongitude(rightEnv.getMaxX());
            } else {
                //assume 180th meridian
                setLowerLeftLongitude(leftEnv.getMaxX());
                setUpperRightLongitude(rightEnv.getMinX());
            }
            setUpperRightLatitude(Math.max(rightEnv.getMaxY(), leftEnv.getMaxY()));
            setLowerLeftLatitude(Math.min(rightEnv.getMinY(), leftEnv.getMinY()));
        }
        // Does not work around 180th parallel.
        // Should be replaced by using k-means center code from TransitIndex, and storing the center directly in the graph.
        setCenterLatitude((upperRightLatitude + lowerLeftLatitude) / 2);
        setCenterLongitude((upperRightLongitude + lowerLeftLongitude) / 2);
    }

    public void setLowerLeftLatitude(double lowerLeftLatitude) {
        this.lowerLeftLatitude = lowerLeftLatitude;
    }

    public double getLowerLeftLatitude() {
        return lowerLeftLatitude;
    }

    public void setUpperRightLatitude(double upperRightLatitude) {
        this.upperRightLatitude = upperRightLatitude;
    }

    public double getUpperRightLatitude() {
        return upperRightLatitude;
    }

    public void setUpperRightLongitude(double upperRightLongitude) {
        this.upperRightLongitude = upperRightLongitude;
    }

    public double getUpperRightLongitude() {
        return upperRightLongitude;
    }

    public void setLowerLeftLongitude(double lowerLeftLongitude) {
        this.lowerLeftLongitude = lowerLeftLongitude;
    }

    public double getLowerLeftLongitude() {
        return lowerLeftLongitude;
    }

    /**
     * The bounding box of the graph, in decimal degrees.  These are the old, deprecated
     * names; the new names are the lowerLeft/upperRight.
     *  @deprecated
     */
    public void setMinLatitude(double minLatitude) {
        lowerLeftLatitude = minLatitude;
    }

    /**
     * The bounding box of the graph, in decimal degrees.  These are the old, deprecated
     * names; the new names are the lowerLeft/upperRight.
     *  @deprecated
     */
    public double getMinLatitude() {
        return lowerLeftLatitude;
    }

    /**
     * The bounding box of the graph, in decimal degrees.  These are the old, deprecated
     * names; the new names are the lowerLeft/upperRight.
     *  @deprecated
     */
    public void setMinLongitude(double minLongitude) {
        lowerLeftLongitude = minLongitude;
    }

    /**
     * The bounding box of the graph, in decimal degrees.  These are the old, deprecated
     * names; the new names are the lowerLeft/upperRight.
     *  @deprecated
     */
    public double getMinLongitude() {
        return lowerLeftLongitude;
    }

    /**
     * The bounding box of the graph, in decimal degrees.  These are the old, deprecated
     * names; the new names are the lowerLeft/upperRight.
     *  @deprecated
     */
    public void setMaxLatitude(double maxLatitude) {
        upperRightLatitude = maxLatitude;
    }

    /**
     * The bounding box of the graph, in decimal degrees.  These are the old, deprecated
     * names; the new names are the lowerLeft/upperRight.
     *  @deprecated
     */
    public double getMaxLatitude() {
        return upperRightLatitude;
    }

    /**
     * The bounding box of the graph, in decimal degrees.  These are the old, deprecated
     * names; the new names are the lowerLeft/upperRight.
     *  @deprecated
     */
    public void setMaxLongitude(double maxLongitude) {
        upperRightLongitude = maxLongitude;
    }

    /**
     * The bounding box of the graph, in decimal degrees.  These are the old, deprecated
     * names; the new names are the lowerLeft/upperRight.
     *  @deprecated
     */
    public double getMaxLongitude() {
        return upperRightLongitude;
    }

    @XmlElement
    public HashSet<TraverseMode> getTransitModes() {
        return transitModes;
    }

    public void setTransitModes(HashSet<TraverseMode> transitModes) {
        this.transitModes = transitModes;
    }

    public double getCenterLongitude() {
        return centerLongitude;
    }

    public void setCenterLongitude(double centerLongitude) {
        this.centerLongitude = centerLongitude;
    }

    public double getCenterLatitude() {
        return centerLatitude;
    }

    public void setCenterLatitude(double centerLatitude) {
        this.centerLatitude = centerLatitude;
    }
}
