package com.rasheed.atvu;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebView;

/** The home screen: the page in home mode, with the apps row. Back never leaves it; Home brings it to the start. */
public class HomeActivity extends Activity {
    private WebView web;

    @SuppressLint("AddJavascriptInterface")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = WebHost.create(this, "?mode=home", new AppsBridge(this));
        setContentView(web);
    }

    @Override
    protected void onResume() {
        super.onResume();
        // The remote's keys go to the page from the first press, not only after one press to focus it.
        web.requestFocus();
        // Apps may have been installed or removed while another app was open.
        web.evaluateJavascript("window.ATVU_HOME && ATVU_HOME.refresh()", null);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Home pressed while already home: close any panel and go back to the first app.
        web.evaluateJavascript("window.ATVU_HOME && ATVU_HOME.reset()", null);
    }

    // OK held down: Android repeats the key, but the page doesn't see those repeats, so tell it here and
    // keep the release from the page (it would open the app the arrange mode just picked up).
    private boolean okHeld;

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int code = event.getKeyCode();
        if (code == KeyEvent.KEYCODE_DPAD_CENTER || code == KeyEvent.KEYCODE_ENTER) {
            if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() > 0) {
                if (!okHeld) {
                    okHeld = true;
                    web.evaluateJavascript("window.ATVU_HOME && ATVU_HOME.longPress()", null);
                }
                return true;
            }
            if (event.getAction() == KeyEvent.ACTION_UP && okHeld) {
                okHeld = false;
                return true;
            }
        }
        if (code == KeyEvent.KEYCODE_BACK) {
            if (event.getAction() == KeyEvent.ACTION_UP) {
                web.evaluateJavascript("window.ATVU && ATVU.back ? ATVU.back() : false", null);
            }
            return true; // a home screen has nowhere to go back to
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
