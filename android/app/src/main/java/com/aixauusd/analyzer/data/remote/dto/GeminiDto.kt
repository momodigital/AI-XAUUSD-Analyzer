package com.aixauusd.analyzer.data.remote.dto

import com.google.gson.annotations.SerializedName

// Gemini Request DTO
data class GeminiRequest(
    @SerializedName("contents") val contents: List<GeminiContent>,
    @SerializedName("system_instruction") val systemInstruction: GeminiSystemInstruction? = null,
    @SerializedName("generationConfig") val generationConfig: GeminiGenerationConfig? = null
)

data class GeminiSystemInstruction(
    @SerializedName("parts") val parts: List<GeminiTextPart>
)

data class GeminiContent(
    @SerializedName("role") val role: String? = null,
    @SerializedName("parts") val parts: List<GeminiPart>
)

sealed class GeminiPart

data class GeminiTextPart(
    @SerializedName("text") val text: String
) : GeminiPart()

data class GeminiInlineDataPart(
    @SerializedName("inline_data") val inlineData: GeminiInlineData
) : GeminiPart()

data class GeminiInlineData(
    @SerializedName("mime_type") val mimeType: String,
    @SerializedName("data") val data: String // base64
)

data class GeminiGenerationConfig(
    @SerializedName("temperature") val temperature: Double? = 0.7,
    @SerializedName("maxOutputTokens") val maxOutputTokens: Int? = 2048
)

// Gemini Response DTO
data class GeminiResponse(
    @SerializedName("candidates") val candidates: List<GeminiCandidate>?
)

data class GeminiCandidate(
    @SerializedName("content") val content: GeminiContentResponse?,
    @SerializedName("finishReason") val finishReason: String?
)

data class GeminiContentResponse(
    @SerializedName("parts") val parts: List<GeminiTextPartResponse>?
)

data class GeminiTextPartResponse(
    @SerializedName("text") val text: String?
)
