package com.famerpro.agent.device

data class DeviceIdentity(
    val deviceId: String,
    val model: String,
    val manufacturer: String,
    val androidApi: Int,
    val appVersion: String,
)
