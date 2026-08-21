package com.famerpro.agent.control

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
import org.json.JSONObject
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
    @Volatile
    private var activeSessionId: String? = null
    private var webSocket: WebSocket? = null
    private val ingress = Channel<IngressMessage>(capacity = 512)

    init {
        scope.launch {
            for (message in ingress) {
                handleIngress(message)
            }
        }
    }

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
        val sessionId = UUID.randomUUID().toString()
        activeSessionId = sessionId
        val url = buildAgentUrl(sessionId)
        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, Listener(sessionId))
    }

    private fun scheduleReconnect() {
        if (stopped) return
        scope.launch {
            delay(1_000)
            if (!stopped) connect()
        }
    }

    private fun buildAgentUrl(sessionId: String): String {
        return "$serverWsUrl?deviceId=$deviceId&sessionId=$sessionId&protocolVersion=v1&agentVersion=0.1.0"
    }

    private suspend fun handleIngress(message: IngressMessage) {
        if (message.connectionSessionId != activeSessionId) {
            reject(message.webSocket, null, "stale_connection")
            return
        }
        val command = runCatching { ControlWireCodec.decode(message.payload) }.getOrNull() ?: return
        when (val result = guard.accept(command, message.connectionSessionId)) {
            GuardResult.Accepted -> queue.offer(command)
            is GuardResult.Rejected -> reject(message.webSocket, command.commandId, result.reason)
        }
    }

    private fun reject(webSocket: WebSocket, commandId: String?, reason: String) {
        val message = JSONObject()
            .put("type", "command_rejected")
            .put("commandId", commandId ?: "")
            .put("reason", reason)
        webSocket.send(message.toString())
    }

    private inner class Listener(
        private val connectionSessionId: String,
    ) : WebSocketListener() {
        override fun onMessage(webSocket: WebSocket, text: String) {
            enqueue(webSocket, text)
        }

        override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
            enqueue(webSocket, bytes.utf8())
        }

        override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
            scheduleReconnect()
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            scheduleReconnect()
        }

        private fun enqueue(webSocket: WebSocket, payload: String) {
            ingress.trySend(IngressMessage(payload, connectionSessionId, webSocket))
        }
    }

    private data class IngressMessage(
        val payload: String,
        val connectionSessionId: String,
        val webSocket: WebSocket,
    )
}
