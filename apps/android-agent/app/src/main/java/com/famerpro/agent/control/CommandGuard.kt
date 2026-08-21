package com.famerpro.agent.control

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class CommandGuard(
    private val duplicateWindow: Int = 512,
) {
    private val mutex = Mutex()
    private var currentEpoch: String? = null
    private var lastAcceptedSequence: Long = 0
    private val acceptedIds = ArrayDeque<String>()
    private val acceptedIdSet = mutableSetOf<String>()
    private val staleEpochs = mutableSetOf<String>()

    suspend fun accept(command: ControlCommand, expectedSessionId: String): GuardResult = mutex.withLock {
        if (command.sessionId != expectedSessionId) {
            return@withLock GuardResult.Rejected("stale_session")
        }
        if (command.controlEpoch.isBlank()) {
            return@withLock GuardResult.Rejected("missing_control_epoch")
        }
        val epoch = currentEpoch
        if (epoch == null) {
            currentEpoch = command.controlEpoch
        } else if (command.controlEpoch != epoch) {
            if (staleEpochs.contains(command.controlEpoch)) {
                return@withLock GuardResult.Rejected("stale_epoch")
            }
            staleEpochs.add(epoch)
            currentEpoch = command.controlEpoch
            lastAcceptedSequence = 0
            acceptedIds.clear()
            acceptedIdSet.clear()
        }
        if (acceptedIdSet.contains(command.commandId)) {
            return@withLock GuardResult.Rejected("duplicate_command")
        }
        if (command.sequence <= lastAcceptedSequence) {
            return@withLock GuardResult.Rejected("stale_sequence")
        }

        lastAcceptedSequence = command.sequence
        remember(command.commandId)
        return@withLock GuardResult.Accepted
    }

    private fun remember(commandId: String) {
        acceptedIds.addLast(commandId)
        acceptedIdSet.add(commandId)
        while (acceptedIds.size > duplicateWindow) {
            acceptedIdSet.remove(acceptedIds.removeFirst())
        }
    }
}

sealed class GuardResult {
    data object Accepted : GuardResult()
    data class Rejected(val reason: String) : GuardResult()
}
