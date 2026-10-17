package com.aixauusd.analyzer.data.remote.dto

import com.google.gson.annotations.SerializedName

data class PatternDetectionResult(
    @SerializedName("name") val name: String,
    @SerializedName("bias") val bias: String, // "BULLISH", "BEARISH", "NEUTRAL"
    @SerializedName("confidence") val confidence: Int,
    @SerializedName("currentPrice") val currentPrice: Double,
    @SerializedName("breakoutLevel") val breakoutLevel: Double,
    @SerializedName("supportLevel") val supportLevel: Double,
    @SerializedName("resistanceLevel") val resistanceLevel: Double,
    @SerializedName("targetProfit") val targetProfit: Double,
    @SerializedName("stopLoss") val stopLoss: Double,
    @SerializedName("summary") val summary: String
)

data class PatternDetectionResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("pattern") val pattern: PatternDetectionResult?,
    @SerializedName("error") val error: String?
)
