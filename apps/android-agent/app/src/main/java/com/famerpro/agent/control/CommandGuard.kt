package com.famerpro.agent.control

class CommandGuard(
    private val duplicateWindow: Int = 512,
) {
    private var lastAcceptedSequence: Long = 0
    private val acceptedIds = ArrayDeque<String>()
    private val acceptedIdSet = mutableSetOf<String>()

    fun accept(command: ControlCommand): GuardResult {
        if (acceptedIdSet.contains(command.commandId)) {
            return GuardResult.Rejected("duplicate_command")
        }
        if (command.sequence <= lastAcceptedSequence) {
            return GuardResult.Rejected("stale_sequence")
        }

        lastAcceptedSequence = command.sequence
        remember(command.commandId)
        return GuardResult.Accepted
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
