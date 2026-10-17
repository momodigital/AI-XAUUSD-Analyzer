package com.aixauusd.analyzer.data.remote.dto

import com.google.gson.annotations.SerializedName

// OpenAI / Groq / OpenRouter Request
data class OpenAiChatRequest(
    @SerializedName("model") val model: String,
    @SerializedName("messages") val messages: List<OpenAiMessage>,
    @SerializedName("temperature") val temperature: Double? = 0.7,
    @SerializedName("max_tokens") val maxTokens: Int? = 2048
)

data class OpenAiMessage(
    @SerializedName("role") val role: String, // system, user, assistant
    @SerializedName("content") val content: Any // String or List<OpenAiContentPart>
)

data class OpenAiContentPart(
    @SerializedName("type") val type: String, // "text" or "image_url"
    @SerializedName("text") val text: String? = null,
    @SerializedName("image_url") val imageUrl: OpenAiImageUrl? = null
)

data class OpenAiImageUrl(
    @SerializedName("url") val url: String // data:image/jpeg;base64,...
)

// OpenAI / Groq / OpenRouter Response
data class OpenAiChatResponse(
    @SerializedName("id") val id: String?,
    @SerializedName("choices") val choices: List<OpenAiChoice>?,
    @SerializedName("error") val error: OpenAiError?
)

data class OpenAiChoice(
    @SerializedName("index") val index: Int?,
    @SerializedName("message") val message: OpenAiResponseMessage?,
    @SerializedName("finish_reason") val finishReason: String?
)

data class OpenAiResponseMessage(
    @SerializedName("role") val role: String?,
    @SerializedName("content") val content: String?
)

data class OpenAiError(
    @SerializedName("message") val message: String?,
    @SerializedName("type") val type: String?,
    @SerializedName("code") val code: Any?
)
