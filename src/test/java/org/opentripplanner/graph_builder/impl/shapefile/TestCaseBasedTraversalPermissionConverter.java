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

package org.opentripplanner.graph_builder.impl.shapefile;

import org.opentripplanner.common.model.P2;
import org.opentripplanner.routing.edgetype.StreetTraversalPermission;

import junit.framework.TestCase;


public class TestCaseBasedTraversalPermissionConverter extends TestCase {
    /*
     * Test for ticket #273: ttp://opentripplanner.org/ticket/273
     */
    public void testDefaultValueForNullEntry() throws Exception {
        StubSimpleFeature feature = new StubSimpleFeature();
        feature.addAttribute("DIRECTION", null);
        
        CaseBasedTraversalPermissionConverter converter = new CaseBasedTraversalPermissionConverter();
        converter.setDefaultPermission(StreetTraversalPermission.PEDESTRIAN);
        
        converter.addPermission("FOO", StreetTraversalPermission.ALL, StreetTraversalPermission.ALL);
        
        assertEquals(new P2<StreetTraversalPermission>(StreetTraversalPermission.PEDESTRIAN, StreetTraversalPermission.PEDESTRIAN), converter.convert(feature));
    }
}
