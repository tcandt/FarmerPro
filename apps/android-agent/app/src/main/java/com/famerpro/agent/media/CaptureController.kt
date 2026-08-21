package com.famerpro.agent.media

class CaptureController {
    var state: CaptureState = CaptureState.STOPPED
        private set

    fun requestStart(profile: StreamProfile): CaptureState {
        state = CaptureState.PERMISSION_REQUIRED(profile)
        return state
    }

    fun markStarting(profile: StreamProfile) {
        state = CaptureState.STARTING(profile)
    }

    fun markCapturing(profile: StreamProfile) {
        state = CaptureState.CAPTURING(profile)
    }

    fun markPublishing(profile: StreamProfile) {
        state = CaptureState.PUBLISHING(profile)
    }

    fun markRunning(profile: StreamProfile) {
        state = CaptureState.RUNNING(profile)
    }

    fun stop() {
        state = CaptureState.STOPPED
    }
}

sealed class CaptureState {
    data object STOPPED : CaptureState()
    data class PERMISSION_REQUIRED(val profile: StreamProfile) : CaptureState()
    data class STARTING(val profile: StreamProfile) : CaptureState()
    data class CAPTURING(val profile: StreamProfile) : CaptureState()
    data class PUBLISHING(val profile: StreamProfile) : CaptureState()
    data class RUNNING(val profile: StreamProfile) : CaptureState()
}
