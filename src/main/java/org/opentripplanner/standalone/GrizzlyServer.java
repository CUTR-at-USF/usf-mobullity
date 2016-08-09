package org.opentripplanner.standalone;

import java.io.File;
import java.io.IOException;
import java.net.BindException;

import org.glassfish.grizzly.http.CompressionConfig;
import org.glassfish.grizzly.http.server.CLStaticHttpHandler;
import org.glassfish.grizzly.http.server.HttpHandler;
import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.grizzly.http.server.NetworkListener;
import org.glassfish.grizzly.http.server.Request;
import org.glassfish.grizzly.http.server.Response;
import org.glassfish.grizzly.http.util.HttpStatus;
import org.glassfish.grizzly.http.util.Header;
import org.glassfish.grizzly.ssl.SSLContextConfigurator;
import org.glassfish.grizzly.ssl.SSLEngineConfigurator;
import org.glassfish.grizzly.threadpool.ThreadPoolConfig;
import org.glassfish.jersey.server.ContainerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.bridge.SLF4JBridgeHandler;

import javax.ws.rs.core.Application;

public class GrizzlyServer {

    private static final Logger LOG = LoggerFactory.getLogger(GrizzlyServer.class);
    
    static {
        // Remove existing handlers attached to the j.u.l root logger
        SLF4JBridgeHandler.removeHandlersForRootLogger();  // (since SLF4J 1.6.5)
        // Bridge j.u.l (used by Jersey) to the SLF4J root logger
        SLF4JBridgeHandler.install();
    }

    /** The command line parameters, including things like port number and content directories. */
    private CommandLineParameters params;
    private OTPServer server;

    /** Construct a Grizzly server with the given IoC injector and command line parameters. */
    public GrizzlyServer (CommandLineParameters params, OTPServer server) {
        this.params = params;
        this.server = server;
    }

