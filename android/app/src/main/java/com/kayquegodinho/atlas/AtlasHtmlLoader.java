package com.kayquegodinho.atlas;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;
import javax.net.ssl.HttpsURLConnection;

final class AtlasHtmlLoader {
    static final String RAW_URL =
            "https://raw.githubusercontent.com/kayquegodinho/treino-kayque/main/index.html";
    private static final int MAX_BYTES = 4 * 1024 * 1024;
    private static final Pattern HTML_DOCUMENT = Pattern.compile(
            "(?is)^\\s*\uFEFF?\\s*(?:<!doctype\\s+html[^>]*>\\s*)?<html\\b[^>]*>.*<body\\b[^>]*>.*</body\\s*>\\s*</html\\s*>\\s*$");

    static String fetch(String userAgent) throws IOException {
        // A unique URL also avoids a stale response from intermediary caches.
        URL url = new URL(RAW_URL + "?atlas=" + System.currentTimeMillis());
        return fetch((HttpsURLConnection) url.openConnection(), userAgent);
    }

    static String fetch(HttpsURLConnection connection, String userAgent) throws IOException {
        try {
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(7000);
            connection.setUseCaches(false);
            connection.setInstanceFollowRedirects(false);
            connection.setRequestProperty("Cache-Control", "no-cache, no-store, max-age=0");
            connection.setRequestProperty("Pragma", "no-cache");
            connection.setRequestProperty("User-Agent", userAgent);
            if (connection.getResponseCode() != 200) {
                throw new IOException("Unexpected HTTP status");
            }
            try (InputStream input = connection.getInputStream();
                 ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    if (Thread.currentThread().isInterrupted() || output.size() + count > MAX_BYTES) {
                        throw new IOException("Download interrupted or too large");
                    }
                    output.write(buffer, 0, count);
                }
                // GitHub Raw serves HTML as text/plain; validate the document, not the MIME type.
                String html = new String(output.toByteArray(), StandardCharsets.UTF_8);
                if (!HTML_DOCUMENT.matcher(html).matches()) {
                    throw new IOException("Response is not a complete HTML document");
                }
                return html;
            }
        } finally {
            connection.disconnect();
        }
    }
}
