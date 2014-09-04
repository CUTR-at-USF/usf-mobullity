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

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.beust.jcommander.internal.Lists;
import com.vividsolutions.jts.geom.Coordinate;

/**
 * A spatial index using a 2D hashtable that wraps around at the edges.
 * Mapping geographic space to a region near the origin using the modulo operator
 * preserves proximity allowing 100 percent recall (no false dismissals) in linear time, 
 * at the cost of false positives (hash collisions) which are filtered out of query results.
 * 
 * 2d objects are handled by 'conservatively' rasterizing them into grid cells.
 * It would also be possible to use a hierarchical grid.
 * 
 * For more background see:
 * Schornbaum, Florian. Hierarchical Hash Grids for Coarse Collision Detection (2009)
 * 
 * @author andrewbyrd
 *
 * @param <T> The type of objects to be stored in the HashGrid. Must implement the Pointlike
 * interface.
 */
public class HashGrid <T> {

    private static final Logger LOG = LoggerFactory.getLogger(HashGrid.class);

    /* Defaults: 200m x 50 bins = 10km square. */
    private static final double DEFAULT_BIN_SIZE = 200; // meters
    private static final int DEFAULT_BINS = 50;
    
    private double projectionMeridian = -120.0;
    private final double binSizeMeters;
    private final int nBinsX, nBinsY;
    private final List<T>[][] bins;
    private int nBins = 0;
    private int nEntries = 0;
    private DistanceLibrary distanceLibrary = SphericalDistanceLibrary.getInstance();
    
    @SuppressWarnings("unchecked")
    public HashGrid (double binSizeMeters, int xBins, int yBins) {
        if (binSizeMeters < 0)
            throw new IllegalStateException("bin size must be positive.");
        this.binSizeMeters = binSizeMeters;
        this.nBinsX = xBins;
        this.nBinsY = yBins;
        bins = (List<T>[][]) new List[xBins][yBins];
    }

    /**Create a HashGrid with the default bin size and dimensions. */
    public HashGrid () {
        this (DEFAULT_BIN_SIZE, DEFAULT_BINS, DEFAULT_BINS);
    }
    
    public void setProjectionMeridian (double longitude) {
        if (nEntries > 0) {
            String message = "Setting projection meridian on a HashGrid already containing objects.";
            LOG.error(message);
            throw new RuntimeException(message);
        }
        projectionMeridian = longitude;
    }
    
    public void put(Coordinate c, T t) {
        bin(c).add(t);
        nEntries +=1;
    }

    private List<T> bin(Coordinate c) {
        int xBin = xBin(c); 
        int yBin = yBin(c);
        return bin(xBin, yBin);
    }
    
    private List<T> bin(int xBin, int yBin) {
        List<T> bin = bins[xBin][yBin];
        if (bin == null) {
            bin = new ArrayList<T>();
            bins[xBin][yBin] = bin; 
            nBins += 1;
        }
        return bin;
    }

    // maybe accumulate objects and then build()
    
    // add Result and Result#Iterator classes
    
    /*
    // TODO pull class out to library client 
    public static class RasterizedSegment extends LineSegment {
        public final Object payload;
        public final double distAlongLinestring;
        RasterizedSegment(Coordinate c0, Coordinate c1, double d, Object t) {
            super(c0, c1);
            distAlongLinestring = d;
            payload = t;
        }
    }
    
    // TODO pull method out to library client
    public void rasterize(LineString ls, T t) {
        Coordinate [] coords = ls.getCoordinates();
        double dist = 0;
        for (int i = 0; i < coords.length - 1; i++) {
            Coordinate c0 = coords[i];
            Coordinate c1 = coords[i+1];
            RasterizedSegment rs = new RasterizedSegment(c0, c1, dist, t);
            rasterize(c0, c1, rs);
            dist += distanceLibrary.fastDistance(coords[i], coords[i+1]);
        }
    }
     */
    
    /** Place the object t into all bins falling on the line between the two coordinates a and b. */
    public int rasterize(Coordinate a, Coordinate b, T t) {
        int n = 0;
        Coordinate c0, c1;
        // we will work in direction of increasing x
        if (a.x <= b.x) {
            c0 = a;
            c1 = b;
        } else {
            c0 = b;
            c1 = a;
        }
        double x0, y0, x1, y1;
        x0 = projLon(c0.x, c0.y);
        y0 = projLat(c0.y);
        x1 = projLon(c1.x, c1.y);
        y1 = projLat(c1.y);
        // get slope of line segment to rasterize
        double slope = (y1 - y0) / (x1 - x0);
        boolean negSlope = slope < 0;
        // reference point is left edge of the initial bin
        double xStartBinFloor = Math.floor(x0 / binSizeMeters) * binSizeMeters;
        double yStartBinFloor = Math.floor(y0 / binSizeMeters) * binSizeMeters;
        if (negSlope)
            yStartBinFloor += binSizeMeters;
        double yBinFloor = yStartBinFloor;
        double x = x0;
        double y = y0;
        // step forward bin by bin
        int xSteps = 0, ySteps = 0;
        int xBin = xBin(c0);
        int yBin = yBin(c0);
        boolean done = false;
        while ( ! done) {
            xSteps += 1;
            // place x marker at right edge of the current bin column
            x = xStartBinFloor + xSteps * binSizeMeters;
            // check for final iteration
            if (x >= x1) {
                x = x1;
                y = y1; // set y (undefined slope in vertical case)
                done = true;
            } else {
                // find y value at current x (usually the right edge of the bin)
                y = (x-x0) * slope + y0;
            }
            // if new y is in a different bin row, advance to that bin row
            if (negSlope) {
                while (yBinFloor - binSizeMeters > y) {
                    bin(xBin, yBin).add(t);
                    ySteps += 1;
                    yBinFloor = yStartBinFloor - ySteps * binSizeMeters;
                    // advance down to next row of bins
                    yBin = yWrap(yBin - 1);
                }
            } else {
                while (yBinFloor + binSizeMeters < y) {
                    bin(xBin, yBin).add(t);
                    ySteps += 1;
                    yBinFloor = yStartBinFloor + ySteps * binSizeMeters;
                    // advance up to next row of bins
                    yBin = yWrap(yBin + 1);
                }
            }
            // insert object even if we did not advance to another row
            bin(xBin, yBin).add(t);
            // advance to next column of bins
            xBin = xWrap(xBin + 1);
        }
        return n;
    }
    
