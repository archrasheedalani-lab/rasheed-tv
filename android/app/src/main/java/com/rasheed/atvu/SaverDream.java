package com.rasheed.atvu;

import android.service.dreams.DreamService;
import android.webkit.WebView;

/** The screensaver: the page full screen. Any key on the remote ends it. */
public class SaverDream extends DreamService {
    private WebView web;

    @Override
    public void onAttachedToWindow() {
        super.onAttachedToWindow();
        setInteractive(false);
        setFullscreen(true);
        setScreenBright(true);
        web = WebHost.create(this, "");
        setContentView(web);
    }

    @Override
    public void onDetachedFromWindow() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDetachedFromWindow();
    }
}
