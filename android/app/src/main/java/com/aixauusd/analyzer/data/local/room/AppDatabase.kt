package com.aixauusd.analyzer.data.local.room

import androidx.room.Database
import androidx.room.RoomDatabase
import com.aixauusd.analyzer.data.local.room.dao.AnalysisDao
import com.aixauusd.analyzer.data.local.room.dao.ChatDao
import com.aixauusd.analyzer.data.local.room.dao.PriceAlertDao
import com.aixauusd.analyzer.data.local.room.entity.AnalysisEntity
import com.aixauusd.analyzer.data.local.room.entity.ChatMessageEntity
import com.aixauusd.analyzer.data.local.room.entity.PriceAlertEntity

@Database(
    entities = [ChatMessageEntity::class, AnalysisEntity::class, PriceAlertEntity::class],
    version = 2,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun chatDao(): ChatDao
    abstract fun analysisDao(): AnalysisDao
    abstract fun priceAlertDao(): PriceAlertDao

    companion object {
        const val DATABASE_NAME = "xauusd_ai_database.db"
    }
}
