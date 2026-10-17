package com.aixauusd.analyzer.data.local.room.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "analysis_history")
data class AnalysisEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val imageUri: String?,
    val prompt: String,
    val response: String,
    val provider: String,
    val model: String
)
