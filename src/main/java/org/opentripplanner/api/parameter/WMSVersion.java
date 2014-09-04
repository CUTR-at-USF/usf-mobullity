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

package org.opentripplanner.api.parameter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

public class WMSVersion extends ArrayList<Integer> {

    private static final long serialVersionUID = 20120130L; // YYYYMMDD

    public static final List<WMSVersion> supported = Arrays.asList(
                    new WMSVersion(1, 0, 0),
                    new WMSVersion(1, 1, 0),
                    new WMSVersion(1, 1, 1),
                    new WMSVersion(1, 3, 0));
    
    public WMSVersion (String s) {
        super();
        try {
            for (String v : s.split("\\.", 3)) {
                this.add(Integer.parseInt(v));
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new WebApplicationException(Response
                    .status(Status.BAD_REQUEST)
                    .entity("error parsing WMS version: " + e.getMessage())
                    .build());
        }
        if (! supported.contains(this)) {
            throw new WebApplicationException(Response
                    .status(Status.BAD_REQUEST)
                    .entity("WMS version unsupported: " + s)
                    .build());
        }
    }

    private WMSVersion(Integer... ver) {
        for (Integer i : ver)
            this.add(i);
    }
    
}
