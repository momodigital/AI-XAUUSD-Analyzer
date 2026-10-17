package com.aixauusd.analyzer.ui.dashboard.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aixauusd.analyzer.ui.theme.DarkBorder
import com.aixauusd.analyzer.ui.theme.DarkSurfaceVariant
import com.aixauusd.analyzer.ui.theme.TextPrimary

@Composable
fun TemplateChipsRow(
    onChipSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val templates = listOf(
        "Analisa trend saat ini",
        "Cari area support & resistance",
        "Ada pola candlestick penting?",
        "Sinyal entry buy/sell?",
        "Rekomendasi SL & TP",
        "Kondisi overbought/oversold?",
        "Breakout atau fakeout?"
    )

    LazyRow(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(horizontal = 12.dp)
    ) {
        items(templates) { template ->
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(16.dp))
                    .background(DarkSurfaceVariant)
                    .clickable { onChipSelected(template) }
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = template,
                    color = TextPrimary,
                    fontSize = 12.sp
                )
            }
        }
    }
}
