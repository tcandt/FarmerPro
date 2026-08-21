package com.famerpro.agent.control

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
import java.util.UUID
import java.util.concurrent.TimeUnit

class ControlClient(
    private val serverWsUrl: String,
    private val deviceId: String,
    private val queue: CommandQueue,
    private val client: OkHttpClient = OkHttpClient.Builder()
        .pingInterval(10, TimeUnit.SECONDS)
        .build(),
    private val scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO),
    private val guard: CommandGuard = CommandGuard(),
) {
    @Volatile
    private var stopped = false
    private var webSocket: WebSocket? = null

    fun start() {
        stopped = false
        connect()
    }

    fun stop() {
        stopped = true
        webSocket?.close(1000, "agent stopped")
        webSocket = null
    }

    private fun connect() {
        val url = buildAgentUrl()
        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, Listener())
    }

    private fun scheduleReconnect() {
        if (stopped) return
        scope.launch {
            delay(1_000)
            if (!stopped) connect()
        }
    }

    private fun buildAgentUrl(): String {
        val sessionId = UUID.randomUUID().toString()
        return "$serverWsUrl?deviceId=$deviceId&sessionId=$sessionId&protocolVersion=v1&agentVersion=0.1.0"
    }

    private inner class Listener : WebSocketListener() {
        override fun onMessage(webSocket: WebSocket, text: String) {
            enqueue(text)
        }

        override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
            enqueue(bytes.utf8())
        }

        override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
            scheduleReconnect()
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            scheduleReconnect()
        }

        private fun enqueue(payload: String) {
            val command = runCatching { ControlWireCodec.decode(payload) }.getOrNull() ?: return
            scope.launch {
                when (guard.accept(command)) {
                    GuardResult.Accepted -> queue.offer(command)
                    is GuardResult.Rejected -> Unit
                }
            }
        }
    }
}
