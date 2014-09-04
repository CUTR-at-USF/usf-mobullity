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

package org.opentripplanner.graph_builder.impl.ned;

import java.io.File;
import java.io.IOException;

import org.geotools.coverage.grid.GridCoverage2D;
import org.geotools.gce.geotiff.GeoTiffFormat;
import org.geotools.gce.geotiff.GeoTiffReader;
import org.opentripplanner.graph_builder.services.ned.ElevationGridCoverageFactory;
import org.opentripplanner.routing.graph.Graph;

/**
 * Implementation of ElevationGridCoverageFactory for Geotiff data.
 */
public class GeotiffGridCoverageFactoryImpl implements ElevationGridCoverageFactory {

    private File path = null;
    private GridCoverage2D coverage;

    public GeotiffGridCoverageFactoryImpl() {

    }

    public GeotiffGridCoverageFactoryImpl(File path) {
        this.path = path;
    }

    public void setPath(File path) {
        this.path = path;
    }

    @Override
    public GridCoverage2D getGridCoverage() {
        GeoTiffFormat format = new GeoTiffFormat();
        GeoTiffReader reader = null;

        try {
            if (path == null) {
                throw new RuntimeException("Path not set");
            }
            reader = format.getReader(path);
            coverage = reader.read(null);
        } catch (IOException e) {
            throw new RuntimeException("Error getting coverage automatically. ", e);
        }

        return coverage;
    }

    @Override
    public void checkInputs() {
        if (!path.canRead()) {
            throw new RuntimeException("Can't read elevation path: " + path);
        }
    }

    @Override
    public void setGraph(Graph graph) {
        //nothing to do here
    }

}