package com.famerpro.agent.control

import org.junit.Assert.assertTrue
import org.junit.Test

class CommandGuardTest {
    @Test
    fun rejectsDuplicateCommandId() {
        val guard = CommandGuard()
        val command = command("cmd-1", sequence = 1)

        assertTrue(guard.accept(command) is GuardResult.Accepted)
        assertTrue(guard.accept(command.copy(sequence = 2)) is GuardResult.Rejected)
    }

    @Test
    fun rejectsSequenceRegression() {
        val guard = CommandGuard()

        assertTrue(guard.accept(command("cmd-1", sequence = 10)) is GuardResult.Accepted)
        assertTrue(guard.accept(command("cmd-2", sequence = 9)) is GuardResult.Rejected)
    }

    private fun command(commandId: String, sequence: Long): ControlCommand =
        ControlCommand(
            commandId = commandId,
            sequence = sequence,
            groupId = null,
            deviceId = "device-01",
            type = ControlType.DOWN,
            xNorm = 0.5f,
            yNorm = 0.5f,
            pointerId = 1,
            gatewayAtMono = 0,
            executeAtMono = 0,
        )
}
