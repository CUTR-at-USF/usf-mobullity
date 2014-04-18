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

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.prefs.Preferences;

import lombok.Getter;

import org.opentripplanner.updater.PreferencesConfigurable;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.util.HttpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.transit.realtime.GtfsRealtime.FeedEntity;
import com.google.transit.realtime.GtfsRealtime.FeedMessage;
import com.google.transit.realtime.GtfsRealtime.VehiclePosition;

public class GtfsRealtimeHttpTripUpdateSource implements VehiclePositionSource, PreferencesConfigurable {
    private static final Logger LOG =
            LoggerFactory.getLogger(GtfsRealtimeHttpTripUpdateSource.class);

    /**
     * Default agency id that is used for the trip ids in the TripUpdates
     */
    @Getter
    private String agencyId;

    private String url;

    @Override
    public void configure(Graph graph, Preferences preferences) throws Exception {
        String url = preferences.get("url", null);
        if (url == null) {
            throw new IllegalArgumentException("Missing mandatory 'url' parameter");
        }
        this.url = url;
        this.agencyId = preferences.get("defaultAgencyId", null);
    }

    @Override
    public List<VehiclePosition> getUpdates() {
        FeedMessage feedMessage = null;
        List<FeedEntity> feedEntityList = null;
        List<VehiclePosition> updates = null;
        try {
            InputStream is = HttpUtils.getData(url);
            if (is != null) {
                feedMessage = FeedMessage.PARSER.parseFrom(is);
                feedEntityList = feedMessage.getEntityList();
                updates = new ArrayList<VehiclePosition>(feedEntityList.size());
                for (FeedEntity feedEntity : feedEntityList) {
                    updates.add(feedEntity.getVehicle());
                    String id = feedEntity.getId();
                    LOG.info("Added vehicle id {} to Vehicle list", id);
                }
            }
            else { LOG.warn("input stream is null");}
        } catch (Exception e) {
            LOG.warn("Failed to parse gtfs-rt feed from " + url + ":", e);
        }
        return updates;
    }

    public String toString() {
        return "GtfsRealtimeHttpUpdateStreamer(" + url + ")";
    }
}
