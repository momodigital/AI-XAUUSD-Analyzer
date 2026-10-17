package com.aixauusd.analyzer.data.remote.provider

import android.graphics.Bitmap

data class ChatMessage(
    val role: String, // "user" or "assistant"
    val content: String,
    val hasImage: Boolean = false
)

interface AiProvider {
    val providerName: String
    val modelName: String

    suspend fun chat(
        messages: List<ChatMessage>,
        images: List<Bitmap>,
        temperature: Double,
        systemInstruction: String
    ): Result<String>

    suspend fun testConnection(): Result<Long> // returns latency in milliseconds
}
