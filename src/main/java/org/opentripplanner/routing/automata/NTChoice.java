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

package org.opentripplanner.routing.automata;

import java.util.Collection;
import java.util.LinkedList;

public class NTChoice extends Nonterminal {

    private Nonterminal[] nts;

    public NTChoice(Nonterminal... nts) {
        this.nts = nts.clone(); // in case caller modifies the array later
    }

    @Override
    public AutomatonState build(AutomatonState in) {
        Collection<AutomatonState> outs = new LinkedList<AutomatonState>();
        for (Nonterminal nt : nts) {
            outs.add(nt.build(in));
        }
        AutomatonState out = new AutomatonState();
        for (AutomatonState subExit : outs) {
            subExit.epsilonTransitions.add(out);
        }
        return out;
    }

}
