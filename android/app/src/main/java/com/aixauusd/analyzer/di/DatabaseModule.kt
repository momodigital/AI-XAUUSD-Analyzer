package com.aixauusd.analyzer.di

import android.content.Context
import androidx.room.Room
import com.aixauusd.analyzer.data.local.room.AppDatabase
import com.aixauusd.analyzer.data.local.room.dao.AnalysisDao
import com.aixauusd.analyzer.data.local.room.dao.ChatDao
import com.aixauusd.analyzer.data.local.room.dao.PriceAlertDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            AppDatabase.DATABASE_NAME
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    fun provideChatDao(database: AppDatabase): ChatDao {
        return database.chatDao()
    }

    @Provides
    fun provideAnalysisDao(database: AppDatabase): AnalysisDao {
        return database.analysisDao()
    }

    @Provides
    fun providePriceAlertDao(database: AppDatabase): PriceAlertDao {
        return database.priceAlertDao()
    }
}
