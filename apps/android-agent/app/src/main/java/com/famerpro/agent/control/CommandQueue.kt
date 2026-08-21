package com.famerpro.agent.control

import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class CommandQueue(
    capacity: Int = 128,
) {
    private val reliable = Channel<ControlCommand>(capacity)
    private val moveMutex = Mutex()
    private var latestMove: ControlCommand? = null

    suspend fun offer(command: ControlCommand) {
        if (command.type == ControlType.MOVE) {
            moveMutex.withLock {
                latestMove = command
            }
            return
        }

        reliable.send(command)
    }

    suspend fun next(): ControlCommand {
        val move = moveMutex.withLock {
            val command = latestMove
            latestMove = null
            command
        }

        return move ?: reliable.receive()
    }
}
