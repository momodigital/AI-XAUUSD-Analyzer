package com.aixauusd.analyzer.ui.dashboard.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aixauusd.analyzer.ui.theme.AccentBlue
import com.aixauusd.analyzer.ui.theme.DarkBorder
import com.aixauusd.analyzer.ui.theme.DarkSurface
import com.aixauusd.analyzer.ui.theme.TextPrimary
import com.aixauusd.analyzer.ui.theme.TextSecondary

@Composable
fun ChartToolbar(
    currentTimeframe: String,
    selectedIndicatorsCount: Int,
    isAnalyzingPattern: Boolean = false,
    onTimeframeSelected: (String) -> Unit,
    onOpenIndicatorsDialog: () -> Unit,
    onOneTapAnalysis: () -> Unit,
    onTakeScreenshot: () -> Unit,
    modifier: Modifier = Modifier
) {
    val timeframes = listOf("1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W")
    var isTfMenuExpanded by remember { mutableStateOf(false) }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(DarkSurface)
            .padding(horizontal = 10.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Timeframe selector
        Box {
            OutlinedButton(
                onClick = { isTfMenuExpanded = true },
                shape = RoundedCornerShape(8.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = TextPrimary
                ),
                modifier = Modifier.height(32.dp)
            ) {
                Text(
                    text = "TF: $currentTimeframe",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Icon(
                    imageVector = Icons.Default.ArrowDropDown,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
            }

            DropdownMenu(
                expanded = isTfMenuExpanded,
                onDismissRequest = { isTfMenuExpanded = false },
                modifier = Modifier.background(DarkSurface)
            ) {
                timeframes.forEach { tf ->
                    DropdownMenuItem(
                        text = {
                            Text(
                                text = tf,
                                color = if (tf == currentTimeframe) AccentBlue else TextPrimary,
                                fontWeight = if (tf == currentTimeframe) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        onClick = {
                            onTimeframeSelected(tf)
                            isTfMenuExpanded = false
                        }
                    )
                }
            }
        }

        // Indicators multi-select trigger
        OutlinedButton(
            onClick = onOpenIndicatorsDialog,
            shape = RoundedCornerShape(8.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = TextPrimary
            ),
            modifier = Modifier.height(32.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Tune,
                contentDescription = "Indikator",
                modifier = Modifier.size(14.dp),
                tint = AccentBlue
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = "Indikator ($selectedIndicatorsCount)",
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium
            )
        }

        // ⚡ One-Tap AI Technical Analysis Button
        Button(
            onClick = onOneTapAnalysis,
            enabled = !isAnalyzingPattern,
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = GoldYellow,
                contentColor = Color.Black
            ),
            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
            modifier = Modifier.height(32.dp)
        ) {
            if (isAnalyzingPattern) {
                CircularProgressIndicator(
                    modifier = Modifier.size(14.dp),
                    color = Color.Black,
                    strokeWidth = 2.dp
                )
            } else {
                Text(
                    text = "⚡ One-Tap AI",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.ExtraBold
                )
            }
        }

        // 📸 Screenshot Chart button
        Button(
            onClick = onTakeScreenshot,
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = AccentBlue,
                contentColor = Color.White
            ),
            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
            modifier = Modifier.height(32.dp)
        ) {
            Icon(
                imageVector = Icons.Default.CameraAlt,
                contentDescription = "Screenshot",
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = "📸",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun IndicatorsDialog(
    allIndicators: List<String>,
    selectedIndicators: Set<String>,
    onToggleIndicator: (String) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DarkSurface,
        title = {
            Text(
                text = "Pilih Indikator Teknikal",
                color = TextPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = 17.sp
            )
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                allIndicators.forEach { indicator ->
                    val isChecked = selectedIndicators.contains(indicator)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = isChecked,
                            onCheckedChange = { onToggleIndicator(indicator) },
                            colors = CheckboxDefaults.colors(
                                checkedColor = AccentBlue,
                                uncheckedColor = TextSecondary,
                                checkmarkColor = Color.White
                            )
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = indicator,
                            color = if (isChecked) TextPrimary else TextSecondary,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text(text = "Selesai", color = AccentBlue, fontWeight = FontWeight.Bold)
            }
        }
    )
}
