package com.famerpro.agent.control

import kotlinx.coroutines.delay

class CommandScheduler(
    private val executor: InputExecutor,
) {
    suspend fun run(queue: CommandQueue) {
        while (true) {
            val command = queue.next()
            val waitMs = ((command.executeAtMono - System.nanoTime()) / 1_000_000).coerceAtLeast(0)
            if (waitMs > 0) delay(waitMs)
            executor.execute(command)
        }
    }
}
