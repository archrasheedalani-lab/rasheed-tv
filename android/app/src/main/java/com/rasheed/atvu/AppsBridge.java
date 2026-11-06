package com.rasheed.atvu;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.provider.Settings;
import android.util.Base64;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * What the home page can ask Android for, as window.AndroidTV: the installed apps, their banner or icon,
 * and opening one. Only the home screen adds it, and that WebView only loads this app's own page.
 */
final class AppsBridge {
    private final Activity activity;
    private final PackageManager pm;
    private final Map<String, ResolveInfo> apps = new LinkedHashMap<>();

    AppsBridge(Activity activity) {
        this.activity = activity;
        this.pm = activity.getPackageManager();
    }

    /** Every app that can be opened: TV apps first, then phone apps (each package once). */
    @JavascriptInterface
    public String getApps() {
        apps.clear();
        collect(Intent.CATEGORY_LEANBACK_LAUNCHER);
        collect(Intent.CATEGORY_LAUNCHER);
        JSONArray out = new JSONArray();
        try {
            for (Map.Entry<String, ResolveInfo> e : apps.entrySet()) {
                ResolveInfo ri = e.getValue();
                out.put(new JSONObject()
                        .put("pkg", e.getKey())
                        .put("label", String.valueOf(ri.loadLabel(pm)))
                        .put("banner", ri.activityInfo.loadBanner(pm) != null
                                || ri.activityInfo.applicationInfo.loadBanner(pm) != null));
            }
        } catch (JSONException ignored) {
            // Labels are plain strings; nothing here can fail.
        }
        return out.toString();
    }

    private void collect(String category) {
        Intent main = new Intent(Intent.ACTION_MAIN).addCategory(category);
        List<ResolveInfo> found = pm.queryIntentActivities(main, 0);
        for (ResolveInfo ri : found) {
            String pkg = ri.activityInfo.packageName;
            if (!apps.containsKey(pkg)) apps.put(pkg, ri);
        }
    }

    /** The app's TV banner (16:9) if it has one, else its icon, as a PNG data URL; "" if unknown. */
    @JavascriptInterface
    public String getIcon(String pkg) {
        ResolveInfo ri = apps.get(pkg);
        if (ri == null) return "";
        Drawable d = ri.activityInfo.loadBanner(pm);
        if (d == null) d = ri.activityInfo.applicationInfo.loadBanner(pm);
        if (d == null) d = ri.loadIcon(pm);
        return d == null ? "" : toDataUrl(d);
    }

    /** Opens an app by package name. */
    @JavascriptInterface
    public boolean launch(String pkg) {
        Intent i = pm.getLeanbackLaunchIntentForPackage(pkg);
        if (i == null) i = pm.getLaunchIntentForPackage(pkg);
        if (i == null) return false;
        return start(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    }

    /** Opens the TV's own settings. */
    @JavascriptInterface
    public boolean openSystemSettings() {
        return start(new Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    }

    private boolean start(Intent i) {
        try {
            activity.runOnUiThread(() -> {
                try {
                    activity.startActivity(i);
                } catch (ActivityNotFoundException ignored) {
                    // Uninstalled since the list was read: nothing to open.
                }
            });
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }

    private static String toDataUrl(Drawable d) {
        Bitmap bmp;
        if (d instanceof BitmapDrawable && ((BitmapDrawable) d).getBitmap() != null) {
            bmp = ((BitmapDrawable) d).getBitmap();
        } else {
            int w = Math.max(1, Math.min(d.getIntrinsicWidth() > 0 ? d.getIntrinsicWidth() : 192, 640));
            int h = Math.max(1, Math.min(d.getIntrinsicHeight() > 0 ? d.getIntrinsicHeight() : 192, 360));
            bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(bmp);
            d.setBounds(0, 0, w, h);
            d.draw(c);
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        bmp.compress(Bitmap.CompressFormat.PNG, 100, out);
        return "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
    }
}
