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

package org.opentripplanner.analyst.batch;

import lombok.Data;

@Data
public class InputClampFilter implements IndividualFilter {

    public double rejectMin = 0;
    private double rejectMax = Double.MAX_VALUE;
    public double clampMin = 0;
    public double clampMax = Double.MAX_VALUE;
    
    @Override
    public boolean filter(Individual individual) {
        double input = individual.input;
        if (input < rejectMin || input > rejectMax)
            return false;
        if (input < clampMin)
            input = clampMin;
        if (input > clampMax)
            input = clampMax;
        return true;
    }

}
