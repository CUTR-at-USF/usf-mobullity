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

package org.opentripplanner.openstreetmap.impl;

import java.util.Arrays;

import org.opentripplanner.openstreetmap.services.RegionsSource;

import com.vividsolutions.jts.geom.Envelope;

/**
 * A rectangular region with fixed latitude/longitude boundaries
 *
 */
public class FixedRegionSourceImpl implements RegionsSource {

    private double latFrom;

    private double lonFrom;

    private double latTo;

    private double lonTo;

    public void setLatFrom(double latFrom) {
        this.latFrom = latFrom;
    }

    public void setLonFrom(double lonFrom) {
        this.lonFrom = lonFrom;
    }

    public void setLatTo(double latTo) {
        this.latTo = latTo;
    }

    public void setLonTo(double lonTo) {
        this.lonTo = lonTo;
    }

    @Override
    public Iterable<Envelope> getRegions() {
        Envelope region = new Envelope(lonFrom, lonTo, latFrom, latTo);
        return Arrays.asList(region);
    }
}
