package com.famerpro.agent.control

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class AccessibilityInputExecutor(
    private val serviceProvider: () -> AccessibilityService?,
) : InputExecutor {
    override suspend fun execute(command: ControlCommand): ExecutionResult {
        val service = serviceProvider()
            ?: return ExecutionResult(command.commandId, accepted = false, reason = "accessibility_service_unavailable")

        return when (command.type) {
            ControlType.DOWN,
            ControlType.MOVE,
            ControlType.UP -> dispatchPointer(service, command)
            ControlType.BACK -> global(service, command, AccessibilityService.GLOBAL_ACTION_BACK)
            ControlType.HOME -> global(service, command, AccessibilityService.GLOBAL_ACTION_HOME)
            ControlType.RECENT -> global(service, command, AccessibilityService.GLOBAL_ACTION_RECENTS)
            else -> ExecutionResult(command.commandId, accepted = false, reason = "unsupported_command")
        }
    }

    private suspend fun dispatchPointer(
        service: AccessibilityService,
        command: ControlCommand,
    ): ExecutionResult {
        val metrics = service.resources.displayMetrics
        val x = command.xNorm * metrics.widthPixels
        val y = command.yNorm * metrics.heightPixels
        val path = Path().apply { moveTo(x, y) }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 1))
            .build()

        return suspendCancellableCoroutine { continuation ->
            val accepted = service.dispatchGesture(
                gesture,
                object : AccessibilityService.GestureResultCallback() {
                    override fun onCompleted(gestureDescription: GestureDescription?) {
                        if (continuation.isActive) {
                            continuation.resume(ExecutionResult(command.commandId, accepted = true))
                        }
                    }

                    override fun onCancelled(gestureDescription: GestureDescription?) {
                        if (continuation.isActive) {
                            continuation.resume(ExecutionResult(command.commandId, accepted = false, reason = "gesture_cancelled"))
                        }
                    }
                },
                null,
            )
            if (!accepted && continuation.isActive) {
                continuation.resume(ExecutionResult(command.commandId, accepted = false, reason = "dispatch_rejected"))
            }
        }
    }

    private fun global(
        service: AccessibilityService,
        command: ControlCommand,
        action: Int,
    ): ExecutionResult {
        val accepted = service.performGlobalAction(action)
        return ExecutionResult(command.commandId, accepted = accepted, reason = if (accepted) null else "global_action_rejected")
    }
}
