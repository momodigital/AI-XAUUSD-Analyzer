package com.aixauusd.analyzer.data.remote.websocket

import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.*
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

data class XauUsdTick(
    @SerializedName("symbol") val symbol: String = "OANDA:XAUUSD",
    @SerializedName("price") val price: Double,
    @SerializedName("bid") val bid: Double,
    @SerializedName("ask") val ask: Double,
    @SerializedName("change") val change: Double,
    @SerializedName("changePercent") val changePercent: Double,
    @SerializedName("high") val high: Double,
    @SerializedName("low") val low: Double,
    @SerializedName("timestamp") val timestamp: Long
)

data class WebSocketMessage(
    @SerializedName("type") val type: String,
    @SerializedName("data") val data: XauUsdTick?
)

@Singleton
class XauUsdWebSocketClient @Inject constructor(
    private val okHttpClient: OkHttpClient,
    private val gson: Gson
) {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var webSocket: WebSocket? = null
    private var isConnected = false

    private val _tickFlow = MutableStateFlow<XauUsdTick?>(null)
    val tickFlow: StateFlow<XauUsdTick?> = _tickFlow.asStateFlow()

    private val _connectionState = MutableStateFlow("Disconnected")
    val connectionState: StateFlow<String> = _connectionState.asStateFlow()

    fun connect(wsUrl: String = "wss://ais-dev-maqfprmzeorp4dhwcoufbe-393184317778.asia-northeast1.run.app/ws/price") {
        if (isConnected) return

        val request = Request.Builder()
            .url(wsUrl)
            .build()

        webSocket = okHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                isConnected = true
                _connectionState.value = "Connected"
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val message = gson.fromJson(text, WebSocketMessage::class.java)
                    if (message.data != null) {
                        _tickFlow.value = message.data
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                webSocket.close(1000, null)
                isConnected = false
                _connectionState.value = "Closing"
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                isConnected = false
                _connectionState.value = "Disconnected"
                scheduleReconnect()
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                isConnected = false
                _connectionState.value = "Error: ${t.message}"
                scheduleReconnect()
            }
        })
    }

    private fun scheduleReconnect() {
        scope.launch {
            delay(3000)
            if (!isConnected) {
                connect()
            }
        }
    }

    fun disconnect() {
        webSocket?.close(1000, "User disconnected")
        isConnected = false
        _connectionState.value = "Disconnected"
    }
}
