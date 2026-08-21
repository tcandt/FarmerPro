package com.famerpro.agent.media

class RtcPublisher {
    var currentSession: MediaSession? = null
        private set

    fun publish(session: MediaSession) {
        currentSession = session
        // PeerConnection + SDP answer generation belongs here after WebRTC dependency selection.
    }

    fun stop() {
        currentSession = null
    }
}

data class MediaSession(
    val sessionId: String,
    val deviceId: String,
    val profile: StreamProfile,
    val state: String,
)
