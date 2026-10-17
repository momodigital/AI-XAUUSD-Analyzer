package com.aixauusd.analyzer.data.remote.provider

import com.aixauusd.analyzer.data.local.datastore.AiSettings
import com.aixauusd.analyzer.data.remote.api.GeminiApiService
import com.aixauusd.analyzer.data.remote.api.OpenAiCompatibleApiService
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AiProviderFactory @Inject constructor(
    private val geminiApiService: GeminiApiService,
    private val openAiCompatibleApiService: OpenAiCompatibleApiService
) {
    fun createProvider(settings: AiSettings): AiProvider {
        return when (settings.provider.lowercase()) {
            "gemini" -> {
                GeminiProvider(
                    apiService = geminiApiService,
                    apiKey = settings.geminiApiKey,
                    modelName = settings.modelType.ifBlank { "gemini-3.8-flash" }
                )
            }
            "openai" -> {
                OpenAiProvider(
                    apiService = openAiCompatibleApiService,
                    apiKey = settings.openAiApiKey,
                    baseUrl = settings.openAiBaseUrl.ifBlank { "https://api.openai.com/v1" },
                    modelName = settings.openAiModel.ifBlank { "gpt-4o-mini" }
                )
            }
            "groq" -> {
                GroqProvider(
                    apiService = openAiCompatibleApiService,
                    apiKey = settings.groqApiKey,
                    baseUrl = settings.groqBaseUrl.ifBlank { "https://api.groq.com/openai/v1" },
                    modelName = settings.groqModel.ifBlank { "llama-3.3-70b-versatile" }
                )
            }
            "openrouter" -> {
                OpenRouterProvider(
                    apiService = openAiCompatibleApiService,
                    apiKey = settings.openRouterApiKey,
                    modelName = settings.openRouterModel.ifBlank { "google/gemini-flash-1.5" }
                )
            }
            else -> {
                GeminiProvider(
                    apiService = geminiApiService,
                    apiKey = settings.geminiApiKey,
                    modelName = "gemini-3.8-flash"
                )
            }
        }
    }
}
