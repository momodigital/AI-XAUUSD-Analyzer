package com.aixauusd.analyzer.data.remote.api

import com.aixauusd.analyzer.data.remote.dto.OpenAiChatRequest
import com.aixauusd.analyzer.data.remote.dto.OpenAiChatResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Url

interface OpenAiCompatibleApiService {
    @POST
    suspend fun chatCompletion(
        @Url url: String,
        @Header("Authorization") authorization: String,
        @Header("HTTP-Referer") referer: String? = "https://aixauusd.app",
        @Header("X-Title") title: String? = "AI XAUUSD Analyzer",
        @Body request: OpenAiChatRequest
    ): Response<OpenAiChatResponse>
}
