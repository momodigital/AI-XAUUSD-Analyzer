package com.aixauusd.analyzer.data.remote.provider

import android.graphics.Bitmap
import com.aixauusd.analyzer.data.remote.api.OpenAiCompatibleApiService
import com.aixauusd.analyzer.data.remote.dto.*
import com.aixauusd.analyzer.util.BitmapUtils
import kotlin.system.measureTimeMillis

class OpenRouterProvider(
    private val apiService: OpenAiCompatibleApiService,
    private val apiKey: String,
    private val baseUrl: String = "https://openrouter.ai/api/v1",
    override val modelName: String = "google/gemini-flash-1.5"
) : AiProvider {

    override val providerName: String = "openrouter"

    override suspend fun chat(
        messages: List<ChatMessage>,
        images: List<Bitmap>,
        temperature: Double,
        systemInstruction: String
    ): Result<String> {
        return try {
            if (apiKey.isBlank()) {
                return Result.failure(IllegalStateException("API Key OpenRouter belum diisi."))
            }

            val requestMessages = mutableListOf<OpenAiMessage>()
            if (systemInstruction.isNotBlank()) {
                requestMessages.add(OpenAiMessage(role = "system", content = systemInstruction))
            }

            for (i in 0 until messages.size - 1) {
                val msg = messages[i]
                requestMessages.add(OpenAiMessage(role = msg.role, content = msg.content))
            }

            val lastMsgText = messages.lastOrNull()?.content ?: "Analisa chart XAUUSD ini."
            if (images.isNotEmpty()) {
                val parts = mutableListOf<OpenAiContentPart>()
                parts.add(OpenAiContentPart(type = "text", text = lastMsgText))
                for (bitmap in images) {
                    val base64 = BitmapUtils.toBase64Jpeg(bitmap, quality = 80, maxDimension = 1600)
                    parts.add(
                        OpenAiContentPart(
                            type = "image_url",
                            imageUrl = OpenAiImageUrl(url = "data:image/jpeg;base64,$base64")
                        )
                    )
                }
                requestMessages.add(OpenAiMessage(role = "user", content = parts))
            } else {
                requestMessages.add(OpenAiMessage(role = "user", content = lastMsgText))
            }

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
                    Result.failure(Exception("Respons OpenRouter kosong."))
                }
            } else {
                val err = response.errorBody()?.string()
                Result.failure(Exception("OpenRouter HTTP ${response.code()}: $err"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun testConnection(): Result<Long> {
        return try {
            if (apiKey.isBlank()) {
                return Result.failure(IllegalStateException("API Key OpenRouter belum diisi."))
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
