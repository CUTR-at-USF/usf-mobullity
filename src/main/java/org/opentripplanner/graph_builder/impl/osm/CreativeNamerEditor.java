/* This program is free software: you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public License
 as published by the Free Software Foundation, either version 3 of
 the License, or (props, at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>. */

package org.opentripplanner.graph_builder.impl.osm;

import java.beans.PropertyEditorSupport;

public class CreativeNamerEditor extends PropertyEditorSupport {
    private CreativeNamer value;

    public void setAsText(String pattern) {
        value = new CreativeNamer(pattern);
    }

    public String getAsText() {
        return value.getCreativeNamePattern();
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object object) {
        value = (CreativeNamer) object;
    }
}
