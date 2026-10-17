package com.aixauusd.analyzer.ui.dashboard.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAlert
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aixauusd.analyzer.data.local.room.entity.PriceAlertEntity
import com.aixauusd.analyzer.data.remote.websocket.XauUsdTick
import com.aixauusd.analyzer.ui.theme.*

data class CurrencyPairInfo(
    val symbol: String,
    val displayName: String,
    val tradingViewSymbol: String,
    val decimals: Int
)

val AVAILABLE_PAIRS = listOf(
    CurrencyPairInfo("XAUUSD", "XAU/USD (Gold)", "OANDA:XAUUSD", 2),
    CurrencyPairInfo("EURUSD", "EUR/USD", "FX:EURUSD", 4),
    CurrencyPairInfo("USDJPY", "USD/JPY", "FX:USDJPY", 2),
    CurrencyPairInfo("GBPUSD", "GBP/USD", "FX:GBPUSD", 4),
    CurrencyPairInfo("USDCAD", "USD/CAD", "FX:USDCAD", 4),
    CurrencyPairInfo("USDCHF", "USD/CHF", "FX:USDCHF", 4),
    CurrencyPairInfo("DXY", "DXY (Dollar Index)", "CAPITALCOM:DXY", 2)
)

@Composable
fun PriceAlertHeaderBar(
    currentPair: String,
    onPairSelected: (CurrencyPairInfo) -> Unit,
    tick: XauUsdTick?,
    alerts: List<PriceAlertEntity>,
    onOpenAddAlertDialog: () -> Unit,
    onToggleAlert: (Long, Boolean) -> Unit,
    onDeleteAlert: (Long) -> Unit,
    modifier: Modifier = Modifier
) {
    val currentPrice = tick?.price ?: 2674.50
    val isBullish = (tick?.change ?: 0.0) >= 0

    // Animated color flash on tick change
    val animatedBgColor by animateColorAsState(
        targetValue = if (isBullish) BullishGreen.copy(alpha = 0.12f) else BearishRed.copy(alpha = 0.12f),
        animationSpec = tween(durationMillis = 350),
        label = "price_flash_color"
    )

    var isPairMenuExpanded by remember { mutableStateOf(false) }
    val activePairInfo = remember(currentPair) {
        AVAILABLE_PAIRS.find { it.symbol == currentPair } ?: AVAILABLE_PAIRS.first()
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(DarkSurfaceVariant)
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        // Pair Selection Chips Row
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            contentPadding = PaddingValues(vertical = 2.dp)
        ) {
            items(AVAILABLE_PAIRS) { pair ->
                val isSelected = pair.symbol == currentPair
                Box(
                    modifier = Modifier
                        .background(
                            if (isSelected) AccentBlue else DarkSurface,
                            RoundedCornerShape(6.dp)
                        )
                        .border(
                            1.dp,
                            if (isSelected) AccentBlueLight else DarkBorder,
                            RoundedCornerShape(6.dp)
                        )
                        .clickable { onPairSelected(pair) }
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = pair.symbol,
                        color = if (isSelected) Color.White else TextSecondary,
                        fontSize = 11.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        // Price display and alert CTA
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(animatedBgColor, RoundedCornerShape(8.dp))
                .padding(horizontal = 8.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .background(if (isBullish) BullishGreen else BearishRed, RoundedCornerShape(4.dp))
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "${activePairInfo.symbol}:",
                    fontSize = 11.sp,
                    color = TextSecondary,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.width(6.dp))

                // Animated Price Change Number Transition
                AnimatedContent(
                    targetState = currentPrice,
                    transitionSpec = {
                        if (targetState > initialState) {
                            slideInVertically { height -> height } togetherWith
                                    slideOutVertically { height -> -height }
                        } else {
                            slideInVertically { height -> -height } togetherWith
                                    slideOutVertically { height -> height }
                        }
                    },
                    label = "animated_price"
                ) { price ->
                    Text(
                        text = if (activePairInfo.decimals == 4) String.format("%.4f", price) else String.format("%.2f", price),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = if (isBullish) BullishGreen else BearishRed
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "${if (isBullish) "+" else ""}${String.format("%.2f", tick?.changePercent ?: 0.0)}%",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isBullish) BullishGreen else BearishRed
                )
            }

            // Button to set price alert
            Button(
                onClick = onOpenAddAlertDialog,
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = AccentBlue.copy(alpha = 0.25f),
                    contentColor = AccentBlueLight
                ),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                modifier = Modifier.height(28.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.AddAlert,
                    contentDescription = "Set Alert",
                    modifier = Modifier.size(13.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Alert",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Active alerts row
        if (alerts.isNotEmpty()) {
            Spacer(modifier = Modifier.height(4.dp))
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                contentPadding = PaddingValues(vertical = 2.dp)
            ) {
                items(alerts) { alert ->
                    val isSupport = alert.alertType.uppercase() == "SUPPORT"
                    val tagBg = if (isSupport) BearishRed.copy(alpha = 0.15f) else BullishGreen.copy(alpha = 0.15f)
                    val tagColor = if (isSupport) BearishRed else BullishGreen

                    Row(
                        modifier = Modifier
                            .background(tagBg, RoundedCornerShape(6.dp))
                            .border(1.dp, tagColor.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.NotificationsActive,
                            contentDescription = null,
                            tint = tagColor,
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "${alert.alertType}: ${String.format("%.2f", alert.targetPrice)}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = tagColor
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Hapus",
                            tint = TextSecondary,
                            modifier = Modifier
                                .size(12.dp)
                                .clickable { onDeleteAlert(alert.id) }
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddPriceAlertDialog(
    currentPair: String,
    currentPrice: Double,
    onDismiss: () -> Unit,
    onSaveAlert: (targetPrice: Double, alertType: String, note: String) -> Unit
) {
    var selectedType by remember { mutableStateOf("SUPPORT") }
    var priceInput by remember {
        mutableStateOf(String.format("%.2f", if (selectedType == "SUPPORT") currentPrice * 0.995 else currentPrice * 1.005))
    }
    var noteInput by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DarkSurface,
        title = {
            Text(
                text = "Pasang Price Alert $currentPair",
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = TextPrimary
            )
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Harga Pasar Terkini: $${String.format("%.2f", currentPrice)}",
                    fontSize = 12.sp,
                    color = GoldYellow,
                    fontWeight = FontWeight.SemiBold
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = {
                            selectedType = "SUPPORT"
                            priceInput = String.format("%.2f", currentPrice * 0.995)
                        },
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (selectedType == "SUPPORT") BearishRed else DarkSurfaceVariant,
                            contentColor = Color.White
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(text = "🔴 Support (Drop)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = {
                            selectedType = "RESISTANCE"
                            priceInput = String.format("%.2f", currentPrice * 1.005)
                        },
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (selectedType == "RESISTANCE") BullishGreen else DarkSurfaceVariant,
                            contentColor = Color.White
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(text = "🟢 Resistance (Rise)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = priceInput,
                    onValueChange = { priceInput = it },
                    label = { Text("Target Level Harga ($)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AccentBlue,
                        unfocusedBorderColor = DarkBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = noteInput,
                    onValueChange = { noteInput = it },
                    label = { Text("Catatan Alert (Opsional)") },
                    placeholder = { Text("Contoh: Re-entry buy atau pasang SL") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AccentBlue,
                        unfocusedBorderColor = DarkBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val price = priceInput.toDoubleOrNull()
                    if (price != null && price > 0) {
                        onSaveAlert(price, selectedType, noteInput)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = AccentBlue)
            ) {
                Text(text = "Aktifkan Alert", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(text = "Batal", color = TextSecondary)
            }
        }
    )
}
