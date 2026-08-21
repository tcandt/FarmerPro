package com.famerpro.agent.telemetry

data class TelemetrySnapshot(
    val captureFps: Int,
    val encodeFps: Int,
    val bitrateKbps: Int,
    val droppedFrames: Long,
    val controlQueueDepth: Int,
    val reconnectCount: Int,
)

class TelemetryCollector {
    fun snapshot(): TelemetrySnapshot {
        return TelemetrySnapshot(
            captureFps = 0,
            encodeFps = 0,
            bitrateKbps = 0,
            droppedFrames = 0,
            controlQueueDepth = 0,
            reconnectCount = 0,
        )
    }
}
