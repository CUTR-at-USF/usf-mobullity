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

package org.opentripplanner.standalone;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonParser;

import org.opentripplanner.graph_builder.GraphBuilderTask;
import org.opentripplanner.visualizer.GraphVisualizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.beust.jcommander.JCommander;
import com.beust.jcommander.ParameterException;

/**
 * I originally considered configuring OTP server through Java properties, with one global
 * properties file at /etc/otp.properties for the whole server and one optional properties file per
 * graph, then allowing overriding or entirely replacing these settings with command line options.
 * 
 * However, there are not that many build/server settings. Rather than duplicating everything in
 * properties, a command line options class, and an internal configuration class, I am tentatively
 * just using command line parameters for everything. JCommander lets you use "@filename" notation
 * to load command line parameters from a file, which we can keep in /etc or wherever.
 * 
 * Graphs are sought by default in /var/otp/graphs.
 */
public class OTPMain {

    private static final Logger LOG = LoggerFactory.getLogger(OTPMain.class);

    public static void main(String[] args) {
        /* Parse and validate command line parameters */
        CommandLineParameters params = new CommandLineParameters();
        try {
            JCommander jc = new JCommander(params, args);
            if (params.help) {
                jc.setProgramName("java -Xmx[several]G -jar otp.jar");
                jc.usage();
                System.exit(0);
            }
            params.infer();
        } catch (ParameterException pex) {
            LOG.error("Parameter error: {}", pex.getMessage());
            System.exit(1);
        }
        
        OTPConfigurator configurator = new OTPConfigurator(params);
        
        // start graph builder, if asked for
        GraphBuilderTask graphBuilder = configurator.builderFromParameters();
        if (graphBuilder != null) {
            graphBuilder.run();
            // Inform configurator which graph is to be used for in-memory handoff.
            if (params.inMemory) configurator.makeGraphService(graphBuilder.getGraph());
        }
        
        // start visualizer, if asked for
        GraphVisualizer graphVisualizer = configurator.visualizerFromParameters();
        if (graphVisualizer != null) {
            graphVisualizer.run();
        }
        
        // start web server, if asked for
        GrizzlyServer grizzlyServer = configurator.serverFromParameters();
        if (grizzlyServer != null) {
            while (true) { // Loop to restart server on uncaught fatal exceptions.
                try {
                    grizzlyServer.run();
                    return;
                } catch (Throwable throwable) {
                    throwable.printStackTrace();
                    LOG.error("An uncaught {} occurred inside OTP. Restarting server.", 
                              throwable.getClass().getSimpleName());
                }
            }
        }
        
        if( graphBuilder==null && graphVisualizer==null && grizzlyServer==null ){
        	LOG.info( "Nothing to do. Use --help to see available tasks.");;
        }
        
    }

    /**
     * Open and parse the JSON file at the given path into a Jackson JSON tree. Comments and unquoted keys are allowed.
     * Returns null if the file does not exist,
     * Returns null if the file contains syntax errors or cannot be parsed for some other reason.
     *
     * We do not require any JSON config files to be present because that would get in the way of the simplest
     * rapid deployment workflow. Therefore we return an empty JSON node when the file is missing, causing us to fall
     * back on all the default values as if there was a JSON file present with no fields defined.
     */
    public static JsonNode loadJson (File file) {
        try (FileInputStream jsonStream = new FileInputStream(file)) {
            ObjectMapper mapper = new ObjectMapper();
            mapper.configure(JsonParser.Feature.ALLOW_COMMENTS, true);
            mapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true);
            JsonNode config = mapper.readTree(jsonStream);
            LOG.info("Found and loaded JSON configuration file '{}'", file);
            return config;
        } catch (Exception ex) {
            LOG.error("Error while parsing JSON config file '{}': {}", file, ex.getMessage());
            System.exit(42); // probably "should" be done with an exception
            return null;
        }
    }

}
