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

package org.opentripplanner.routing.impl;

import java.io.File;
import java.io.InputStream;
import java.util.Collection;
import java.util.HashSet;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import lombok.Setter;

import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.routing.graph.Graph.LoadLevel;
import org.opentripplanner.routing.services.GraphService;
import org.opentripplanner.routing.services.StreetVertexIndexFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * An implementation of the file-based GraphServiceFileImpl which auto-configure itself by scanning
 * the root resource directory.
 */
public class GraphServiceAutoDiscoverImpl implements GraphService {

    private static final Logger LOG = LoggerFactory.getLogger(GraphServiceAutoDiscoverImpl.class);

    private GraphServiceFileImpl decorated = new GraphServiceFileImpl();

    /** Last timestamp upper bound when we auto-scanned resources. */
    private long lastAutoScan = 0L;

    /** The autoscan period in seconds */
    @Setter
    private int autoScanPeriodSec = 60;

    private ScheduledExecutorService scanExecutor = Executors.newSingleThreadScheduledExecutor();

    /**
     * The delay before loading a new graph, in seconds. We load a graph if it has been modified at
     * least this amount of time in the past. This in order to give some time for non-atomic graph
     * copy.
     */
    @Setter
    private int loadDelaySec = 10;

    /**
     * @param indexFactory
     */
    public void setIndexFactory(StreetVertexIndexFactory indexFactory) {
        decorated.setIndexFactory(indexFactory);
    }

    /**
     * @param defaultRouterId
     */
    public void setDefaultRouterId(String defaultRouterId) {
        decorated.setDefaultRouterId(defaultRouterId);
    }

    /**
     * Sets a base path for graph loading from the filesystem. Serialized graph files will be
     * retrieved from sub-directories immediately below this directory. The routerId of a graph is
     * the same as the name of its sub-directory. This does the same thing as setResource, except
     * the parameter is interpreted as a file path.
     */
    public void setPath(String path) {
        decorated.setBasePath(path);
    }

    @Override
    public Graph getGraph() {
        return decorated.getGraph();
    }

    @Override
    public Graph getGraph(String routerId) {
        return decorated.getGraph(routerId);
    }

    @Override
    public void setLoadLevel(LoadLevel level) {
        decorated.setLoadLevel(level);
    }

    @Override
    public boolean reloadGraphs(boolean preEvict) {
        return decorated.reloadGraphs(preEvict);
    }

    @Override
    public Collection<String> getRouterIds() {
        return decorated.getRouterIds();
    }

    @Override
    public boolean registerGraph(String routerId, boolean preEvict) {
        // Invalid in auto-discovery mode
        return false;
    }

    @Override
    public boolean registerGraph(String routerId, Graph graph) {
        // Invalid in auto-discovery mode
        return false;
    }

    @Override
    public boolean evictGraph(String routerId) {
        // Invalid in auto-discovery mode
        return false;
    }

    @Override
    public int evictAll() {
        // Invalid in auto-discovery mode
        return 0;
    }

    @Override
    public boolean save(String routerId, InputStream is) {
        return decorated.save(routerId, is);
    }

    /**
     * Based on the autoRegister list, automatically register all routerIds for which we can find a
     * graph file in a subdirectory of the resourceBase path. Also register and load the graph for
     * the defaultRouterId and warn if no routerIds are registered.
     */
    @PostConstruct
    // PostConstruct means run on startup after all injection has occurred
    private void startup() {
        /* Run the first one syncronously as other initialization methods may need a default router. */
        autoDiscoverGraphs();
        /*
         * Starting with JDK7 we should use a directory change listener callback on baseResource
         * instead.
         */
        scanExecutor.scheduleWithFixedDelay(new Runnable() {
            @Override
            public void run() {
                autoDiscoverGraphs();
            }
        }, autoScanPeriodSec, autoScanPeriodSec, TimeUnit.SECONDS);
    }

