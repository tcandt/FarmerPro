package com.famerpro.agent.control

enum class ControlType {
    UNKNOWN,
    DOWN,
    MOVE,
    UP,
    BACK,
    HOME,
    RECENT,
    KEY,
    PROFILE_CHANGE,
    POWER,
    VOLUME_UP,
    VOLUME_DOWN,
    MUTE,
}

data class ControlCommand(
    val commandId: String,
    val sequence: Long,
    val groupId: String?,
    val deviceId: String,
    val type: ControlType,
    val xNorm: Float,
    val yNorm: Float,
    val pointerId: Int,
    val gatewayAtMono: Long,
    val executeAtMono: Long,
) {
    val reliable: Boolean
        get() = type != ControlType.MOVE
}
