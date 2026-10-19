package com.kayquegodinho.atlas;

import org.junit.Test;
import static org.junit.Assert.*;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.cert.Certificate;
import javax.net.ssl.HttpsURLConnection;

public class AtlasHtmlLoaderTest {
    private static final String HTML = "<!DOCTYPE html><html lang='pt-BR'><head></head>"
            + "<body>Refeição #1 — 100% <script>const x = 'á';</script></body></html>";

    @Test public void returnsExactUtf8HtmlAndDisablesCaches() throws Exception {
        FakeConnection connection = new FakeConnection(200, HTML);
        assertEquals(HTML, AtlasHtmlLoader.fetch(connection, "AtlasAndroid/1.2.0"));
        assertFalse(connection.getUseCaches());
        assertFalse(connection.getInstanceFollowRedirects());
        assertEquals("AtlasAndroid/1.2.0", connection.getRequestProperty("User-Agent"));
        assertTrue(connection.getRequestProperty("Cache-Control").contains("no-store"));
        assertTrue(connection.getConnectTimeout() > 0);
        assertTrue(connection.getReadTimeout() > 0);
        assertTrue(connection.disconnected);
    }

    @Test public void rejectsErrorsAndRedirectsEvenWithHtmlBodies() throws Exception {
        for (int status : new int[]{301, 304, 404, 500}) {
            assertRejected(new FakeConnection(status, HTML));
        }
    }

    @Test public void rejectsEmptyNonHtmlAndTruncatedDocuments() throws Exception {
        for (String body : new String[]{"", "404: Not Found", "{\"error\":true}",
                "<html><body>incomplete", "<html><body>missing end</html>"}) {
            assertRejected(new FakeConnection(200, body));
        }
    }

    @Test public void rejectsOversizedResponses() throws Exception {
        assertRejected(new FakeConnection(200, "<html><body>"
                + new String(new char[4 * 1024 * 1024]) + "</body></html>"));
    }

    @Test public void disconnectsOnNetworkTimeout() throws Exception {
        FakeConnection connection = new FakeConnection(200, HTML);
        connection.timeout = true;
        assertRejected(connection);
    }

    private static void assertRejected(FakeConnection connection) throws Exception {
        assertThrows(IOException.class, () -> AtlasHtmlLoader.fetch(connection, "AtlasAndroid/1.2.0"));
        assertTrue(connection.disconnected);
    }

    private static final class FakeConnection extends HttpsURLConnection {
        private final int status;
        private final byte[] body;
        boolean disconnected;
        boolean timeout;

        FakeConnection(int status, String body) throws Exception {
            super(new URL(AtlasHtmlLoader.RAW_URL));
            this.status = status;
            this.body = body.getBytes(StandardCharsets.UTF_8);
        }
        @Override public int getResponseCode() throws IOException {
            if (timeout) throw new SocketTimeoutException("test timeout");
            return status;
        }
        @Override public InputStream getInputStream() { return new ByteArrayInputStream(body); }
        @Override public void disconnect() { disconnected = true; }
        @Override public boolean usingProxy() { return false; }
        @Override public void connect() {}
        @Override public String getCipherSuite() { return "test"; }
        @Override public Certificate[] getLocalCertificates() { return null; }
        @Override public Certificate[] getServerCertificates() { return null; }
    }
}
