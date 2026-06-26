package com.adityasingh.healthtracker

import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
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
    fun checkStepsPermission(call: PluginCall) {
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
    fun requestStepsPermission(call: PluginCall) {
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

    /**
     * Reads daily step totals for the past N days (inclusive of today).
     * Returns an array ordered oldest -> newest with zero-fill for missing days.
     *
     * JS: const { days } = await HC.getStepsHistory({ days: 30 });
     *     // [{ date: '2026-05-28', steps: 0 }, ..., { date: '2026-06-26', steps: 4321 }]
     */
    @PluginMethod
    fun getStepsHistory(call: PluginCall) {
        val days = (call.getInt("days") ?: 30).coerceIn(1, 365)
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = HealthConnectClient.getOrCreate(context)
                val zoneId = ZoneId.systemDefault()
                val today = LocalDate.now()
                val start = today.minusDays((days - 1).toLong())
                    .atStartOfDay(zoneId).toInstant()
                val end = today.plusDays(1).atStartOfDay(zoneId).toInstant()

                val response = client.readRecords(
                    ReadRecordsRequest(
                        recordType = StepsRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(start, end)
                    )
                )

                // Bucket records by local date (use startTime's date)
                val perDay = mutableMapOf<String, Long>()
                response.records.forEach { record ->
                    val key = record.startTime.atZone(zoneId).toLocalDate().toString()
                    perDay[key] = (perDay[key] ?: 0L) + record.count
                }

                // Build oldest -> newest array, zero-fill missing days
                val arr = JSArray()
                for (i in 0 until days) {
                    val d = today.minusDays((days - 1 - i).toLong()).toString()
                    val item = JSObject()
                    item.put("date", d)
                    item.put("steps", perDay[d] ?: 0L)
                    arr.put(item)
                }
                val resp = JSObject()
                resp.put("days", arr)
                resp.put("recordCount", response.records.size)
                call.resolve(resp)
            } catch (e: Exception) {
                call.reject("Failed to read steps history: ${e.message}")
            }
        }
    }
}
