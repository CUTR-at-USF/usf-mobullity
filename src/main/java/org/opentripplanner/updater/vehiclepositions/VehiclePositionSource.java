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

package org.opentripplanner.updater.vehiclepositions;

import java.util.List;

import com.google.transit.realtime.GtfsRealtime.VehiclePosition;

public interface VehiclePositionSource {
    /**
     * Wait for one message to arrive, and decode it into a List of VehiclePositions. Blocking call.
     * @return a List<VehiclePosition> potentially containing VehiclePositions for several different vehicles,
     *         or null if an exception occurred while processing the message
     */
    public List<VehiclePosition> getUpdates();

    public String getAgencyId();
}
