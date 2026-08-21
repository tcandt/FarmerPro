package com.famerpro.agent.control

class ControlClient(
    private val queue: CommandQueue,
) {
    suspend fun onCommand(command: ControlCommand) {
        queue.offer(command)
    }
}
