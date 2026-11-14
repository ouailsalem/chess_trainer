package io.github.ouailsalem.chesstrainer;

import android.net.Uri;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

/* Lichess sends the browser back to io.github.ouailsalem.chesstrainer://oauth?code=...
   The WebView cannot open that address, so we catch it and load the app itself with the same ?code=... */
@CapacitorPlugin(name = "AuthReturn")
public class AuthPlugin extends Plugin {
    @Override
    public Boolean shouldOverrideLoad(Uri url) {
        if (url == null) return null;
        boolean ours = "io.github.ouailsalem.chesstrainer".equals(url.getScheme())
            || ("localhost".equals(url.getHost()) && url.getQueryParameter("code") != null && url.getQueryParameter("state") != null);
        if (!ours) return null;
        String q = url.getEncodedQuery();
        final String target = getBridge().getLocalUrl() + "/?" + (q == null ? "" : q);
        getBridge().executeOnMainThread(() -> getBridge().getWebView().loadUrl(target));
        return true;
    }
}
