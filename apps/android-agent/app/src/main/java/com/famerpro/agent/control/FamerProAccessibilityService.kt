package com.famerpro.agent.control

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent

class FamerProAccessibilityService : AccessibilityService() {
    override fun onAccessibilityEvent(event: AccessibilityEvent?) = Unit

    override fun onInterrupt() = Unit
}
