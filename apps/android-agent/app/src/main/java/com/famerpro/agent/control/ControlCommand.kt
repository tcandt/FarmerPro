package com.famerpro.agent.control

enum class ControlType {
    DOWN,
    MOVE,
    UP,
    BACK,
    HOME,
    RECENT,
    PROFILE_CHANGE,
}

data class ControlCommand(
    val commandId: String,
    val sequence: Long,
    val groupId: String?,
    val type: ControlType,
    val xNorm: Float,
    val yNorm: Float,
    val pointerId: Int,
    val executeAtMono: Long,
) {
    val reliable: Boolean
        get() = type != ControlType.MOVE
}
