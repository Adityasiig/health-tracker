package com.adityasingh.healthtracker

import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.ZoneId

/**
 * Direct bridge to Android's Health Connect API.
 *
 * JS usage:
 *   const HC = registerPlugin<NyxHealthConnect>('NyxHealthConnect');
 *   const { available } = await HC.isAvailable();
 *   const { granted } = await HC.requestPermissions();
 *   const { steps } = await HC.getTodaySteps();
 */
@CapacitorPlugin(name = "NyxHealthConnect")
class NyxHealthConnectPlugin : Plugin() {

    private val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class)
    )

    /** Returns whether the Health Connect SDK is usable on this device. */
    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val status = HealthConnectClient.getSdkStatus(context)
        val result = JSObject()
        result.put("available", status == HealthConnectClient.SDK_AVAILABLE)
        // 1 = SDK_UNAVAILABLE, 2 = SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED, 3 = SDK_AVAILABLE
        result.put("status", status)
        call.resolve(result)
    }

    /** Reports whether READ_STEPS has already been granted. */
    @PluginMethod
    fun hasPermissions(call: PluginCall) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = HealthConnectClient.getOrCreate(context)
                val granted = client.permissionController.getGrantedPermissions()
                val resp = JSObject()
                resp.put("granted", granted.containsAll(permissions))
                call.resolve(resp)
            } catch (e: Exception) {
                call.reject("Health Connect not available: ${e.message}")
            }
        }
    }

    /** Launches the Health Connect permission rationale screen. */
    @PluginMethod
    fun requestPermissions(call: PluginCall) {
        try {
            val contract = PermissionController.createRequestPermissionResultContract()
            val intent = contract.createIntent(context, permissions)
            startActivityForResult(call, intent, "handlePermissionResult")
        } catch (e: Exception) {
            call.reject("Failed to start permission flow: ${e.message}")
        }
    }

    @ActivityCallback
    fun handlePermissionResult(call: PluginCall, result: ActivityResult) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = HealthConnectClient.getOrCreate(context)
                val granted = client.permissionController.getGrantedPermissions()
                val resp = JSObject()
                resp.put("granted", granted.containsAll(permissions))
                call.resolve(resp)
            } catch (e: Exception) {
                call.reject("Permission check failed: ${e.message}")
            }
        }
    }

    /** Reads today's step count from Health Connect. Requires READ_STEPS. */
    @PluginMethod
    fun getTodaySteps(call: PluginCall) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = HealthConnectClient.getOrCreate(context)
                val today = LocalDate.now()
                val zoneId = ZoneId.systemDefault()
                val start = today.atStartOfDay(zoneId).toInstant()
                val end = today.plusDays(1).atStartOfDay(zoneId).toInstant()

                val response = client.readRecords(
                    ReadRecordsRequest(
                        recordType = StepsRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(start, end)
                    )
                )
                val totalSteps = response.records.sumOf { it.count }

                val resp = JSObject()
                resp.put("steps", totalSteps)
                resp.put("date", today.toString())
                resp.put("recordCount", response.records.size)
                call.resolve(resp)
            } catch (e: Exception) {
                call.reject("Failed to read steps: ${e.message}")
            }
        }
    }
}