    /**
     * This function goes through roughly the same steps as Jersey's GrizzlyServerFactory, but we instead construct
     * an HttpServer and NetworkListener manually so we can set the number of threads and other details.
     */
    public void run() {
        
        LOG.info("Starting OTP Grizzly server on ports {} (HTTP) and {} (HTTPS) of interface {}",
            params.port, params.securePort, params.bindAddress);
        LOG.info("OTP server base path is {}", params.basePath);
        HttpServer httpServer = new HttpServer();

        /* Configure SSL */
        SSLContextConfigurator sslConfig = new SSLContextConfigurator();
        sslConfig.setKeyStoreFile(new File(params.basePath, "keystore").getAbsolutePath());
        sslConfig.setKeyStorePass("opentrip");

        /* OTP is CPU-bound, so we want only as many worker threads as we have cores. */
        ThreadPoolConfig threadPoolConfig = ThreadPoolConfig.defaultConfig()
            .setCorePoolSize(1)
            .setMaxPoolSize(Runtime.getRuntime().availableProcessors());

        /* HTTP (non-encrypted) listener */
        NetworkListener httpListener = new NetworkListener("otp_insecure", params.bindAddress, params.port);
        // OTP is CPU-bound, we don't want more threads than cores. TODO: We should switch to async handling.
        httpListener.setSecure(false);

        /* HTTPS listener */
        NetworkListener httpsListener = new NetworkListener("otp_secure", params.bindAddress, params.securePort);
        // Ideally we'd share the threads between HTTP and HTTPS.
        httpsListener.setSecure(true);
        httpsListener.setSSLEngineConfig(
                new SSLEngineConfigurator(sslConfig)
                        .setClientMode(false)
                        .setNeedClientAuth(false)
        );

        // For both HTTP and HTTPS listeners: enable gzip compression, set thread pool, add listener to httpServer.
        CompressionConfig cc = httpsListener.getCompressionConfig();
        cc.setCompressionMode(CompressionConfig.CompressionMode.ON);
        cc.setCompressionMinSize(500); // the min number of bytes to compress
        cc.setCompressableMimeTypes("text/plain", "text/html", "text/javascript", "text/css", "application/json", "text/json"); // the mime types to compress
        httpsListener.getTransport().setWorkerThreadPoolConfig(threadPoolConfig);
        httpServer.addListener(httpsListener);        

        HttpServer httpRedirect = new HttpServer();
        httpRedirect.addListener(httpListener);

        httpRedirect.getServerConfiguration().addHttpHandler(new HttpHandler() {
            
            @Override
            public void service(Request request, Response response) throws Exception {

                StringBuilder str = new StringBuilder();

                str.append( "https://" );

                // Determine the correct host to redirect to based on local server name, and host parameter
                if (request.getHeader("Host") != null) {

                    switch (request.getHeader("Host").replace(String.format(":%d", params.port), "").toLowerCase()) {
                    default:
                    case "maps.usf.edu":
                        str.append( "maps.usf.edu" );
                        break;
                    case "mobullity.forest.usf.edu":
                        str.append( "mobullity.forest.usf.edu" );
                        break;
                    case "localhost":
                        str.append( "localhost" );
                    }
                }
                else {
                    switch (request.getLocalName().toLowerCase()) {
                    default:
                    case "mobullity.forest.usf.edu":
                        str.append( "mobullity.forest.usf.edu" );
                        break;
                    case "mobullity2.forest.usf.edu":
                    case "mobullity3.forest.usf.edu":
                        str.append( "maps.usf.edu" );
                        break;
                    case "localhost":
                        str.append( "localhost" );
                    }
                }

                if (params.securePort != 443)
                    str.append( String.format(":%d", params.securePort) );

                str.append( request.getRequestURI() );

                if (request.getQueryString() != null) {
                    str.append( "?" );
                    str.append( request.getQueryString() );
                }

                response.setStatus(HttpStatus.MOVED_PERMANENTLY_301);
                response.setHeader(Header.Location, str.toString() );
            }
        }, "");
        
        /* Add a few handlers (~= servlets) to the Grizzly server. */

        /* 1. A Grizzly wrapper around the Jersey Application. */
        Application app = new OTPApplication(server);
        HttpHandler dynamicHandler = ContainerFactory.createContainer(HttpHandler.class, app);
        httpServer.getServerConfiguration().addHttpHandler(dynamicHandler, "/otp/");

class NewStatic extends CLStaticHttpHandler {


    NewStatic(ClassLoader cls, String docRoot) {
        super(cls, docRoot);
    }
    
    protected boolean handle(String uri, Request req, Response resp) throws Exception {

        resp.setHeader("Cache-Control", "max-age=604800");

        return super.handle(uri, req, resp);
    }

}
         /* 2. A static content handler to serve the client JS apps etc. from the classpath. */
        CLStaticHttpHandler staticHandler = new NewStatic(GrizzlyServer.class.getClassLoader(), "/client/");

        httpServer.getServerConfiguration().addHttpHandler(staticHandler, "/");

        /* 3. Test alternate method (no Jersey). */
        // As in servlets, * is needed in base path to identify the "rest" of the path.
        // GraphService gs = (GraphService) iocFactory.getComponentProvider(GraphService.class).getInstance();
        // Graph graph = gs.getGraph();
        // httpServer.getServerConfiguration().addHttpHandler(new OTPHttpHandler(graph), "/test/*");
        
        /* RELINQUISH CONTROL TO THE SERVER THREAD */
        try {
            httpServer.start(); 
            httpRedirect.start();
            LOG.info("Grizzly server running.");
            Thread.currentThread().join();
        } catch (BindException be) {
            LOG.error("Cannot bind to port {}. Is it already in use?", params.port);
        } catch (IOException ioe) {
            LOG.error("IO exception while starting server.");
        } catch (InterruptedException ie) {
            LOG.info("Interrupted, shutting down.");
        }
        httpServer.shutdown();
        httpRedirect.shutdown();

    }
}
