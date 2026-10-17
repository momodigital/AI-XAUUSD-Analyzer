package com.aixauusd.analyzer.ui.dashboard

import android.app.Activity
import android.net.Uri
import android.webkit.WebView
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.aixauusd.analyzer.ui.dashboard.components.*
import com.aixauusd.analyzer.ui.theme.*
import com.aixauusd.analyzer.util.BitmapUtils
import com.aixauusd.analyzer.util.WebViewCapture
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToSettings: () -> Unit,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val messages by viewModel.chatMessages.collectAsState()
    val liveTick by viewModel.livePriceTick.collectAsState()
    val activeAlerts by viewModel.activeAlerts.collectAsState()

    val context = LocalContext.current
    val activity = context as? Activity
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    var inputChatText by rememberSaveable { mutableStateOf("") }

    val allIndicatorsList = remember {
        listOf(
            "EMA 20", "EMA 50", "EMA 200",
            "RSI", "MACD", "Bollinger Bands",
            "Volume", "Stochastic", "Fibonacci"
        )
    }

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            val bitmap = BitmapUtils.uriToBitmap(context, uri)
            viewModel.setAttachedImage(uri, bitmap)
        }
    }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let { error ->
            snackbarHostState.showSnackbar(
                message = error,
                duration = SnackbarDuration.Short,
                withDismissAction = true
            )
            viewModel.clearError()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "${uiState.currentPair} • Live Chart",
                            style = MaterialTheme.typography.titleLarge,
                            color = TextPrimary
                        )
                        Text(
                            text = "Real-Time Multi-Pair Forex & Index Analyzer",
                            fontSize = 11.sp,
                            color = TextSecondary
                        )
                    }
                },
                actions = {
                    IconButton(onClick = {
                        webViewRef?.reload()
                    }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh Chart",
                            tint = TextPrimary
                        )
                    }
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Settings",
                            tint = AccentBlue
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DarkSurface
                )
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = DarkBg
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // 1. Real-time Price Alert Banner with live WebSocket tick & Pair Switcher
            PriceAlertHeaderBar(
                currentPair = uiState.currentPair,
                onPairSelected = { pairInfo ->
                    viewModel.setPair(pairInfo.symbol, pairInfo.tradingViewSymbol)
                },
                tick = liveTick,
                alerts = activeAlerts,
                onOpenAddAlertDialog = { viewModel.setAddPriceAlertOpen(true) },
                onToggleAlert = { id, enabled -> viewModel.togglePriceAlert(id, enabled) },
                onDeleteAlert = { id -> viewModel.deletePriceAlert(id) }
            )

            // 2. Chart Toolbar (Timeframe & Indicator controls)
            ChartToolbar(
                currentTimeframe = uiState.timeframe,
                selectedIndicatorsCount = uiState.selectedIndicators.size,
                onTimeframeSelected = { tf -> viewModel.setTimeframe(tf) },
                onOpenIndicatorsDialog = { viewModel.setIndicatorDialogOpen(true) },
                onTakeScreenshot = {
                    activity?.let { act ->
                        webViewRef?.let { wv ->
                            scope.launch {
                                val captured = WebViewCapture.capture(wv, act)
                                if (captured != null) {
                                    viewModel.onScreenshotCaptured(captured)
                                } else {
                                    snackbarHostState.showSnackbar("Gagal mengambil screenshot chart.")
                                }
                            }
                        }
                    }
                }
            )

            // 3. TradingView Widget (WebView) with dynamic multi-pair symbol
            TradingViewWidget(
                symbol = uiState.currentSymbol,
                timeframe = uiState.timeframe,
                indicators = uiState.selectedIndicators,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(250.dp),
                onWebViewCreated = { wv ->
                    webViewRef = wv
                }
            )

            // 4. Question Template Chips (Horizontal LazyRow)
            TemplateChipsRow(
                onChipSelected = { templateText ->
                    inputChatText = templateText
                }
            )

            HorizontalDivider(
                color = DarkBorder,
                thickness = 1.dp
            )

            // 5. Chat Section (AI conversation + attachments + input)
            ChatSection(
                messages = messages,
                isLoading = uiState.isLoadingAi,
                currentInputText = inputChatText,
                onInputChange = { inputChatText = it },
                onSendMessage = { text ->
                    viewModel.sendUserChat(text)
                    inputChatText = ""
                },
                onPickImage = {
                    imagePickerLauncher.launch("image/*")
                },
                attachedImageUri = uiState.attachedImageUri,
                attachedBitmap = uiState.attachedBitmap,
                onRemoveAttachment = {
                    viewModel.clearAttachedImage()
                },
                modifier = Modifier.weight(1f)
            )
        }
    }

    // Indicators multi-select dialog
    if (uiState.isIndicatorDialogOpen) {
        IndicatorsDialog(
            allIndicators = allIndicatorsList,
            selectedIndicators = uiState.selectedIndicators,
            onToggleIndicator = { ind -> viewModel.toggleIndicator(ind) },
            onDismiss = { viewModel.setIndicatorDialogOpen(false) }
        )
    }

    // Add Price Alert Dialog
    if (uiState.isAddPriceAlertOpen) {
        AddPriceAlertDialog(
            currentPrice = liveTick?.price ?: 2674.50,
            onDismiss = { viewModel.setAddPriceAlertOpen(false) },
            onSaveAlert = { price, type, note ->
                viewModel.addPriceAlert(price, type, note)
            }
        )
    }

    // Screenshot Analysis BottomSheet
    if (uiState.isBottomSheetOpen) {
        AnalysisBottomSheet(
            chartBitmap = uiState.capturedChartBitmap,
            onDismiss = { viewModel.closeBottomSheet() },
            onAnalyze = { prompt ->
                viewModel.analyzeScreenshot(prompt)
            }
        )
    }
}
