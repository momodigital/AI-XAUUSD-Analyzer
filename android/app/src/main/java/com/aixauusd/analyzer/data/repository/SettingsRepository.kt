package com.aixauusd.analyzer.data.repository

import com.aixauusd.analyzer.data.local.datastore.AiSettings
import com.aixauusd.analyzer.data.local.datastore.PreferencesManager
import com.aixauusd.analyzer.data.remote.provider.AiProviderFactory
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SettingsRepository @Inject constructor(
    private val preferencesManager: PreferencesManager,
    private val aiProviderFactory: AiProviderFactory
) {
    val settingsFlow: Flow<AiSettings> = preferencesManager.settingsFlow

    suspend fun saveSettings(settings: AiSettings) {
        preferencesManager.updateSettings(settings)
    }

    suspend fun testEndpoint(settings: AiSettings): Result<Long> {
        val provider = aiProviderFactory.createProvider(settings)
        return provider.testConnection()
    }
}
