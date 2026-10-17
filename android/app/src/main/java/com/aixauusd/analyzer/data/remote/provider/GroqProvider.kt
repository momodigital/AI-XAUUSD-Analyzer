package com.aixauusd.analyzer.data.remote.provider

import android.graphics.Bitmap
import com.aixauusd.analyzer.data.remote.api.OpenAiCompatibleApiService
import com.aixauusd.analyzer.data.remote.dto.OpenAiChatRequest
import com.aixauusd.analyzer.data.remote.dto.OpenAiMessage
import kotlin.system.measureTimeMillis

class GroqProvider(
    private val apiService: OpenAiCompatibleApiService,
    private val apiKey: String,
    private val baseUrl: String = "https://api.groq.com/openai/v1",
    override val modelName: String = "llama-3.3-70b-versatile"
) : AiProvider {

    override val providerName: String = "groq"

    override suspend fun chat(
        messages: List<ChatMessage>,
        images: List<Bitmap>,
        temperature: Double,
        systemInstruction: String
    ): Result<String> {
        return try {
            if (apiKey.isBlank()) {
                return Result.failure(IllegalStateException("API Key Groq belum diisi. Anda dapat mendaftar gratis di console.groq.com."))
            }

            val requestMessages = mutableListOf<OpenAiMessage>()
            if (systemInstruction.isNotBlank()) {
                requestMessages.add(OpenAiMessage(role = "system", content = systemInstruction))
            }

            for (i in 0 until messages.size - 1) {
                val msg = messages[i]
                requestMessages.add(OpenAiMessage(role = msg.role, content = msg.content))
            }

            val lastMsgText = messages.lastOrNull()?.content ?: "Analisa kondisi pasar XAUUSD saat ini."
            
            // Note for Groq text models regarding images
            val finalContent = if (images.isNotEmpty()) {
                "[Catatan Analis: Screenshot chart dilampirkan oleh pengguna. Model Groq Llama-3.3 merespons analisis teknikal berbasis indikator, level support/resistance, strategi risk management, dan data harga XAUUSD terkini].\n\nPertanyaan: $lastMsgText"
            } else {
                lastMsgText
            }

            requestMessages.add(OpenAiMessage(role = "user", content = finalContent))

            val fullUrl = if (baseUrl.endsWith("/chat/completions")) baseUrl else "${baseUrl.trimEnd('/')}/chat/completions"

            val response = apiService.chatCompletion(
                url = fullUrl,
                authorization = "Bearer $apiKey",
                request = OpenAiChatRequest(
                    model = modelName,
                    messages = requestMessages,
                    temperature = temperature,
                    maxTokens = 2048
                )
            )

            if (response.isSuccessful) {
                val choice = response.body()?.choices?.firstOrNull()?.message?.content
                if (!choice.isNullOrBlank()) {
                    Result.success(choice)
                } else {
                    Result.failure(Exception("Respons Groq kosong."))
                }
            } else {
                val err = response.errorBody()?.string()
                Result.failure(Exception("Groq HTTP ${response.code()}: $err"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun testConnection(): Result<Long> {
        return try {
            if (apiKey.isBlank()) {
                return Result.failure(IllegalStateException("API Key Groq kosong."))
            }

            var resultSuccess = false
            var errorMsg = ""
            val fullUrl = if (baseUrl.endsWith("/chat/completions")) baseUrl else "${baseUrl.trimEnd('/')}/chat/completions"

            val elapsed = measureTimeMillis {
                val response = apiService.chatCompletion(
                    url = fullUrl,
                    authorization = "Bearer $apiKey",
                    request = OpenAiChatRequest(
                        model = modelName,
                        messages = listOf(OpenAiMessage(role = "user", content = "Ping! Answer OK.")),
                        temperature = 0.1,
                        maxTokens = 5
                    )
                )
                if (response.isSuccessful) {
                    resultSuccess = true
                } else {
                    errorMsg = "HTTP ${response.code()}: ${response.errorBody()?.string()}"
                }
            }

            if (resultSuccess) Result.success(elapsed) else Result.failure(Exception(errorMsg))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
