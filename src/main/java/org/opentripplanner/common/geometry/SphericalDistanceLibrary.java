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

package org.opentripplanner.common.geometry;

import static org.apache.commons.math3.util.FastMath.abs;
import static org.apache.commons.math3.util.FastMath.atan2;
import static org.apache.commons.math3.util.FastMath.cos;
import static org.apache.commons.math3.util.FastMath.sin;
import static org.apache.commons.math3.util.FastMath.sqrt;
import static org.apache.commons.math3.util.FastMath.toDegrees;
import static org.apache.commons.math3.util.FastMath.toRadians;

import org.apache.commons.math3.util.FastMath;

import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Envelope;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.Point;

public class SphericalDistanceLibrary implements DistanceLibrary {

    private static final DistanceLibrary instance = new SphericalDistanceLibrary();
    
    public static final double RADIUS_OF_EARTH_IN_KM = 6371.01;
    public static final double RADIUS_OF_EARTH_IN_M = RADIUS_OF_EARTH_IN_KM * 1000;
    
    // Max admissible lat/lon delta for approximated distance computation
    public static final double MAX_LAT_DELTA_DEG = 4.0;
    public static final double MAX_LON_DELTA_DEG = 4.0;
    // 1 / Max over-estimation error of approximated distance, 
    // for delta lat/lon in given range
    public static final double MAX_ERR_INV = 0.999462;  

    /* (non-Javadoc)
     * @see org.opentripplanner.common.geometry.DistanceLibrary#distance(com.vividsolutions.jts.geom.Coordinate, com.vividsolutions.jts.geom.Coordinate)
     */
    @Override
    public final double distance(Coordinate from, Coordinate to) {
        return distance(from.y, from.x, to.y, to.x);
    }

    /* (non-Javadoc)
     * @see org.opentripplanner.common.geometry.DistanceLibrary#fastDistance(com.vividsolutions.jts.geom.Coordinate, com.vividsolutions.jts.geom.Coordinate)
     */
    @Override
    public final double fastDistance(Coordinate from, Coordinate to) {
        return fastDistance(from.y, from.x, to.y, to.x);
    }

    @Override
    public final double fastDistance(Coordinate from, Coordinate to, double cosLat) {
        double dLat = toRadians(from.y - to.y);
        double dLon = toRadians(from.x - to.x) * cosLat;
        return RADIUS_OF_EARTH_IN_M * sqrt(dLat * dLat + dLon * dLon);
    }

    @Override
    public final double fastDistance(Coordinate point, LineString lineString) {
        // Transform in equirectangular projection on sphere of radius 1,
        // centered at point
        double lat = Math.toRadians(point.y);
        double cosLat = FastMath.cos(lat);
        double lon = Math.toRadians(point.x) * cosLat;
        Point point2 = GeometryUtils.getGeometryFactory().createPoint(new Coordinate(lon, lat));
        LineString lineString2 = equirectangularProject(lineString, cosLat);
        return lineString2.distance(point2) * RADIUS_OF_EARTH_IN_M;
    }

    @Override
    public final double fastLength(LineString lineString) {
        // Warn: do not use LineString.getCentroid() as it is broken
        // for degenerated geometry (same first/last point).
        Coordinate[] coordinates = lineString.getCoordinates();
        double middleY = (coordinates[0].y + coordinates[coordinates.length - 1].y) / 2.0;
        double cosLat = FastMath.cos(Math.toRadians(middleY));
        return equirectangularProject(lineString, cosLat).getLength() * RADIUS_OF_EARTH_IN_M;
    }
    
    @Override
    public final double fastLength(LineString lineString, double cosLat) {
        return equirectangularProject(lineString, cosLat).getLength() * RADIUS_OF_EARTH_IN_M;
    }

