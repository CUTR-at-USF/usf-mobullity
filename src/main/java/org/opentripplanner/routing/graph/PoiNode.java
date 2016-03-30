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

package org.opentripplanner.routing.graph;

import java.io.Serializable;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.IOException;
import java.lang.ClassNotFoundException;

import java.util.Map;

public class PoiNode implements Serializable {
        public String type; /* node or way */
        public String locations; /* list of lat,lng to accomodate way nd refs */
        public Map<String, String> tags;

        private static final long serialVersionUID = 2L;
    
        private void readObject(ObjectInputStream aInputStream) throws ClassNotFoundException, IOException {
            aInputStream.defaultReadObject();
        }

        private void writeObject(ObjectOutputStream aOutputStream) throws IOException {
            aOutputStream.defaultWriteObject();
        }

}

