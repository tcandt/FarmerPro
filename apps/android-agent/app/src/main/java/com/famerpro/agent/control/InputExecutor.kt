package com.famerpro.agent.control

interface InputExecutor {
    suspend fun execute(command: ControlCommand): ExecutionResult
}

data class ExecutionResult(
    val commandId: String,
    val accepted: Boolean,
    val reason: String? = null,
)
