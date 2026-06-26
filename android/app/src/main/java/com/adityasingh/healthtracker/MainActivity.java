package com.adityasingh.healthtracker;

import android.os.Bundle;
import android.graphics.Color;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register our custom Capacitor plugin BEFORE super.onCreate so the
        // bridge knows about it when the WebView is initialised.
        registerPlugin(NyxStatusBarPlugin.class);

        super.onCreate(savedInstanceState);

        // Edge-to-edge: WebView draws under the status bar
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        // Transparent status bar -- page content shows through
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        // Default to white icons (dark theme is boot default). NyxStatusBar
        // plugin flips this once the React theme resolves.
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView())
            .setAppearanceLightStatusBars(false);
    }
}
