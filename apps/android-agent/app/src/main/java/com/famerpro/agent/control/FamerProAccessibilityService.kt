package com.famerpro.agent.control

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent

class FamerProAccessibilityService : AccessibilityService() {
    override fun onServiceConnected() {
        activeService = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) = Unit

    override fun onInterrupt() = Unit

    override fun onDestroy() {
        if (activeService == this) {
            activeService = null
        }
        super.onDestroy()
    }

    companion object {
        @Volatile
        var activeService: FamerProAccessibilityService? = null
            private set
    }
}
