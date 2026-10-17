package com.aixauusd.analyzer.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aixauusd.analyzer.data.local.datastore.AiSettings
import com.aixauusd.analyzer.data.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val currentSettings: AiSettings = AiSettings(),
    val isTestingEndpoint: Boolean = false,
    val testResultSnackbar: String? = null,
    val isSavedSuccess: Boolean = false
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            settingsRepository.settingsFlow.collect { saved ->
                _uiState.update { it.copy(currentSettings = saved) }
            }
        }
    }

    fun updateProvider(provider: String) {
        _uiState.update {
            it.copy(currentSettings = it.currentSettings.copy(provider = provider))
        }
    }

    fun updateModelType(modelType: String) {
        _uiState.update {
            it.copy(currentSettings = it.currentSettings.copy(modelType = modelType))
        }
    }

    fun updateGeminiApiKey(key: String) {
        _uiState.update {
            it.copy(currentSettings = it.currentSettings.copy(geminiApiKey = key))
        }
    }

    fun updateOpenAiApiKey(key: String) {
        _uiState.update {
            it.copy(currentSettings = it.currentSettings.copy(openAiApiKey = key))
        }
    }

    fun updateOpenAiBaseUrl(url: String) {
        _uiState.update {
            it.copy(currentSettings = it.currentSettings.copy(openAiBaseUrl = url))
        }
    }

    fun updateOpenAiModel(model: String) {
        _uiState.update {
            it.copy(currentSettings = it.currentSettings.copy(openAiModel = model))
        }
    }

    fun updateGroqApiKey(key: String) {
        _uiState.update {
            it.copy(currentSettings = it.currentSettings.copy(groqApiKey = key))
        }
    }

    fun updateGroqBaseUrl(url: String) {
        _uiState.update {
            it.copy(currentSettings = it.currentSettings.copy(groqBaseUrl = url))
        }
    }

    fun updateGroqModel(model: String) {
        _uiState.update {
            it.copy(currentSettings = it.currentSettings.copy(groqModel = model))
        }
    }

    fun updateOpenRouterApiKey(key: String) {
        _uiState.update {
            it.copy(currentSettings = it.currentSettings.copy(openRouterApiKey = key))
        }
    }

    fun updateOpenRouterModel(model: String) {
        _uiState.update {
            it.copy(currentSettings = it.currentSettings.copy(openRouterModel = model))
        }
    }

    fun updateTemperature(temp: Float) {
        _uiState.update {
            it.copy(currentSettings = it.currentSettings.copy(temperature = temp))
        }
    }

    fun updateMaxTokens(tokens: Int) {
        _uiState.update {
            it.copy(currentSettings = it.currentSettings.copy(maxTokens = tokens))
        }
    }

    fun updateSystemInstruction(instruction: String) {
        _uiState.update {
            it.copy(currentSettings = it.currentSettings.copy(systemInstruction = instruction))
        }
    }

    fun resetSystemInstruction() {
        val defaultText = "Kamu adalah analis forex profesional yang ahli membaca chart TradingView. Jawab ringkas, terstruktur, dan sertakan level harga konkret jika terlihat di chart."
        updateSystemInstruction(defaultText)
    }

    fun testEndpoint() {
        viewModelScope.launch {
            _uiState.update { it.copy(isTestingEndpoint = true, testResultSnackbar = null) }
            val result = settingsRepository.testEndpoint(_uiState.value.currentSettings)
            result.onSuccess { latency ->
                _uiState.update {
                    it.copy(
                        isTestingEndpoint = false,
                        testResultSnackbar = "✅ 200 OK! Koneksi berhasil (Latency: ${latency}ms)"
                    )
                }
            }.onFailure { err ->
                _uiState.update {
                    it.copy(
                        isTestingEndpoint = false,
                        testResultSnackbar = "❌ Koneksi Gagal: ${err.message}"
                    )
                }
            }
        }
    }

    fun saveSettings() {
        viewModelScope.launch {
            settingsRepository.saveSettings(_uiState.value.currentSettings)
            _uiState.update { it.copy(isSavedSuccess = true) }
        }
    }

    fun clearSnackbar() {
        _uiState.update { it.copy(testResultSnackbar = null) }
    }
}
