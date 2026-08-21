package com.famerpro.agent

import android.app.Application
import android.provider.Settings
import com.famerpro.agent.control.AccessibilityInputExecutor
import com.famerpro.agent.control.CommandQueue
import com.famerpro.agent.control.CommandScheduler
import com.famerpro.agent.control.ControlClient
import com.famerpro.agent.control.FamerProAccessibilityService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class FamerProApplication : Application() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    override fun onCreate() {
        super.onCreate()

        val queue = CommandQueue()
        val executor = AccessibilityInputExecutor { FamerProAccessibilityService.activeService }
        val scheduler = CommandScheduler(executor)
        val client = ControlClient(
            serverWsUrl = BuildConfig.CONTROL_WS_URL,
            deviceId = stableDeviceId(),
            queue = queue,
            scope = scope,
        )

        scope.launch {
            scheduler.run(queue)
        }
        client.start()
    }

    private fun stableDeviceId(): String {
        val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        return "android-$androidId"
    }
}
