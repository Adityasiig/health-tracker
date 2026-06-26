package com.adityasingh.healthtracker;

import android.os.Bundle;
import android.graphics.Color;
import android.webkit.JavascriptInterface;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Edge-to-edge: WebView draws under the status bar
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        // Transparent status bar -- page content shows through
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        // Default to light/white icons (dark theme is the default boot state)
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView())
            .setAppearanceLightStatusBars(false);

        // Expose direct native status bar control to JS as window.NyxStatusBar.
        // Bypasses @capacitor/status-bar which has edge-to-edge mode issues in v7.
        getBridge().getWebView().addJavascriptInterface(
            new NyxStatusBarBridge(), "NyxStatusBar"
        );
    }

    public class NyxStatusBarBridge {
        /**
         * Set status bar appearance from JS.
         *   light=true  -> dark icons (for LIGHT page bg)
         *   light=false -> white icons (for DARK page bg)
         */
        @JavascriptInterface
        public void setLight(boolean light) {
            runOnUiThread(() -> {
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView())
                    .setAppearanceLightStatusBars(light);
            });
        }
    }
}
