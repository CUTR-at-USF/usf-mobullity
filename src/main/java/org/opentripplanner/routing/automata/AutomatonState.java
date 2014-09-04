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

import java.util.ArrayList;
import java.util.List;

public class AutomatonState {

    /** Signals that no transition was found for a given input symbol. The input is rejected. */
    public static final int REJECT = Integer.MIN_VALUE;

    /**
     * Could be used to provide a single accept state, using transitions on a special terminal from
     * all other accept states.
     */
    public static final int ACCEPT = Integer.MAX_VALUE;

    /** The states in a DFA should be ordered such that the start state is always 0. */
    public static final int START = 0;

    public String label;

    public final List<Transition> transitions = new ArrayList<Transition>();

    /** A list of the states that can be reached from this state without consuming a terminal. */
    public final List<AutomatonState> epsilonTransitions = new ArrayList<AutomatonState>();

    public AutomatonState() {
        this.label = null; // indicating it should be automatically filled in
    }

    public AutomatonState(String label) {
        this.label = label;
    }

    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("AutomatonState ");
        sb.append(label);
        sb.append(" transitions ");
        for (Transition transition : this.transitions) {
            sb.append(transition.terminal);
            sb.append("-");
            sb.append(transition.target.label);
            sb.append(" ");
        }
        sb.append(" epsilon moves {");
        for (AutomatonState as : this.epsilonTransitions) {
            sb.append(as.label);
            sb.append(" ");
        }
        sb.append("}");
        return sb.toString();
    }

}
