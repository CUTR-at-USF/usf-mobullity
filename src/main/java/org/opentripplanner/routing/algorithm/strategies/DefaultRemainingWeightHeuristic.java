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

package org.opentripplanner.routing.algorithm.strategies;

import org.opentripplanner.common.geometry.DistanceLibrary;
import org.opentripplanner.common.geometry.SphericalDistanceLibrary;
import org.opentripplanner.routing.core.OptimizeType;
import org.opentripplanner.routing.core.State;
import org.opentripplanner.routing.core.TraverseMode;
import org.opentripplanner.routing.core.RoutingRequest;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.routing.graph.Vertex;
import org.opentripplanner.routing.vertextype.IntersectionVertex;

/**
 * A Euclidean remaining weight strategy that takes into account transit boarding costs where applicable.
 * 
 */
public class DefaultRemainingWeightHeuristic implements RemainingWeightHeuristic {

    private static final long serialVersionUID = -5172878150967231550L;

    private RoutingRequest options;

    private boolean useTransit = false;

    private double maxSpeed;

    private DistanceLibrary distanceLibrary = SphericalDistanceLibrary.getInstance();

    private TransitLocalStreetService localStreetService;

    private double targetX;

    private double targetY;

    @Override
    public void initialize(State s, Vertex target, long abortTime) {
        this.options = s.getOptions();
        this.useTransit = options.getModes().isTransit();
        this.maxSpeed = getMaxSpeed(options);

        Graph graph = options.rctx.graph;
        localStreetService = graph.getService(TransitLocalStreetService.class);

        targetX = target.getX();
        targetY = target.getY();
    }

    /**
     * On a non-transit trip, the remaining weight is simply distance / speed.
     * On a transit trip, there are two cases: 
     * (1) we're not on a transit vehicle. In this case, there are two possible ways to compute 
     *     the remaining distance, and we take whichever is smaller: 
     *     (a) walking distance / walking speed 
     *     (b) boarding cost + transit distance / transit speed (this is complicated a bit when 
     *         we know that there is some walking portion of the trip). 
     * (2) we are on a transit vehicle, in which case the remaining weight is simply transit 
     *     distance / transit speed (no need for boarding cost), again considering any mandatory 
     *     walking.
     */
    @Override
    public double computeForwardWeight(State s, Vertex target) {
        Vertex sv = s.getVertex();
        double euclideanDistance = distanceLibrary.fastDistance(sv.getY(), sv.getX(), targetY,
                targetX);
        if (useTransit) {
            double streetSpeed = options.getStreetSpeedUpperBound();
            if (euclideanDistance < target.getDistanceToNearestTransitStop()) { 
                return options.walkReluctance * euclideanDistance / streetSpeed;
            }
            // Search allows using transit, passenger is not alighted local and is not within 
            // mandatory walking distance of the target: It is possible we will reach the 
            // destination using transit. Find lower bound on cost of this hypothetical trip.
            int boardCost;
            if (s.isOnboard()) {
                // onboard: we might not need any more boardings (remember this is a lower bound).
                boardCost = 0;
            } else {
                // offboard: we know that using transit to reach the destination would require at
                // least one boarding.
                boardCost = options.getBoardCostLowerBound();
                if (s.isEverBoarded()) {
                    // the boarding would be a transfer, because we've boarded before.
                    boardCost += options.transferPenalty;
                    if (localStreetService != null) {
                        if (options.getMaxWalkDistance() - s.getWalkDistance() < euclideanDistance
                                && sv instanceof IntersectionVertex
                                && !localStreetService.transferrable(sv)) {
                            return Double.POSITIVE_INFINITY;
                        }
                    }
                }
            }
            // Find how much mandatory walking is needed to use transit from here.
            // If the passenger is onboard, the second term is zero.
            double mandatoryWalkDistance = target.getDistanceToNearestTransitStop()
                    + sv.getDistanceToNearestTransitStop();
            double transitCost = (euclideanDistance - mandatoryWalkDistance) / maxSpeed + boardCost; 
            double transitStreetCost = mandatoryWalkDistance * options.walkReluctance / streetSpeed; 
            // Compare transit use with the cost of just walking all the way to the destination, 
            // and return the lower of the two.
            return Math.min(transitCost + transitStreetCost, 
                            options.walkReluctance * euclideanDistance / streetSpeed);
        } else {
            // search disallows using transit: all travel is on-street
            return options.walkReluctance * euclideanDistance / maxSpeed;
        }
    }

    /**
     * computeForwardWeight and computeReverseWeight were identical (except that 
     * computeReverseWeight did not have the localStreetService clause). They have been merged.
     */
    @Override
    public double computeReverseWeight(State s, Vertex target) {
        return computeForwardWeight(s, target);
    }

    /** 
     * Get the maximum expected speed over all modes. This should probably be moved to
     * RoutingRequest. 
     */
    public static double getMaxSpeed(RoutingRequest options) {
        if (options.getModes().contains(TraverseMode.TRANSIT)) {
            // assume that the max average transit speed over a hop is 10 m/s, which is roughly
            // true in Portland and NYC, but *not* true on highways
            // FIXME this is extremely wrong if you include rail
            return 10;
        } else {
            if (options.optimize == OptimizeType.QUICK) {
                return options.getStreetSpeedUpperBound();
            } else {
                // assume that the best route is no more than 10 times better than
                // the as-the-crow-flies flat base route.
                // FIXME random magic constants
                return options.getStreetSpeedUpperBound() * 10;
            }
        }
    }

    @Override
    public void reset() {}

    @Override
    public void doSomeWork() {}

}
