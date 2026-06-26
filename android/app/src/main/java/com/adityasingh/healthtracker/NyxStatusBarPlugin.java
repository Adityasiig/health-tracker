package com.adityasingh.healthtracker;

import androidx.core.view.WindowCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Direct bridge to WindowInsetsControllerCompat.setAppearanceLightStatusBars.
 * Bypasses @capacitor/status-bar which fails in edge-to-edge mode.
 *
 * JS usage:
 *   import { registerPlugin } from '@capacitor/core';
 *   const NyxStatusBar = registerPlugin('NyxStatusBar');
 *   await NyxStatusBar.setLight({ light: true });   // dark icons, for light bg
 *   await NyxStatusBar.setLight({ light: false });  // light icons, for dark bg
 */
@CapacitorPlugin(name = "NyxStatusBar")
public class NyxStatusBarPlugin extends Plugin {
    @PluginMethod
    public void setLight(PluginCall call) {
        final boolean light = call.getBoolean("light", false);
        getActivity().runOnUiThread(() -> {
            WindowCompat.getInsetsController(
                getActivity().getWindow(),
                getActivity().getWindow().getDecorView()
            ).setAppearanceLightStatusBars(light);
        });
        call.resolve();
    }
}
