package com.kayquegodinho.atlas;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private WebView webView;
    private final ExecutorService loader = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private boolean startupComplete;
    private static final String BASE_URL = "https://kayquegodinho.github.io/treino-kayque/";
    private static final String HOME = "https://kayquegodinho.github.io/treino-kayque/?android=1";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.BLACK);
        getWindow().setNavigationBarColor(Color.BLACK);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
        }

        setContentView(R.layout.activity_main);

        FrameLayout root = findViewById(R.id.root);
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int left;
            int top;
            int right;
            int bottom;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                android.graphics.Insets bars = insets.getInsets(
                    WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout()
                );
                left = bars.left;
                top = bars.top;
                right = bars.right;
                bottom = bars.bottom;
            } else {
                left = insets.getSystemWindowInsetLeft();
                top = insets.getSystemWindowInsetTop();
                right = insets.getSystemWindowInsetRight();
                bottom = insets.getSystemWindowInsetBottom();
            }

            v.setPadding(left, top, right, bottom);
            return insets;
        });
        root.requestApplyInsets();

        webView = findViewById(R.id.webview);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setTextZoom(100);
        settings.setUserAgentString(settings.getUserAgentString() + " AtlasAndroid/1.2.0");

        webView.setBackgroundColor(Color.BLACK);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String host = uri.getHost();
                if ("kayquegodinho.github.io".equals(host)) {
                    return false;
                }
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
                return true;
            }
        });

        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
            loadLatestInterface(settings.getUserAgentString());
        }
    }

    private void loadLatestInterface(String userAgent) {
        // Bound total startup time as well as individual network operations.
        mainHandler.postDelayed(() -> finishStartup(null), 15000);
        loader.execute(() -> {
            String html = null;
            try {
                html = AtlasHtmlLoader.fetch(userAgent);
            } catch (IOException ignored) {
                // Pages remains the fallback, including its existing offline behavior.
            }
            final String result = html;
            mainHandler.post(() -> finishStartup(result));
        });
    }

    private void finishStartup(String html) {
        if (startupComplete || isFinishing() || isDestroyed()) return;
        startupComplete = true;
        mainHandler.removeCallbacksAndMessages(null);
        if (html != null) {
            // Keep relative resources and localStorage on the existing HTTPS origin.
            webView.loadDataWithBaseURL(BASE_URL, html, "text/html", "UTF-8", HOME);
        } else {
            webView.loadUrl(HOME);
        }
    }

    @Override
    protected void onDestroy() {
        startupComplete = true;
        mainHandler.removeCallbacksAndMessages(null);
        loader.shutdownNow();
        super.onDestroy();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
