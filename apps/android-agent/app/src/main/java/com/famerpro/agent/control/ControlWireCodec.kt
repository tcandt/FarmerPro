package com.famerpro.agent.control

import org.json.JSONObject

object ControlWireCodec {
    fun decode(payload: String): ControlCommand {
        val json = JSONObject(payload)
        return ControlCommand(
            commandId = json.getString("commandId"),
            sequence = json.optLong("sequence", 0),
            controlEpoch = json.optString("controlEpoch"),
            sessionId = json.optString("sessionId"),
            groupId = json.optString("groupId").ifBlank { null },
            deviceId = json.getString("deviceId"),
            type = decodeType(json.optInt("type", 0)),
            xNorm = json.optDouble("xNorm", 0.0).toFloat().coerceIn(0f, 1f),
            yNorm = json.optDouble("yNorm", 0.0).toFloat().coerceIn(0f, 1f),
            pointerId = json.optInt("pointerId", 0),
            gatewayAtMono = json.optLong("gatewayAtMono", 0),
            executeAtMono = json.optLong("executeAtMono", 0),
        )
    }

    private fun decodeType(value: Int): ControlType =
        ControlType.entries.getOrElse(value) { ControlType.UNKNOWN }
}