    /**
     * This is called when the bean gets deleted, that is mainly in case of webapp container
     * application stop or reload. We teardown all loaded graph to stop their background real-time
     * data updater thread, and also the background auto-discover scanner thread.
     */
    @PreDestroy
    private void teardown() {
        LOG.info("Cleaning-up auto-discover thread and graphs");
        decorated.evictAll();
        scanExecutor.shutdown();
        try {
            boolean noTimeout = scanExecutor.awaitTermination(10, TimeUnit.SECONDS);
            if (!noTimeout)
                LOG.warn("Timeout while waiting for scanner thread to finish");
        } catch (InterruptedException e) {
            // This is not really important
            LOG.warn("Interrupted while waiting for scanner thread to finish", e);
        }
        decorated.cleanupWebapp();
    }

    private synchronized void autoDiscoverGraphs() {
        LOG.debug("Auto discovering graphs under {}", decorated.getBasePath());
        Collection<String> graphOnDisk = new HashSet<String>();
        Collection<String> graphToLoad = new HashSet<String>();
        // Only reload graph modified more than 1 mn ago.
        long validEndTime = System.currentTimeMillis() - loadDelaySec * 1000;
        File baseFile = new File(decorated.getBasePath());
        // First check for a root graph
        File rootGraphFile = new File(baseFile, GraphServiceFileImpl.GRAPH_FILENAME);
        if (rootGraphFile.exists() && rootGraphFile.canRead()) {
            graphOnDisk.add("");
            // lastModified can change, so test must be atomic here.
            long lastModified = rootGraphFile.lastModified();
            if (lastModified > lastAutoScan && lastModified <= validEndTime) {
                LOG.debug("Graph to (re)load: {}, lastModified={}", rootGraphFile, lastModified);
                graphToLoad.add("");
            }
        }
        // Then graph in sub-directories
        for (String sub : baseFile.list()) {
            File subFile = new File(baseFile, sub);
            if (subFile.isDirectory()) {
                File graphFile = new File(subFile, GraphServiceFileImpl.GRAPH_FILENAME);
                if (graphFile.exists() && graphFile.canRead()) {
                    graphOnDisk.add(sub);
                    long lastModified = graphFile.lastModified();
                    if (lastModified > lastAutoScan && lastModified <= validEndTime) {
                        LOG.debug("Graph to (re)load: {}, lastModified={}", graphFile, lastModified);
                        graphToLoad.add(sub);
                    }
                }
            }
        }
        lastAutoScan = validEndTime;

        StringBuffer onDiskSb = new StringBuffer();
        for (String routerId : graphOnDisk)
            onDiskSb.append("[").append(routerId).append("]");
        StringBuffer toLoadSb = new StringBuffer();
        for (String routerId : graphToLoad)
            toLoadSb.append("[").append(routerId).append("]");
        LOG.debug("Found routers: {} - Must reload: {}", onDiskSb.toString(), toLoadSb.toString());
        for (String routerId : graphToLoad) {
            /*
             * Do not set preEvict, because: 1) during loading of a new graph we want to keep one
             * available; and 2) if the loading of a new graph fails we also want to keep the old
             * one.
             */
            decorated.registerGraph(routerId, false);
        }
        for (String routerId : getRouterIds()) {
            // Evict graph removed from disk.
            if (!graphOnDisk.contains(routerId)) {
                LOG.warn("Auto-evicting routerId '{}', not present on disk anymore.", routerId);
                decorated.evictGraph(routerId);
            }
        }

        /*
         * If the defaultRouterId is not present, print a warning and set it to some default.
         */
        if (!getRouterIds().contains(decorated.getDefaultRouterId())) {
            LOG.warn("Default routerId '{}' not available!", decorated.getDefaultRouterId());
            if (!getRouterIds().isEmpty()) {
                // Let's see which one we want to take by default
                String defRouterId = null;
                if (getRouterIds().contains("")) {
                    // If we have a root graph, this should be a good default
                    defRouterId = "";
                    LOG.info("Setting default routerId to root graph ''");
                } else {
                    // Otherwise take first one present
                    defRouterId = getRouterIds().iterator().next();
                    if (getRouterIds().size() > 1)
                        LOG.warn("Setting default routerId to arbitrary one '{}'", defRouterId);
                    else
                        LOG.info("Setting default routerId to '{}'", defRouterId);
                }
                decorated.setDefaultRouterId(defRouterId);
            }
        }
        if (this.getRouterIds().isEmpty()) {
            LOG.warn("No graphs have been loaded/registered. "
                    + "You must place one or more graphs before routing.");
        }
    }

}