    /**
     * Equirectangular project a polyline.
     * @param lineString
     * @param cosLat cos(lat) of the projection center point.
     * @return The projected polyline. Coordinates in radians.
     */
    private LineString equirectangularProject(LineString lineString, double cosLat) {
        Coordinate[] coords = lineString.getCoordinates();
        Coordinate[] coords2 = new Coordinate[coords.length];
        for (int i = 0; i < coords.length; i++) {
            coords2[i] = new Coordinate(Math.toRadians(coords[i].x) * cosLat,
                    Math.toRadians(coords[i].y));
        }
        return GeometryUtils.getGeometryFactory().createLineString(coords2);
    }
    
    /**
     * @see org.opentripplanner.common.geometry.DistanceLibrary#distance(double, double, double, double)
     */
    @Override
    public final double distance(double lat1, double lon1, double lat2, double lon2) {
        return distance(lat1, lon1, lat2, lon2, RADIUS_OF_EARTH_IN_M);
    }
    
    /**
     * @see org.opentripplanner.common.geometry.DistanceLibrary#fastDistance(double, double, double, double)
     */
    @Override
    public final double fastDistance(double lat1, double lon1, double lat2, double lon2) {
        return fastDistance(lat1, lon1, lat2, lon2, RADIUS_OF_EARTH_IN_M);
    }
    
    /**
     * @see org.opentripplanner.common.geometry.DistanceLibrary#distance(double, double, double, double, double)
     */
    @Override
    public final double distance(double lat1, double lon1, double lat2, double lon2,
            double radius) {
        // http://en.wikipedia.org/wiki/Great-circle_distance
        lat1 = toRadians(lat1); // Theta-s
        lon1 = toRadians(lon1); // Lambda-s
        lat2 = toRadians(lat2); // Theta-f
        lon2 = toRadians(lon2); // Lambda-f

        double deltaLon = lon2 - lon1;

        double y = sqrt(p2(cos(lat2) * sin(deltaLon))
                + p2(cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(deltaLon)));
        double x = sin(lat1) * sin(lat2) + cos(lat1) * cos(lat2) * cos(deltaLon);

        return radius * atan2(y, x);        
    }
    

    /**
     * Approximated, fast and under-estimated equirectangular distance between two points.
     * Works only for small delta lat/lon, fall-back on exact distance if not the case.
     * See: http://www.movable-type.co.uk/scripts/latlong.html
     */
    public final double fastDistance(double lat1, double lon1, double lat2, double lon2,
            double radius) {
    	if (abs(lat1 - lat2) > MAX_LAT_DELTA_DEG
    			|| abs(lon1 - lon2) > MAX_LON_DELTA_DEG)
    		return distance(lat1, lon1, lat2, lon2, radius);

    	double dLat = toRadians(lat2 - lat1);
        double dLon = toRadians(lon2 - lon1) * cos(toRadians((lat1 + lat2) / 2));
        return radius * sqrt(dLat * dLat + dLon * dLon) * MAX_ERR_INV;
    }

    private final double p2(double a) {
        return a * a;
    }

    /** this is an overestimate */
    public static double metersToDegrees(double distance) {
        return 360 * distance / (2 * Math.PI * RADIUS_OF_EARTH_IN_M);
    }

    public final Envelope bounds(double lat, double lon, double latDistance,
            double lonDistance) {

        double radiusOfEarth = RADIUS_OF_EARTH_IN_M;

        double latRadians = toRadians(lat);
        double lonRadians = toRadians(lon);

        double latRadius = radiusOfEarth;
        double lonRadius = cos(latRadians) * radiusOfEarth;

        double latOffset = latDistance / latRadius;
        double lonOffset = lonDistance / lonRadius;

        double latFrom = toDegrees(latRadians - latOffset);
        double latTo = toDegrees(latRadians + latOffset);

        double lonFrom = toDegrees(lonRadians - lonOffset);
        double lonTo = toDegrees(lonRadians + lonOffset);

        return new Envelope(new Coordinate(lonFrom, latFrom), new Coordinate(lonTo, latTo));
    }
    
    public static DistanceLibrary getInstance() {
        return instance;
    }
}
