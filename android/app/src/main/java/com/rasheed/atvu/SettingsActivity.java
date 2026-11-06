package com.rasheed.atvu;

import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebView;

/** The app's icon: the page with its settings panel open. Back closes the panel, then the app. */
public class SettingsActivity extends Activity {
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = WebHost.create(this, "?settings=1");
        setContentView(web);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getKeyCode() == KeyEvent.KEYCODE_BACK && event.getAction() == KeyEvent.ACTION_UP) {
            // Ask the page whether its panel was open; if it was, the page closes it, else leave the app.
            web.evaluateJavascript("window.ATVU && ATVU.back ? ATVU.back() : false", value -> {
                if (!"true".equals(value)) finish();
            });
            return true;
        }
        if (event.getKeyCode() == KeyEvent.KEYCODE_BACK) return true;
        return super.dispatchKeyEvent(event);
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