    private int xBin(Coordinate c) {
        double x = projLon(c.x, c.y);
        return xWrap( (int) Math.floor(x / binSizeMeters) );
    }
    
    private int yBin(Coordinate c) {
        double y = projLat(c.y);
        return yWrap( (int) Math.floor(y / binSizeMeters) );
    }

    private int xWrap(int xBin) {
        int x = xBin % nBinsX;
        if (x < 0)
            x += nBinsX;
        return x;
    }
    
    private int yWrap(int yBin) {
        int y = yBin % nBinsY;
        if (y < 0)
            y += nBinsY;
        return y;
    }
    
    public T closest(double x, double y, double radiusMeters) {
        return closest(new Coordinate(x, y), radiusMeters);
    }
        
    public T closest(Coordinate c, double radiusMeters) {
        T closestT = null;
        double closestDistance = Double.POSITIVE_INFINITY;
        int radiusBins = (int) Math.ceil(radiusMeters / binSizeMeters);
        int xBin = xBin(c);
        int yBin = yBin(c);
        int minBinX = xBin - radiusBins;
        int maxBinX = xBin + radiusBins;
        int minBinY = yBin - radiusBins;
        int maxBinY = yBin + radiusBins;
        for (int x = minBinX; x <= maxBinX; x += 1) {
            int wrappedX = xWrap(x);
            for (int y = minBinY; y <=maxBinY; y += 1) {
                int wrappedY = yWrap(y);
                List<T> bin = bins[wrappedX][wrappedY];
                if (bin != null) {
                    for (T t : bin) {
                        //if (t == p)
                        //    continue;
                        // FIXME
                        double distance = distanceLibrary.fastDistance(c, c);
                        // bins may contain distant colliding objects
                        // ideally, filter out objects without calculating distance using coords
                        if (distance > radiusMeters)
                            continue;
                        if (distance < closestDistance) {
                            closestT = t;
                            closestDistance = distance;
                        }
                    }
                }
            }
        }
        return closestT;
    }

    /**
     * Note that this method may return false positives. It is up to the caller to perform the final
     * filtering based on distance. Unfortunately we cannot filter here because type T does not
     * necessarily have a single coordinate. This also avoids calculating the distance twice or
     * creating additional wrapper objects to return the distance alongside the object.
     */
    public List<T> query (double lon, double lat, double radiusMeters) {
        Coordinate c = new Coordinate(lon, lat);
        List<T> ret = Lists.newArrayList();
        int radiusBins = (int) Math.ceil(radiusMeters / binSizeMeters);
        int xBin = xBin(c);
        int yBin = yBin(c);
        int minBinX = xBin - radiusBins;
        int maxBinX = xBin + radiusBins;
        int minBinY = yBin - radiusBins;
        int maxBinY = yBin + radiusBins;
        for (int x = minBinX; x <= maxBinX; x += 1) {
            int wrappedX = xWrap(x);
            for (int y = minBinY; y <=maxBinY; y += 1) {
                int wrappedY = yWrap(y);
                List<T> bin = bins[wrappedX][wrappedY];
                if (bin != null) {
                    ret.addAll(bin);
                }
            }
        }
        return ret;
    }

    
    static final double M_PER_DEGREE_LAT = 111111.111111;
    
    static double mPerDegreeLon(double lat) {
        return M_PER_DEGREE_LAT * Math.cos(lat * Math.PI / 180);        
    }

    private static double projLat(double lat) {
        return M_PER_DEGREE_LAT * lat; 
    }
    
    private double projLon(double lon, double lat) {
        return mPerDegreeLon(lat) * (lon - projectionMeridian);
    }

    public String toString() {
        return String.format("HashGrid %dx%d at %d meter resolution, %d/%d bins allocated", 
               nBinsX, nBinsY, (int)binSizeMeters, nBins, nBinsX*nBinsY);
    }
    
    public String toStringVerbose() {
        return String.format("HashGrid %dx%d at %d meter resolution, %d/%d bins allocated (%4.1f%%), load factor %4f, average allocated bin size %2f", 
               nBinsX, nBinsY, (int)binSizeMeters, nBins, nBinsX*nBinsY, (double)nBins/(nBinsX*nBinsY) * 100.0, 
               (double)nEntries/(nBinsX*nBinsY), (double)nEntries/nBins);
    }

    public String densityMap() {
        final int SATURATE_AT = 10;
        String[] block = new String[] {"░░", "▒▒", "▓▓", "██"};
        StringBuilder sb = new StringBuilder();
        sb.append("HashGrid:\n");
        // flip map for northern hemisphere
        for (int y=nBinsY-1; y>=0; y--) {
            for (int x=0; x<nBinsX; x++) {
                if (bins[x][y] == null) {
                    sb.append("  "); 
                } else {
                    int z = bins[x][y].size();
                    int i = z * 3 / SATURATE_AT;
                    if (i > 3)
                        i = 3;
                    sb.append(block[i]);
                }
            }    
            sb.append('\n');
        }
        return sb.toString();
    }
}
