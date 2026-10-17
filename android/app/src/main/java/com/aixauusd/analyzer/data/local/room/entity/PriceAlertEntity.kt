package com.aixauusd.analyzer.data.local.room.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "price_alerts")
data class PriceAlertEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val targetPrice: Double,
    val alertType: String, // "SUPPORT" (if price drops to/below) or "RESISTANCE" (if price rises to/above)
    val isEnabled: Boolean = true,
    val isTriggered: Boolean = false,
    val note: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val triggeredAt: Long? = null
)
