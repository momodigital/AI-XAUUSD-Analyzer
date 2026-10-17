package com.aixauusd.analyzer.data.repository

import android.graphics.Bitmap
import com.aixauusd.analyzer.data.local.datastore.PreferencesManager
import com.aixauusd.analyzer.data.local.room.dao.AnalysisDao
import com.aixauusd.analyzer.data.local.room.dao.ChatDao
import com.aixauusd.analyzer.data.local.room.entity.AnalysisEntity
import com.aixauusd.analyzer.data.local.room.entity.ChatMessageEntity
import com.aixauusd.analyzer.data.remote.provider.AiProviderFactory
import com.aixauusd.analyzer.data.remote.provider.ChatMessage
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatRepository @Inject constructor(
    private val chatDao: ChatDao,
    private val analysisDao: AnalysisDao,
    private val preferencesManager: PreferencesManager,
    private val aiProviderFactory: AiProviderFactory
) {
    val messagesFlow: Flow<List<ChatMessageEntity>> = chatDao.getAllMessages()

    suspend fun sendUserMessage(
        content: String,
        imageUri: String? = null,
        hasImage: Boolean = false
    ): Long {
        val entity = ChatMessageEntity(
            content = content,
            isFromUser = true,
            imageUri = imageUri,
            hasImage = hasImage
        )
        return chatDao.insertMessage(entity)
    }

    suspend fun requestAiAnalysis(
        prompt: String,
        images: List<Bitmap> = emptyList(),
        imageUriForHistory: String? = null
    ): Result<String> {
        val settings = preferencesManager.settingsFlow.first()
        val provider = aiProviderFactory.createProvider(settings)

        // Get past messages to give conversation context
        val pastEntities = chatDao.getAllMessages().first()
        val messages = pastEntities.takeLast(10).map {
            ChatMessage(
                role = if (it.isFromUser) "user" else "assistant",
                content = it.content,
                hasImage = it.hasImage
            )
        }.toMutableList()

        if (messages.isEmpty() || messages.last().content != prompt) {
            messages.add(ChatMessage(role = "user", content = prompt, hasImage = images.isNotEmpty()))
        }

        val result = provider.chat(
            messages = messages,
            images = images,
            temperature = settings.temperature.toDouble(),
            systemInstruction = settings.systemInstruction
        )

        result.onSuccess { reply ->
            // Insert AI response into Chat table
            chatDao.insertMessage(
                ChatMessageEntity(
                    content = reply,
                    isFromUser = false,
                    provider = provider.providerName,
                    model = provider.modelName
                )
            )

            // Save to Analysis History table
            analysisDao.insertAnalysis(
                AnalysisEntity(
                    imageUri = imageUriForHistory,
                    prompt = prompt,
                    response = reply,
                    provider = provider.providerName,
                    model = provider.modelName
                )
            )
        }

        return result
    }

    suspend fun clearChat() {
        chatDao.clearHistory()
    }
}
