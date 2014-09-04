package org.opentripplanner.common;

import com.google.common.collect.Iterables;
import com.google.common.collect.Lists;
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.standard.StandardAnalyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.DoubleField;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.StringField;
import org.apache.lucene.document.TextField;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.IndexReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.IndexWriterConfig.OpenMode;
import org.apache.lucene.index.Term;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.apache.lucene.search.BooleanClause;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.FuzzyQuery;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.ScoreDoc;
import org.apache.lucene.search.TermQuery;
import org.apache.lucene.search.TopScoreDocCollector;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.store.RAMDirectory;
import org.apache.lucene.util.Version;
import org.onebusaway.gtfs.model.Stop;
import org.opentripplanner.routing.edgetype.PlainStreetEdge;
import org.opentripplanner.routing.graph.GraphIndex;
import org.opentripplanner.routing.vertextype.StreetVertex;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.util.List;

/**
 * Lucene based index of streets, stops, etc.
 * For reference see:
 * https://svn.apache.org/repos/asf/lucene/dev/trunk/lucene/demo/src/java/org/apache/lucene/demo/IndexFiles.java
 */
public class LuceneIndex {

    private static final Logger LOG = LoggerFactory.getLogger(LuceneIndex.class);

    private Analyzer analyzer = new StandardAnalyzer(Version.LUCENE_47);
    private QueryParser parser = new QueryParser(Version.LUCENE_47, "name", analyzer);
    private GraphIndex graphIndex;
    private Directory directory;
    private IndexSearcher searcher; // Will be null until index is built.

    public LuceneIndex(final GraphIndex graphIndex, boolean background) {
        this.graphIndex = graphIndex;
        if (background) {
            new BackgroundIndexer().start();
        } else {
            new BackgroundIndexer().run();
        }
    }

    /**
     * Index stations, stops, intersections, streets, and addresses by name and location.
     */
    private void index() {
        try {
            long startTime = System.currentTimeMillis();
            directory = FSDirectory.open(new File("/var/otp/lucene"));
            // TODO reuse the index if it exists?
            //directory = new RAMDirectory(); // only a little faster
            IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_47, analyzer).setOpenMode(OpenMode.CREATE);
            final IndexWriter writer = new IndexWriter(directory, config);
            for (Stop stop : graphIndex.stopForId.values()) {
                addStop(writer, stop);
            }
            for (StreetVertex sv : Iterables.filter(graphIndex.vertexForId.values(), StreetVertex.class)) {
                addCorner(writer, sv);
            }
            writer.close();
            long elapsedTime = System.currentTimeMillis() - startTime;
            LOG.info("Built Lucene index in {} msec", elapsedTime);
            // Make the IndexSearcher necessary for querying.
            searcher = new IndexSearcher(DirectoryReader.open(directory));
        } catch (Exception ex) {
            throw new RuntimeException("Lucene indexing failed.", ex);
        }
    }

    private void addStop(IndexWriter iwriter, Stop stop) throws IOException {
        Document doc = new Document();
        doc.add(new TextField("name", stop.getName(), Field.Store.YES));
        if (stop.getCode() != null) {
            doc.add(new StringField("code", stop.getCode(), Field.Store.YES));
        }
        doc.add(new DoubleField("lat", stop.getLat(), Field.Store.YES));
        doc.add(new DoubleField("lon", stop.getLon(), Field.Store.YES));
        doc.add(new StringField("id", stop.getId().toString(), Field.Store.YES));
        doc.add(new StringField("category", Category.STOP.name(), Field.Store.YES));
        iwriter.addDocument(doc);
    }

    private void addCorner(IndexWriter iwriter, StreetVertex sv) throws IOException {
        String mainStreet = null;
        String crossStreet = null;
        // TODO score based on OSM street type, using intersection nodes instead of vertices.
        for (PlainStreetEdge pse : Iterables.filter(sv.getOutgoing(), PlainStreetEdge.class)) {
            if (mainStreet == null) mainStreet = pse.getName();
            else crossStreet = pse.getName();
        }
        if (mainStreet == null || crossStreet == null) return;
        if (mainStreet.equals(crossStreet)) return;
        Document doc = new Document();
        doc.add(new TextField("name", mainStreet + " & " + crossStreet, Field.Store.YES));
        doc.add(new DoubleField("lat", sv.getLat(), Field.Store.YES));
        doc.add(new DoubleField("lon", sv.getLon(), Field.Store.YES));
        doc.add(new StringField("category", Category.CORNER.name(), Field.Store.YES));
        iwriter.addDocument(doc);
    }

    private class BackgroundIndexer extends Thread {
        @Override
        public void run() {
            LOG.info("Starting background Lucene indexing.");
            index();
        }
    }

    /** Return a list of results in in the format expected by GeocoderBuiltin.js in the OTP Leaflet client. */
    public List<LuceneResult> query (String queryString) {
        /* Turn the query string into a Lucene query. Terms are fuzzy and should all be present. */
        BooleanQuery query = new BooleanQuery();
        for (String term : queryString.split(" ")) {
            query.add(new FuzzyQuery(new Term("name", term)), BooleanClause.Occur.SHOULD);
        }
        List<LuceneResult> result = Lists.newArrayList();
        try {
            TopScoreDocCollector collector = TopScoreDocCollector.create(10, true);
            searcher.search(query, collector);
            ScoreDoc[] docs = collector.topDocs().scoreDocs;
            for (int i = 0; i < docs.length; i++) {
                LuceneResult lr = new LuceneResult();
                Document doc = searcher.doc(docs[i].doc);
                lr.lat = doc.getField("lat").numericValue().doubleValue();
                lr.lng = doc.getField("lon").numericValue().doubleValue();
                String category = doc.getField("category").stringValue().toLowerCase();
                String name = doc.getField("name").stringValue();
                lr.description = category + " " + name;
                result.add(lr);
            }
        } catch (Exception ex) {
            LOG.error("Error during Lucene search: {}", ex.toString());
            ex.printStackTrace();
        } finally {
            return result;
        }
    }

    /** This class matches the structure of the Geocoder responses expected by the OTP client. */
    public static class LuceneResult {
        public double lat;
        public double lng;
        public String description;
    }

    public static enum Category { STOP, CORNER; }
}

