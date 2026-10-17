package com.aixauusd.analyzer.data.local.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.doublePreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "xauusd_settings")

data class AiSettings(
    val provider: String = "gemini", // "gemini", "openai", "groq", "openrouter"
    val modelType: String = "gemini-3.8-flash", // preset or custom model name
    val geminiApiKey: String = "",
    val openAiApiKey: String = "",
    val openAiBaseUrl: String = "",
    val openAiModel: String = "gpt-4o-mini",
    val groqApiKey: String = "",
    val groqBaseUrl: String = "https://api.groq.com/openai/v1",
    val groqModel: String = "llama-3.3-70b-versatile",
    val openRouterApiKey: String = "",
    val openRouterModel: String = "google/gemini-flash-1.5",
    val temperature: Float = 0.7f,
    val maxTokens: Int = 2048,
    val systemInstruction: String = "Kamu adalah analis forex profesional yang ahli membaca chart TradingView. Jawab ringkas, terstruktur, dan sertakan level harga konkret jika terlihat di chart."
)

@Singleton
class PreferencesManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private val KEY_PROVIDER = stringPreferencesKey("provider")
        private val KEY_MODEL_TYPE = stringPreferencesKey("model_type")
        private val KEY_OPENAI_BASE_URL = stringPreferencesKey("openai_base_url")
        private val KEY_OPENAI_MODEL = stringPreferencesKey("openai_model")
        private val KEY_GROQ_BASE_URL = stringPreferencesKey("groq_base_url")
        private val KEY_GROQ_MODEL = stringPreferencesKey("groq_model")
        private val KEY_OPENROUTER_MODEL = stringPreferencesKey("openrouter_model")
        private val KEY_TEMPERATURE = doublePreferencesKey("temperature")
        private val KEY_MAX_TOKENS = intPreferencesKey("max_tokens")
        private val KEY_SYSTEM_INSTRUCTION = stringPreferencesKey("system_instruction")

        private const val SECURE_PREFS_NAME = "secure_api_keys"
        private const val SECURE_KEY_GEMINI = "key_gemini"
        private const val SECURE_KEY_OPENAI = "key_openai"
        private const val SECURE_KEY_GROQ = "key_groq"
        private const val SECURE_KEY_OPENROUTER = "key_openrouter"
    }

    // EncryptedSharedPreferences for hardware-backed key protection
    private val securePrefs by lazy {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            context,
            SECURE_PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    val settingsFlow: Flow<AiSettings> = context.dataStore.data.map { prefs ->
        AiSettings(
            provider = prefs[KEY_PROVIDER] ?: "gemini",
            modelType = prefs[KEY_MODEL_TYPE] ?: "gemini-3.8-flash",
            geminiApiKey = securePrefs.getString(SECURE_KEY_GEMINI, "") ?: "",
            openAiApiKey = securePrefs.getString(SECURE_KEY_OPENAI, "") ?: "",
            openAiBaseUrl = prefs[KEY_OPENAI_BASE_URL] ?: "",
            openAiModel = prefs[KEY_OPENAI_MODEL] ?: "gpt-4o-mini",
            groqApiKey = securePrefs.getString(SECURE_KEY_GROQ, "") ?: "",
            groqBaseUrl = prefs[KEY_GROQ_BASE_URL] ?: "https://api.groq.com/openai/v1",
            groqModel = prefs[KEY_GROQ_MODEL] ?: "llama-3.3-70b-versatile",
            openRouterApiKey = securePrefs.getString(SECURE_KEY_OPENROUTER, "") ?: "",
            openRouterModel = prefs[KEY_OPENROUTER_MODEL] ?: "google/gemini-flash-1.5",
            temperature = (prefs[KEY_TEMPERATURE] ?: 0.7).toFloat(),
            maxTokens = prefs[KEY_MAX_TOKENS] ?: 2048,
            systemInstruction = prefs[KEY_SYSTEM_INSTRUCTION]
                ?: "Kamu adalah analis forex profesional yang ahli membaca chart TradingView. Jawab ringkas, terstruktur, dan sertakan level harga konkret jika terlihat di chart."
        )
    }

    suspend fun updateSettings(settings: AiSettings) {
        // Securely store API Keys in hardware-encrypted keystore
        securePrefs.edit()
            .putString(SECURE_KEY_GEMINI, settings.geminiApiKey)
            .putString(SECURE_KEY_OPENAI, settings.openAiApiKey)
            .putString(SECURE_KEY_GROQ, settings.groqApiKey)
            .putString(SECURE_KEY_OPENROUTER, settings.openRouterApiKey)
            .apply()

        // Store non-sensitive configuration in DataStore Preferences
        context.dataStore.edit { prefs ->
            prefs[KEY_PROVIDER] = settings.provider
            prefs[KEY_MODEL_TYPE] = settings.modelType
            prefs[KEY_OPENAI_BASE_URL] = settings.openAiBaseUrl
            prefs[KEY_OPENAI_MODEL] = settings.openAiModel
            prefs[KEY_GROQ_BASE_URL] = settings.groqBaseUrl
            prefs[KEY_GROQ_MODEL] = settings.groqModel
            prefs[KEY_OPENROUTER_MODEL] = settings.openRouterModel
            prefs[KEY_TEMPERATURE] = settings.temperature.toDouble()
            prefs[KEY_MAX_TOKENS] = settings.maxTokens
            prefs[KEY_SYSTEM_INSTRUCTION] = settings.systemInstruction
        }
    }
}
