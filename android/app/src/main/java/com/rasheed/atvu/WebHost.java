package com.rasheed.atvu;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Color;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

/** Builds the WebView that shows web/ from the app's assets, for the screensaver and the settings screen. */
final class WebHost {
    // Served from a real https origin, so localStorage (the settings) and the data APIs work as in a browser.
    static final String PAGE_HOST = "appassets.androidplatform.net";
    static final String PAGE = "https://" + PAGE_HOST + "/assets/web/index.html";

    private WebHost() {}

    static WebView create(Context context, String query) {
        return create(context, query, null);
    }

    /** With a bridge: only the home screen passes one (window.AndroidTV), and the page is only ever ours. */
    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    static WebView create(Context context, String query, Object bridge) {
        WebView web = new WebView(context);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false); // the adhan plays without a key press
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(context))
                .build();
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            // The page never navigates away from itself; anything else (a link in a caption) is ignored.
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !PAGE_HOST.equals(request.getUrl().getHost());
            }
        });
        if (bridge != null) web.addJavascriptInterface(bridge, "AndroidTV");
        web.setBackgroundColor(Color.BLACK);
        web.loadUrl(PAGE + query);
        return web;
    }
}
