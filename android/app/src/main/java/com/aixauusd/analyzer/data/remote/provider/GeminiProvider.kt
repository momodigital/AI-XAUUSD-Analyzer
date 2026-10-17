package com.aixauusd.analyzer.data.remote.provider

import android.graphics.Bitmap
import com.aixauusd.analyzer.data.remote.api.GeminiApiService
import com.aixauusd.analyzer.data.remote.dto.*
import com.aixauusd.analyzer.util.BitmapUtils
import kotlin.system.measureTimeMillis

class GeminiProvider(
    private val apiService: GeminiApiService,
    private val apiKey: String,
    override val modelName: String = "gemini-3.8-flash"
) : AiProvider {

    override val providerName: String = "gemini"

    override suspend fun chat(
        messages: List<ChatMessage>,
        images: List<Bitmap>,
        temperature: Double,
        systemInstruction: String
    ): Result<String> {
        return try {
            if (apiKey.isBlank()) {
                return Result.failure(IllegalStateException("API Key Gemini belum diisi. Silakan atur di Settings."))
            }

            val contents = mutableListOf<GeminiContent>()

            // Add previous history
            for (i in 0 until messages.size - 1) {
                val msg = messages[i]
                contents.add(
                    GeminiContent(
                        role = if (msg.role == "user") "user" else "model",
                        parts = listOf(GeminiTextPart(msg.content))
                    )
                )
            }

            // Build latest message parts with image attachments
            val latestParts = mutableListOf<GeminiPart>()
            for (bitmap in images) {
                val base64 = BitmapUtils.toBase64Jpeg(bitmap, quality = 80, maxDimension = 1600)
                latestParts.add(
                    GeminiInlineDataPart(
                        inlineData = GeminiInlineData(
                            mimeType = "image/jpeg",
                            data = base64
                        )
                    )
                )
            }

            val lastUserMessage = messages.lastOrNull()?.content ?: "Analisa chart XAUUSD ini."
            latestParts.add(GeminiTextPart(lastUserMessage))

            contents.add(
                GeminiContent(
                    role = "user",
                    parts = latestParts
                )
            )

            val request = GeminiRequest(
                contents = contents,
                systemInstruction = GeminiSystemInstruction(
                    parts = listOf(GeminiTextPart(systemInstruction))
                ),
                generationConfig = GeminiGenerationConfig(
                    temperature = temperature,
                    maxOutputTokens = 2048
                )
            )

            val response = apiService.generateContent(
                model = modelName,
                apiKey = apiKey,
                request = request
            )

            if (response.isSuccessful) {
                val candidateText = response.body()
                    ?.candidates
                    ?.firstOrNull()
                    ?.content
                    ?.parts
                    ?.firstOrNull()
                    ?.text

                if (!candidateText.isNullOrBlank()) {
                    Result.success(candidateText)
                } else {
                    Result.failure(Exception("AI tidak menghasilkan teks atau respons kosong."))
                }
            } else {
                val errorBody = response.errorBody()?.string()
                Result.failure(Exception("HTTP ${response.code()}: $errorBody"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun testConnection(): Result<Long> {
        return try {
            if (apiKey.isBlank()) {
                return Result.failure(IllegalStateException("API Key Gemini kosong."))
            }

            var resultSuccess = false
            var errorMsg = ""

            val elapsed = measureTimeMillis {
                val request = GeminiRequest(
                    contents = listOf(
                        GeminiContent(
                            role = "user",
                            parts = listOf(GeminiTextPart("Ping! Jawab 'OK' saja."))
                        )
                    ),
                    generationConfig = GeminiGenerationConfig(temperature = 0.1, maxOutputTokens = 10)
                )
                val response = apiService.generateContent(
                    model = modelName,
                    apiKey = apiKey,
                    request = request
                )
                if (response.isSuccessful) {
                    resultSuccess = true
                } else {
                    errorMsg = "HTTP ${response.code()}: ${response.errorBody()?.string()}"
                }
            }

            if (resultSuccess) {
                Result.success(elapsed)
            } else {
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
