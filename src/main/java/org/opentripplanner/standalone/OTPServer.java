package org.opentripplanner.standalone;

import com.google.common.collect.Maps;

import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.opentripplanner.analyst.DiskBackedPointSetCache;
import org.opentripplanner.analyst.PointSetCache;
import org.opentripplanner.analyst.SurfaceCache;
import org.opentripplanner.analyst.core.GeometryIndex;
import org.opentripplanner.analyst.request.IsoChroneSPTRenderer;
import org.opentripplanner.analyst.request.IsoChroneSPTRendererAccSampling;
import org.opentripplanner.analyst.request.IsoChroneSPTRendererRecursiveGrid;
import org.opentripplanner.analyst.request.Renderer;
import org.opentripplanner.analyst.request.SPTCache;
import org.opentripplanner.analyst.request.SampleFactory;
import org.opentripplanner.analyst.request.SampleGridRenderer;
import org.opentripplanner.analyst.request.TileCache;
import org.opentripplanner.api.resource.PlanGenerator;
import org.opentripplanner.routing.algorithm.GenericAStar;
import org.opentripplanner.routing.core.RoutingRequest;
import org.opentripplanner.routing.impl.LongDistancePathService;
import org.opentripplanner.routing.impl.RetryingPathServiceImpl;
import org.opentripplanner.routing.services.GraphService;
import org.opentripplanner.routing.services.PathService;
import org.opentripplanner.routing.services.SPTService;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.rolling.RollingFileAppender;
import ch.qos.logback.core.rolling.TimeBasedRollingPolicy;
import ch.qos.logback.core.rolling.DefaultTimeBasedFileNamingAndTriggeringPolicy;
import org.slf4j.LoggerFactory;

import javax.ws.rs.ext.Provider;

import java.io.File;
import java.util.Map;

/**
 * This is replacing a Spring application context.
 */
public class OTPServer {

    private static final Logger LOG = (Logger) LoggerFactory.getLogger(OTPServer.class);

    // will replace graphService
    private final Map<String, Router> routers = Maps.newHashMap();

    // Core OTP modules
    public GraphService graphService;
    public PathService pathService;
    public RoutingRequest routingRequest; // the prototype routing request which establishes default parameter values
    public PlanGenerator planGenerator;
    public SPTService sptService;

    // Optional Analyst Modules
    public Renderer renderer;
    public SPTCache sptCache;
    public TileCache tileCache;
    public IsoChroneSPTRenderer isoChroneSPTRenderer;
    public SampleGridRenderer sampleGridRenderer;
    public SurfaceCache surfaceCache;
    public PointSetCache pointSetCache;

    /**
     *  Separate logger for incoming requests. This should be handled with a Logback logger rather than something
     *  simple like a PrintStream because requests come in multi-threaded.
     */
    public Logger requestLogger = null;

    public Router getRouter(String routerId) {
        return routers.get(routerId);
    }

    public OTPServer (CommandLineParameters params, GraphService gs) {
        LOG.info("Wiring up and configuring server.");

        this.requestLogger = createLogger(); 

        // Core OTP modules
        graphService = gs;
        routingRequest = new RoutingRequest();
        sptService = new GenericAStar();

        // Choose a PathService to wrap the SPTService, depending on expected maximum path lengths
        if (params.longDistance) {
            LongDistancePathService pathService = new LongDistancePathService(graphService, sptService);
            pathService.setTimeout(10);
            this.pathService = pathService;
        } else {
            RetryingPathServiceImpl pathService = new RetryingPathServiceImpl(graphService, sptService);
            pathService.setFirstPathTimeout(10.0);
            pathService.setMultiPathTimeout(1.0);
            this.pathService = pathService;
            // cpf.bind(RemainingWeightHeuristicFactory.class,
            //        new DefaultRemainingWeightHeuristicFactoryImpl());
        }

        planGenerator = new PlanGenerator(graphService, pathService);

        // Optional Analyst Modules.
        if (params.analyst) {
            tileCache = new TileCache(graphService);
            sptCache = new SPTCache(sptService, graphService);
            renderer = new Renderer(tileCache, sptCache);
            sampleGridRenderer = new SampleGridRenderer(graphService, sptService);
            isoChroneSPTRenderer = new IsoChroneSPTRendererAccSampling(graphService, sptService, sampleGridRenderer);
            surfaceCache = new SurfaceCache(30);
            pointSetCache = new DiskBackedPointSetCache(100, params.pointSetDirectory);
        }

    }

    /**
     * Return an HK2 Binder that injects this specific OTPServer instance into Jersey web resources.
     * This should be registered in the ResourceConfig (Jersey) or Application (JAX-RS) as a singleton.
     * More on custom injection in Jersey 2:
     * http://jersey.576304.n2.nabble.com/Custom-providers-in-Jersey-2-tp7580699p7580715.html
     */
     public AbstractBinder makeBinder() {
        return new AbstractBinder() {
            @Override
            protected void configure() {
                bind(OTPServer.this).to(OTPServer.class);
                bind(graphService).to(GraphService.class);
            }
        };
    }

/**
     * Programmatically (i.e. not in XML) create a Logback logger for requests happening on this router.
     * http://stackoverflow.com/a/17215011/778449
     */
    private static Logger createLogger() {
        LoggerContext lc = (LoggerContext) LoggerFactory.getILoggerFactory();
        PatternLayoutEncoder ple = new PatternLayoutEncoder();
        ple.setPattern("%d{yyyy-MM-dd'T'HH:mm:ss.SSS} %msg%n");
        ple.setContext(lc);
        ple.start();

        DefaultTimeBasedFileNamingAndTriggeringPolicy<ILoggingEvent> timeBasedTriggeringPolicy = new DefaultTimeBasedFileNamingAndTriggeringPolicy<ILoggingEvent>();
        timeBasedTriggeringPolicy.setContext(lc);

        TimeBasedRollingPolicy<ILoggingEvent> timeBasedRollingPolicy = new TimeBasedRollingPolicy<ILoggingEvent>();
        timeBasedRollingPolicy.setContext(lc);
        timeBasedRollingPolicy.setFileNamePattern("requests.%d{yyyy-MM-dd}.log");
        timeBasedRollingPolicy.setTimeBasedFileNamingAndTriggeringPolicy(timeBasedTriggeringPolicy);
        timeBasedRollingPolicy.setMaxHistory(7);
        timeBasedTriggeringPolicy.setTimeBasedRollingPolicy(timeBasedRollingPolicy);

        RollingFileAppender<ILoggingEvent> rollingFileAppender = new RollingFileAppender<ILoggingEvent>();
        rollingFileAppender.setAppend(true);
        rollingFileAppender.setContext(lc);
        rollingFileAppender.setEncoder(ple);
        rollingFileAppender.setFile("requests.log");
        rollingFileAppender.setName("REQ_LOG Appender");
        rollingFileAppender.setPrudent(false);
        rollingFileAppender.setRollingPolicy(timeBasedRollingPolicy);
        rollingFileAppender.setTriggeringPolicy(timeBasedTriggeringPolicy);

        timeBasedRollingPolicy.setParent(rollingFileAppender);

        ple.start();
        timeBasedRollingPolicy.start();
        rollingFileAppender.start();

        Logger logger = (Logger) LoggerFactory.getLogger("REQ_LOG");
        logger.addAppender(rollingFileAppender);
        logger.setLevel(Level.INFO);
        logger.setAdditive(false);
        return logger;
    }

}
