package com.famerpro.agent.control

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertTrue
import org.junit.Test

class CommandGuardTest {
    @Test
    fun rejectsDuplicateCommandId() = runBlocking {
        val guard = CommandGuard()
        val command = command("cmd-1", sequence = 1)

        assertTrue(guard.accept(command, "session-A") is GuardResult.Accepted)
        assertTrue(guard.accept(command.copy(sequence = 2), "session-A") is GuardResult.Rejected)
    }

    @Test
    fun rejectsSequenceRegression() = runBlocking {
        val guard = CommandGuard()

        assertTrue(guard.accept(command("cmd-1", sequence = 10), "session-A") is GuardResult.Accepted)
        assertTrue(guard.accept(command("cmd-2", sequence = 9), "session-A") is GuardResult.Rejected)
    }

    @Test
    fun rejectsEqualSequenceWithDifferentCommandId() = runBlocking {
        val guard = CommandGuard()

        assertTrue(guard.accept(command("cmd-1", sequence = 10), "session-A") is GuardResult.Accepted)
        assertTrue(guard.accept(command("cmd-2", sequence = 10), "session-A") is GuardResult.Rejected)
    }

    @Test
    fun acceptsIncreasingSequence() = runBlocking {
        val guard = CommandGuard()

        assertTrue(guard.accept(command("cmd-1", sequence = 10), "session-A") is GuardResult.Accepted)
        assertTrue(guard.accept(command("cmd-2", sequence = 11), "session-A") is GuardResult.Accepted)
    }

    @Test
    fun duplicateIdDoesNotAdvanceSequence() = runBlocking {
        val guard = CommandGuard()

        assertTrue(guard.accept(command("cmd-A", sequence = 10), "session-A") is GuardResult.Accepted)
        assertTrue(guard.accept(command("cmd-B", sequence = 11), "session-A") is GuardResult.Accepted)
        assertTrue(guard.accept(command("cmd-A", sequence = 12), "session-A") is GuardResult.Rejected)
        assertTrue(guard.accept(command("cmd-C", sequence = 12), "session-A") is GuardResult.Accepted)
    }

    @Test
    fun resetsSequenceForNewEpochAndRejectsOldEpoch() = runBlocking {
        val guard = CommandGuard()

        assertTrue(guard.accept(command("cmd-A1", sequence = 1, epoch = "epoch-A"), "session-A") is GuardResult.Accepted)
        assertTrue(guard.accept(command("cmd-A2", sequence = 2, epoch = "epoch-A"), "session-A") is GuardResult.Accepted)
        assertTrue(guard.accept(command("cmd-A3", sequence = 2, epoch = "epoch-A"), "session-A") is GuardResult.Rejected)
        assertTrue(guard.accept(command("cmd-B1", sequence = 1, epoch = "epoch-B"), "session-A") is GuardResult.Accepted)
        assertTrue(guard.accept(command("cmd-A4", sequence = 10_000, epoch = "epoch-A"), "session-A") is GuardResult.Rejected)
    }

    @Test
    fun rejectsStaleSession() = runBlocking {
        val guard = CommandGuard()

        assertTrue(guard.accept(command("cmd-1", sequence = 1, sessionId = "session-old"), "session-new") is GuardResult.Rejected)
    }

    @Test
    fun evictsOldDuplicateIdsAfterWindow() = runBlocking {
        val guard = CommandGuard(duplicateWindow = 2)

        assertTrue(guard.accept(command("cmd-1", sequence = 1), "session-A") is GuardResult.Accepted)
        assertTrue(guard.accept(command("cmd-2", sequence = 2), "session-A") is GuardResult.Accepted)
        assertTrue(guard.accept(command("cmd-3", sequence = 3), "session-A") is GuardResult.Accepted)
        assertTrue(guard.accept(command("cmd-1", sequence = 4), "session-A") is GuardResult.Accepted)
    }

    private fun command(
        commandId: String,
        sequence: Long,
        epoch: String = "epoch-A",
        sessionId: String = "session-A",
    ): ControlCommand =
        ControlCommand(
            commandId = commandId,
            sequence = sequence,
            controlEpoch = epoch,
            sessionId = sessionId,
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
