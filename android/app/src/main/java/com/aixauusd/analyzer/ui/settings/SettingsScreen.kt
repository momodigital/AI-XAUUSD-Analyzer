package com.aixauusd.analyzer.ui.settings

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.NetworkCheck
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.aixauusd.analyzer.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val settings = uiState.currentSettings
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.testResultSnackbar) {
        uiState.testResultSnackbar?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            viewModel.clearSnackbar()
        }
    }

    LaunchedEffect(uiState.isSavedSuccess) {
        if (uiState.isSavedSuccess) {
            Toast.makeText(context, "Settings disimpan", Toast.LENGTH_SHORT).show()
            onNavigateBack()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(text = "Pengaturan AI", style = MaterialTheme.typography.titleLarge, color = TextPrimary) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Kembali", tint = TextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkSurface)
            )
        },
        bottomBar = {
            Surface(
                color = DarkSurface,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onNavigateBack,
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        shape = RoundedCornerShape(8.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary)
                    ) {
                        Text(text = "Batal", fontWeight = FontWeight.SemiBold)
                    }

                    Button(
                        onClick = { viewModel.saveSettings() },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AccentBlue)
                    ) {
                        Icon(imageVector = Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "Simpan", fontWeight = FontWeight.Bold)
                    }
                }
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = DarkBg
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // ================= SECTION A: MODEL AI =================
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "A. Model AI",
                        style = MaterialTheme.typography.titleMedium,
                        color = GoldYellow,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    // Provider Tabs
                    val providers = listOf(
                        "gemini" to "Google Gemini",
                        "groq" to "Groq (Free)",
                        "openai" to "OpenAI",
                        "openrouter" to "OpenRouter"
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        providers.forEach { (key, label) ->
                            val isSelected = settings.provider == key
                            FilterChip(
                                selected = isSelected,
                                onClick = { viewModel.updateProvider(key) },
                                label = { Text(text = label, fontSize = 11.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = AccentBlue,
                                    selectedLabelColor = Color.White,
                                    containerColor = DarkSurfaceVariant,
                                    labelColor = TextSecondary
                                )
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Gemini Sub-options
                    if (settings.provider == "gemini") {
                        val geminiModels = listOf(
                            "gemini-3.8-flash" to "Gemini Flash (Cepat & Akurat)",
                            "gemini-4-argon" to "Gemini Pro / Argon (Deep Reasoning)",
                            "gemini-3.1-flash-lite" to "Gemini Flash Lite (Ultra Cepat)",
                            "custom" to "Custom Gemini API"
                        )

                        Text(text = "Pilih Varian Gemini:", fontSize = 12.sp, color = TextSecondary)
                        Spacer(modifier = Modifier.height(6.dp))

                        geminiModels.forEach { (modelId, label) ->
                            val isChecked = (modelId == "custom" && settings.modelType == "custom") ||
                                    (modelId != "custom" && settings.modelType == modelId)
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .selectable(
                                        selected = isChecked,
                                        onClick = { viewModel.updateModelType(modelId) }
                                    )
                                    .padding(vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RadioButton(
                                    selected = isChecked,
                                    onClick = { viewModel.updateModelType(modelId) },
                                    colors = RadioButtonDefaults.colors(
                                        selectedColor = AccentBlue,
                                        unselectedColor = TextSecondary
                                    )
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(text = label, color = TextPrimary, fontSize = 13.sp)
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = settings.geminiApiKey,
                            onValueChange = { viewModel.updateGeminiApiKey(it) },
                            label = { Text("Gemini API Key") },
                            placeholder = { Text("Masukkan AI Studio Gemini API Key...") },
                            modifier = Modifier.fillMaxWidth(),
                            visualTransformation = PasswordVisualTransformation(),
                            colors = outlinedTextFieldColors()
                        )
                    }

                    // Groq Settings
                    if (settings.provider == "groq") {
                        OutlinedTextField(
                            value = settings.groqApiKey,
                            onValueChange = { viewModel.updateGroqApiKey(it) },
                            label = { Text("Groq API Key (Gratis di console.groq.com)") },
                            placeholder = { Text("gsk_...") },
                            modifier = Modifier.fillMaxWidth(),
                            visualTransformation = PasswordVisualTransformation(),
                            colors = outlinedTextFieldColors()
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = settings.groqModel,
                            onValueChange = { viewModel.updateGroqModel(it) },
                            label = { Text("Model Name") },
                            placeholder = { Text("llama-3.3-70b-versatile") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = outlinedTextFieldColors()
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = settings.groqBaseUrl,
                            onValueChange = { viewModel.updateGroqBaseUrl(it) },
                            label = { Text("Base URL (Opsional)") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = outlinedTextFieldColors()
                        )
                    }

                    // OpenAI Settings
                    if (settings.provider == "openai") {
                        OutlinedTextField(
                            value = settings.openAiApiKey,
                            onValueChange = { viewModel.updateOpenAiApiKey(it) },
                            label = { Text("OpenAI API Key") },
                            placeholder = { Text("sk-...") },
                            modifier = Modifier.fillMaxWidth(),
                            visualTransformation = PasswordVisualTransformation(),
                            colors = outlinedTextFieldColors()
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = settings.openAiModel,
                            onValueChange = { viewModel.updateOpenAiModel(it) },
                            label = { Text("Model Name (misal: gpt-4o-mini)") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = outlinedTextFieldColors()
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = settings.openAiBaseUrl,
                            onValueChange = { viewModel.updateOpenAiBaseUrl(it) },
                            label = { Text("Base URL (Opsional)") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = outlinedTextFieldColors()
                        )
                    }

                    // OpenRouter Settings
                    if (settings.provider == "openrouter") {
                        OutlinedTextField(
                            value = settings.openRouterApiKey,
                            onValueChange = { viewModel.updateOpenRouterApiKey(it) },
                            label = { Text("OpenRouter API Key") },
                            placeholder = { Text("sk-or-v1-...") },
                            modifier = Modifier.fillMaxWidth(),
                            visualTransformation = PasswordVisualTransformation(),
                            colors = outlinedTextFieldColors()
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = settings.openRouterModel,
                            onValueChange = { viewModel.updateOpenRouterModel(it) },
                            label = { Text("Model Name") },
                            placeholder = { Text("google/gemini-flash-1.5") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = outlinedTextFieldColors()
                        )
                    }
                }
            }

            // ================= SECTION B: KREATIVITAS AI =================
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "B. Kreativitas AI",
                        style = MaterialTheme.typography.titleMedium,
                        color = GoldYellow,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "Temperature", fontSize = 13.sp, color = TextPrimary)
                        Text(
                            text = String.format("%.2f", settings.temperature),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = AccentBlue
                        )
                    }

                    Slider(
                        value = settings.temperature,
                        onValueChange = { viewModel.updateTemperature(it) },
                        valueRange = 0.0f..2.0f,
                        steps = 20,
                        colors = SliderDefaults.colors(
                            thumbColor = AccentBlue,
                            activeTrackColor = AccentBlue,
                            inactiveTrackColor = DarkBorder
                        )
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "Max Tokens", fontSize = 13.sp, color = TextPrimary)
                        Text(
                            text = "${settings.maxTokens}",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = AccentBlue
                        )
                    }

                    Slider(
                        value = settings.maxTokens.toFloat(),
                        onValueChange = { viewModel.updateMaxTokens(it.toInt()) },
                        valueRange = 512f..4096f,
                        steps = 7,
                        colors = SliderDefaults.colors(
                            thumbColor = AccentBlue,
                            activeTrackColor = AccentBlue,
                            inactiveTrackColor = DarkBorder
                        )
                    )
                }
            }

            // ================= SECTION C: SYSTEM INSTRUCTION =================
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "C. System Instruction (Peran AI)",
                            style = MaterialTheme.typography.titleMedium,
                            color = GoldYellow,
                            fontWeight = FontWeight.Bold
                        )
                        TextButton(onClick = { viewModel.resetSystemInstruction() }) {
                            Icon(imageVector = Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(14.dp), tint = AccentBlue)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = "Reset Default", fontSize = 11.sp, color = AccentBlue)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = settings.systemInstruction,
                        onValueChange = { viewModel.updateSystemInstruction(it) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp),
                        colors = outlinedTextFieldColors()
                    )
                }
            }

            // ================= SECTION D: UJI ENDPOINT =================
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "D. Uji Endpoint",
                        style = MaterialTheme.typography.titleMedium,
                        color = GoldYellow,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Kirim ping ringan untuk memastikan API Key, URL, dan model aktif merespons dengan cepat.",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = { viewModel.testEndpoint() },
                        enabled = !uiState.isTestingEndpoint,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = DarkSurfaceVariant)
                    ) {
                        if (uiState.isTestingEndpoint) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = AccentBlue, strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "Menguji koneksi...", fontSize = 13.sp, color = TextPrimary)
                        } else {
                            Icon(imageVector = Icons.Default.NetworkCheck, contentDescription = null, modifier = Modifier.size(18.dp), tint = AccentBlue)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "Test Endpoint (${settings.provider.uppercase()})", fontSize = 13.sp, color = TextPrimary, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun outlinedTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = AccentBlue,
    unfocusedBorderColor = DarkBorder,
    focusedTextColor = TextPrimary,
    unfocusedTextColor = TextPrimary,
    cursorColor = AccentBlue,
    focusedLabelColor = AccentBlue,
    unfocusedLabelColor = TextSecondary
)
