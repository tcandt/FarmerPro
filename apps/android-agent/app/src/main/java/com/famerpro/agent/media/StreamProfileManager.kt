package com.famerpro.agent.media

enum class StreamProfile {
    THUMB_ECO,
    THUMB_STD,
    ACTIVE,
    ACTIVE_60,
}

class StreamProfileManager {
    fun resolve(selected: Boolean, supports60Fps: Boolean): StreamProfile {
        if (!selected) return StreamProfile.THUMB_STD
        return if (supports60Fps) StreamProfile.ACTIVE_60 else StreamProfile.ACTIVE
    }

    fun parse(name: String): StreamProfile =
        StreamProfile.entries.firstOrNull { it.name == name } ?: StreamProfile.THUMB_STD
}
