package com.famerpro.agent.media

class CaptureController {
    var state: CaptureState = CaptureState.STOPPED
        private set

    fun start(profile: StreamProfile) {
        state = CaptureState.STARTING
        // MediaProjection permission + ScreenCapturer wiring is the next implementation gate.
        state = CaptureState.RUNNING(profile)
    }

    fun stop() {
        state = CaptureState.STOPPED
    }
}

sealed class CaptureState {
    data object STOPPED : CaptureState()
    data object STARTING : CaptureState()
    data class RUNNING(val profile: StreamProfile) : CaptureState()
}
