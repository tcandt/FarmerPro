package com.famerpro.agent.control

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class AccessibilityInputExecutor(
    private val serviceProvider: () -> AccessibilityService?,
) : InputExecutor {
    private val gestureSessions = GestureSessionStore()

    override suspend fun execute(command: ControlCommand): ExecutionResult {
        val service = serviceProvider()
            ?: return ExecutionResult(command.commandId, accepted = false, reason = "accessibility_service_unavailable")

        return when (command.type) {
            ControlType.DOWN -> gestureSessions.down(service, command)
            ControlType.MOVE -> gestureSessions.move(service, command)
            ControlType.UP -> gestureSessions.up(service, command)
            ControlType.BACK -> global(service, command, AccessibilityService.GLOBAL_ACTION_BACK)
            ControlType.HOME -> global(service, command, AccessibilityService.GLOBAL_ACTION_HOME)
            ControlType.RECENT -> global(service, command, AccessibilityService.GLOBAL_ACTION_RECENTS)
            else -> ExecutionResult(command.commandId, accepted = false, reason = "unsupported_command")
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

private class GestureSessionStore {
    private val mutex = Mutex()
    private val sessions = mutableMapOf<Int, GestureSession>()

    suspend fun down(service: AccessibilityService, command: ControlCommand): ExecutionResult =
        mutex.withLock {
            if (sessions.containsKey(command.pointerId)) {
                return ExecutionResult(command.commandId, accepted = false, reason = "gesture_session_exists")
            }
            val point = command.toScreenPoint(service)
            val stroke = newStroke(point, willContinue = true)
            sessions[command.pointerId] = GestureSession(point.x, point.y, stroke)
            dispatch(service, command, stroke)
        }

    suspend fun move(service: AccessibilityService, command: ControlCommand): ExecutionResult =
        mutex.withLock {
            val session = sessions[command.pointerId]
                ?: return ExecutionResult(command.commandId, accepted = false, reason = "gesture_session_missing")
            val point = command.toScreenPoint(service)
            val stroke = session.stroke.continueStroke(
                pathFrom(session.x, session.y, point.x, point.y),
                0,
                16,
                true,
            )
            sessions[command.pointerId] = GestureSession(point.x, point.y, stroke)
            dispatch(service, command, stroke)
        }

    suspend fun up(service: AccessibilityService, command: ControlCommand): ExecutionResult =
        mutex.withLock {
            val session = sessions.remove(command.pointerId)
                ?: return ExecutionResult(command.commandId, accepted = false, reason = "gesture_session_missing")
            val point = command.toScreenPoint(service)
            val stroke = session.stroke.continueStroke(
                pathFrom(session.x, session.y, point.x, point.y),
                0,
                16,
                false,
            )
            dispatch(service, command, stroke)
        }

    private suspend fun dispatch(
        service: AccessibilityService,
        command: ControlCommand,
        stroke: GestureDescription.StrokeDescription,
    ): ExecutionResult {
        val gesture = GestureDescription.Builder().addStroke(stroke).build()
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

    private fun newStroke(
        point: ScreenPoint,
        willContinue: Boolean,
    ): GestureDescription.StrokeDescription =
        GestureDescription.StrokeDescription(pathAt(point.x, point.y), 0, 16, willContinue)
}

private data class GestureSession(
    val x: Float,
    val y: Float,
    val stroke: GestureDescription.StrokeDescription,
)

private data class ScreenPoint(val x: Float, val y: Float)

private fun ControlCommand.toScreenPoint(service: AccessibilityService): ScreenPoint {
    val metrics = service.resources.displayMetrics
    return ScreenPoint(
        x = xNorm * metrics.widthPixels,
        y = yNorm * metrics.heightPixels,
    )
}

private fun pathAt(x: Float, y: Float): Path =
    Path().apply { moveTo(x, y) }

private fun pathFrom(startX: Float, startY: Float, endX: Float, endY: Float): Path =
    Path().apply {
        moveTo(startX, startY)
        lineTo(endX, endY)
    }
