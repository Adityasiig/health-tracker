package com.adityasingh.healthtracker;

import android.os.Bundle;
import android.graphics.Color;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Edge-to-edge: WebView draws under the status bar
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        // Transparent status bar -- page content shows through (Zomato/Blinkit pattern)
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        // White system icons on dark page
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView())
            .setAppearanceLightStatusBars(false);
    }
}
