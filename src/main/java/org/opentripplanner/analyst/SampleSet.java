package org.opentripplanner.analyst;

import org.opentripplanner.analyst.core.Sample;
import org.opentripplanner.analyst.request.SampleFactory;
import org.opentripplanner.routing.graph.Vertex;

/**
 * We never use samples in isolation, so let's store them as a column store.
 */
public class SampleSet {

    public final PointSet pset;

    /* Vertices at the two ends of a road, one per sample. */
    Vertex[] v0s;
    Vertex[] v1s;

    /* Distances to the vertices at the two ends of a road, one per sample. */
    float[] d0s;
    float[] d1s;

    public SampleSet (PointSet pset, SampleFactory sfac) {
        this.pset = pset;
        v0s = new Vertex[pset.capacity];
        v1s = new Vertex[pset.capacity];
        d0s = new float[pset.capacity];
        d1s = new float[pset.capacity];
        for (int i = 0; i < pset.capacity; i++) {
            Sample sample = sfac.getSample(pset.lons[i], pset.lats[i]);
            if (sample == null) {
                d0s[i] = Float.NaN;
                d1s[i] = Float.NaN;
                continue;
            }
            v0s[i] = sample.v0;
            v1s[i] = sample.v1;
            d0s[i] = sample.t0; // TODO time not distance in samples
            d1s[i] = sample.t1; // TODO time not distance in samples
        }
    }

    public int[] eval (TimeSurface surf) {
        final float WALK_SPEED = 1.3f;
        int[] ret = new int[pset.capacity];
        for (int i = 0; i < pset.capacity; i++) {
            int m0 = Integer.MAX_VALUE;
            int m1 = Integer.MAX_VALUE;
            if (v0s[i] != null) {
                int s0 = surf.getTime(v0s[i]);
                if (s0 != TimeSurface.UNREACHABLE) {
                    m0 = (int) (s0 + d0s[i] / WALK_SPEED);
                }
            }
            if (v1s[i] != null) {
                int s1 = surf.getTime(v1s[i]);
                if (s1 != TimeSurface.UNREACHABLE) {
                    m1 = (int) (s1 + d1s[i] / WALK_SPEED);
                }
            }
            ret[i] = (m0 < m1) ? m0 : m1;
        }
        return ret;
    }

}
