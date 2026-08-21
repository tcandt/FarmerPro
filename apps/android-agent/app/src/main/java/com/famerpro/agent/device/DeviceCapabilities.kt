package com.famerpro.agent.device

data class DeviceCapabilities(
    val displayWidth: Int,
    val displayHeight: Int,
    val densityDpi: Int,
    val maxRefreshRate: Float,
    val supportsAvc: Boolean,
    val encoderProfiles: List<EncoderProfile>,
)

data class EncoderProfile(
    val width: Int,
    val height: Int,
    val fps: Int,
    val bitrateKbps: Int,
    val supported: Boolean,
)
