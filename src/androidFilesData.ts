export interface AndroidFile {
  path: string;
  name: string;
  category: 'gradle' | 'manifest' | 'ui' | 'data' | 'di' | 'util' | 'res' | 'docs';
  content: string;
}

export const ANDROID_FILES: AndroidFile[] = [
  {
    path: 'gradle/libs.versions.toml',
    name: 'libs.versions.toml',
    category: 'gradle',
    content: `[versions]
agp = "8.6.1"
kotlin = "2.0.21"
coreKtx = "1.15.0"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.9.3"
composeBom = "2024.11.00"
navigationCompose = "2.8.4"
hilt = "2.52"
hiltNavigationCompose = "1.2.0"
room = "2.6.1"
datastore = "1.1.1"
securityCrypto = "1.1.0-alpha06"
retrofit = "2.11.0"
okhttp = "4.12.0"
gson = "2.11.0"
coil = "2.7.0"
ksp = "2.0.21-1.0.28"
coroutines = "1.9.0"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigationCompose" }
hilt-android = { group = "com.google.dagger", name = "hilt-android", version.ref = "hilt" }
hilt-compiler = { group = "com.google.dagger", name = "hilt-android-compiler", version.ref = "hilt" }
androidx-hilt-navigation-compose = { group = "androidx.hilt", name = "hilt-navigation-compose", version.ref = "hiltNavigationCompose" }
room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }
androidx-datastore-preferences = { group = "androidx.datastore", name = "datastore-preferences", version.ref = "datastore" }
androidx-security-crypto = { group = "androidx.security", name = "security-crypto", version.ref = "securityCrypto" }
retrofit = { group = "com.squareup.retrofit2", name = "retrofit", version.ref = "retrofit" }
retrofit-converter-gson = { group = "com.squareup.retrofit2", name = "converter-gson", version.ref = "retrofit" }
okhttp = { group = "com.squareup.okhttp3", name = "okhttp", version.ref = "okhttp" }
okhttp-logging = { group = "com.squareup.okhttp3", name = "logging-interceptor", version.ref = "okhttp" }
gson = { group = "com.google.code.gson", name = "gson", version.ref = "gson" }
coil-compose = { group = "io.coil-kt", name = "coil-compose", version.ref = "coil" }
kotlinx-coroutines-core = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-core", version.ref = "coroutines" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'manifest',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <application
        android:name=".XauUsdApp"
        android:allowBackup="true"
        android:label="@string/app_name"
        android:theme="@style/Theme.AiXauUsdAnalyzer"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
  },
  {
    path: 'app/src/main/java/com/aixauusd/analyzer/data/local/room/entity/PriceAlertEntity.kt',
    name: 'PriceAlertEntity.kt',
    category: 'data',
    content: `package com.aixauusd.analyzer.data.local.room.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "price_alerts")
data class PriceAlertEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val targetPrice: Double,
    val alertType: String, // "SUPPORT" or "RESISTANCE"
    val isEnabled: Boolean = true,
    val isTriggered: Boolean = false,
    val note: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val triggeredAt: Long? = null
)`
  },
  {
    path: 'app/src/main/java/com/aixauusd/analyzer/data/local/room/dao/PriceAlertDao.kt',
    name: 'PriceAlertDao.kt',
    category: 'data',
    content: `package com.aixauusd.analyzer.data.local.room.dao

import androidx.room.*
import com.aixauusd.analyzer.data.local.room.entity.PriceAlertEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PriceAlertDao {
    @Query("SELECT * FROM price_alerts ORDER BY createdAt DESC")
    fun getAllAlerts(): Flow<List<PriceAlertEntity>>

    @Query("SELECT * FROM price_alerts WHERE isEnabled = 1 AND isTriggered = 0")
    suspend fun getActiveAlerts(): List<PriceAlertEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAlert(alert: PriceAlertEntity): Long

    @Query("UPDATE price_alerts SET isEnabled = :enabled WHERE id = :id")
    suspend fun toggleAlert(id: Long, enabled: Boolean)

    @Query("UPDATE price_alerts SET isTriggered = 1, triggeredAt = :timestamp WHERE id = :id")
    suspend fun markTriggered(id: Long, timestamp: Long)

    @Query("DELETE FROM price_alerts WHERE id = :id")
    suspend fun deleteAlert(id: Long)
}`
  },
  {
    path: 'app/src/main/java/com/aixauusd/analyzer/data/remote/websocket/XauUsdWebSocketClient.kt',
    name: 'XauUsdWebSocketClient.kt',
    category: 'data',
    content: `package com.aixauusd.analyzer.data.remote.websocket

import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import okhttp3.*
import javax.inject.Inject
import javax.inject.Singleton

data class XauUsdTick(
    @SerializedName("price") val price: Double,
    @SerializedName("bid") val bid: Double,
    @SerializedName("ask") val ask: Double,
    @SerializedName("change") val change: Double,
    @SerializedName("changePercent") val changePercent: Double,
    @SerializedName("timestamp") val timestamp: Long
)

data class WebSocketMessage(
    @SerializedName("type") val type: String,
    @SerializedName("data") val data: XauUsdTick?
)

@Singleton
class XauUsdWebSocketClient @Inject constructor(
    private val okHttpClient: OkHttpClient,
    private val gson: Gson
) {
    private val _tickFlow = MutableStateFlow<XauUsdTick?>(null)
    val tickFlow: StateFlow<XauUsdTick?> = _tickFlow

    fun connect(wsUrl: String) {
        val request = Request.Builder().url(wsUrl).build()
        okHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                val msg = gson.fromJson(text, WebSocketMessage::class.java)
                msg.data?.let { _tickFlow.value = it }
            }
        })
    }
}`
  },
  {
    path: 'app/src/main/java/com/aixauusd/analyzer/data/notification/PriceAlertNotificationManager.kt',
    name: 'PriceAlertNotificationManager.kt',
    category: 'data',
    content: `package com.aixauusd.analyzer.data.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.aixauusd.analyzer.data.local.room.entity.PriceAlertEntity
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PriceAlertNotificationManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        const val CHANNEL_ID = "xauusd_price_alerts"
    }

    init {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "XAUUSD Price Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 300, 200, 300)
            }
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    fun showPriceBreachNotification(alert: PriceAlertEntity, currentPrice: Double) {
        val title = if (alert.alertType == "SUPPORT") {
            "🔴 XAUUSD Menembus Support: $\${alert.targetPrice}"
        } else {
            "🟢 XAUUSD Menembus Resistance: $\${alert.targetPrice}"
        }
        val text = "Harga saat ini: $\${currentPrice}. Siapkan order atau kelola risiko."

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        NotificationManagerCompat.from(context).notify(alert.id.toInt(), notification)
    }
}`
  },
  {
    path: 'app/src/main/java/com/aixauusd/analyzer/data/repository/PriceAlertRepository.kt',
    name: 'PriceAlertRepository.kt',
    category: 'data',
    content: `package com.aixauusd.analyzer.data.repository

import com.aixauusd.analyzer.data.local.room.dao.PriceAlertDao
import com.aixauusd.analyzer.data.local.room.entity.PriceAlertEntity
import com.aixauusd.analyzer.data.notification.PriceAlertNotificationManager
import com.aixauusd.analyzer.data.remote.websocket.XauUsdWebSocketClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PriceAlertRepository @Inject constructor(
    private val priceAlertDao: PriceAlertDao,
    private val webSocketClient: XauUsdWebSocketClient,
    private val notificationManager: PriceAlertNotificationManager
) {
    val liveTickFlow = webSocketClient.tickFlow
    val allAlertsFlow = priceAlertDao.getAllAlerts()

    init {
        CoroutineScope(Dispatchers.IO).launch {
            liveTickFlow.collect { tick ->
                if (tick != null) {
                    val active = priceAlertDao.getActiveAlerts()
                    active.forEach { alert ->
                        val breached = if (alert.alertType == "SUPPORT") tick.price <= alert.targetPrice else tick.price >= alert.targetPrice
                        if (breached) {
                            notificationManager.showPriceBreachNotification(alert, tick.price)
                            priceAlertDao.markTriggered(alert.id, System.currentTimeMillis())
                        }
                    }
                }
            }
        }
    }

    suspend fun createAlert(targetPrice: Double, alertType: String, note: String) =
        priceAlertDao.insertAlert(PriceAlertEntity(targetPrice = targetPrice, alertType = alertType, note = note))

    suspend fun deleteAlert(id: Long) = priceAlertDao.deleteAlert(id)
    suspend fun toggleAlert(id: Long, enabled: Boolean) = priceAlertDao.toggleAlert(id, enabled)
}`
  },
  {
    path: 'app/src/main/java/com/aixauusd/analyzer/ui/dashboard/components/PatternOverlayCard.kt',
    name: 'PatternOverlayCard.kt',
    category: 'ui',
    content: `package com.aixauusd.analyzer.ui.dashboard.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAlert
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aixauusd.analyzer.data.remote.dto.PatternDetectionResult
import com.aixauusd.analyzer.ui.theme.*

@Composable
fun PatternOverlayCard(
    pattern: PatternDetectionResult?,
    symbol: String,
    onApplyAlerts: (support: Double, resistance: Double) -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    AnimatedVisibility(
        visible = pattern != null,
        enter = fadeIn() + slideInVertically { it / 2 },
        exit = fadeOut() + slideOutVertically { it / 2 },
        modifier = modifier
    ) {
        if (pattern == null) return@AnimatedVisibility

        val isBullish = pattern.bias.uppercase() == "BULLISH"
        val biasColor = if (isBullish) BullishGreen else BearishRed
        val biasArrow = if (isBullish) "↗ Bullish" else "↘ Bearish"

        Surface(
            shape = RoundedCornerShape(12.dp),
            color = DarkSurface.copy(alpha = 0.94f),
            border = androidx.compose.foundation.BorderStroke(1.5.dp, biasColor.copy(alpha = 0.7f)),
            shadowElevation = 8.dp,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 6.dp)
        ) {
            Column(modifier = Modifier.padding(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = GoldYellow.copy(alpha = 0.2f),
                            modifier = Modifier.padding(end = 6.dp)
                        ) {
                            Text(
                                text = "⚡ AI Vision",
                                color = GoldYellow,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }

                        Text(
                            text = pattern.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.ExtraBold,
                            color = TextPrimary
                        )
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = biasColor.copy(alpha = 0.2f)
                        ) {
                            Text(
                                text = "\$biasArrow (\${pattern.confidence}%)",
                                color = biasColor,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(6.dp))

                        IconButton(onClick = onDismiss, modifier = Modifier.size(24.dp)) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Tutup",
                                tint = TextSecondary,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(DarkSurfaceVariant, RoundedCornerShape(8.dp))
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(text = "Support", fontSize = 10.sp, color = TextSecondary)
                        Text(
                            text = "\${pattern.supportLevel}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = BearishRed
                        )
                    }

                    Column {
                        Text(text = "Resistance", fontSize = 10.sp, color = TextSecondary)
                        Text(
                            text = "\${pattern.resistanceLevel}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = BullishGreen
                        )
                    }

                    Column {
                        Text(text = "Target (TP)", fontSize = 10.sp, color = TextSecondary)
                        Text(
                            text = "\${pattern.targetProfit}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = AccentBlueLight
                        )
                    }

                    Column {
                        Text(text = "Stop Loss", fontSize = 10.sp, color = TextSecondary)
                        Text(
                            text = "\${pattern.stopLoss}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = TextMuted
                        )
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = pattern.summary,
                    fontSize = 11.sp,
                    color = TextSecondary,
                    lineHeight = 15.sp,
                    maxLines = 2
                )

                Spacer(modifier = Modifier.height(8.dp))

                Button(
                    onClick = {
                        onApplyAlerts(pattern.supportLevel, pattern.resistanceLevel)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(32.dp),
                    shape = RoundedCornerShape(6.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AccentBlue),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.AddAlert,
                        contentDescription = null,
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "📌 Pasang Alert Support (\${pattern.supportLevel}) & Resistance (\${pattern.resistanceLevel})",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/aixauusd/analyzer/ui/dashboard/components/PriceAlertCard.kt',
    name: 'PriceAlertCard.kt',
    category: 'ui',
    content: `package com.aixauusd.analyzer.ui.dashboard.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAlert
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.Close
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

@Composable
fun PriceAlertHeaderBar(
    tick: XauUsdTick?,
    alerts: List<PriceAlertEntity>,
    onOpenAddAlert: () -> Unit,
    onDeleteAlert: (Long) -> Unit,
    onToggleAlert: (Long, Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    var previousPrice by remember { mutableStateOf(tick?.price ?: 2674.85) }
    var flashColor by remember { mutableStateOf<Color?>(null) }

    LaunchedEffect(tick?.price) {
        val current = tick?.price ?: return@LaunchedEffect
        if (current > previousPrice) {
            flashColor = BullishGreen.copy(alpha = 0.25f)
        } else if (current < previousPrice) {
            flashColor = BearishRed.copy(alpha = 0.25f)
        }
        previousPrice = current
        kotlinx.coroutines.delay(500)
        flashColor = null
    }

    val animatedBg by animateColorAsState(
        targetValue = flashColor ?: DarkSurfaceVariant,
        animationSpec = tween(durationMillis = 300),
        label = "price_flash"
    )

    val isBullish = (tick?.change ?: 0.0) >= 0.0

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(animatedBg)
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .background(if (isBullish) BullishGreen else BearishRed, CircleShape)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "\${tick?.price ?: 2674.85}",
                    fontSize = 17.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.ExtraBold,
                    color = if (isBullish) BullishGreen else BearishRed
                )
                Spacer(modifier = Modifier.width(8.dp))
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = if (isBullish) BullishGreen.copy(alpha = 0.15f) else BearishRed.copy(alpha = 0.15f)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                    ) {
                        Icon(
                            imageVector = if (isBullish) Icons.Default.ArrowUpward else Icons.Default.ArrowDownward,
                            contentDescription = null,
                            tint = if (isBullish) BullishGreen else BearishRed,
                            modifier = Modifier.size(10.dp)
                        )
                        Text(
                            text = "\${if (isBullish) \"+\" else \"\"}\${String.format(\"%.2f\", tick?.changePercent ?: 0.0)}%",
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            color = if (isBullish) BullishGreen else BearishRed
                        )
                    }
                }
            }

            OutlinedButton(
                onClick = onOpenAddAlert,
                shape = RoundedCornerShape(8.dp),
                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = AccentBlueLight)
            ) {
                Icon(
                    imageVector = Icons.Default.AddAlert,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(text = "Set Alert", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        if (alerts.isNotEmpty()) {
            Spacer(modifier = Modifier.height(6.dp))
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(alerts) { alert ->
                    val isSupport = alert.alertType == "SUPPORT"
                    val tagColor = if (isSupport) BearishRed else BullishGreen

                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = tagColor.copy(alpha = 0.12f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, tagColor.copy(alpha = 0.35f))
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "\${if (isSupport) \"S\" else \"R\"}: \${alert.targetPrice}",
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                color = tagColor
                            )
                            Spacer(modifier = Modifier.width(4.dp))
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
}`
  },
  {
    path: 'app/src/main/java/com/aixauusd/analyzer/ui/dashboard/DashboardScreen.kt',
    name: 'DashboardScreen.kt',
    category: 'ui',
    content: `// TopAppBar, PriceAlertHeaderBar, TradingView chart, Toolbar, Chips, Chat, BottomSheet`
  },
  {
    path: 'app/src/main/java/com/aixauusd/analyzer/ui/dashboard/DashboardViewModel.kt',
    name: 'DashboardViewModel.kt',
    category: 'ui',
    content: `// StateFlow management, PriceAlertRepository binding, screenshot dispatch, multi-provider AI execution`
  },
  {
    path: 'app/src/main/java/com/aixauusd/analyzer/data/remote/provider/GeminiProvider.kt',
    name: 'GeminiProvider.kt',
    category: 'data',
    content: `// Multimodal Gemini implementation using inline_data Base64 JPEG`
  },
  {
    path: 'app/src/main/java/com/aixauusd/analyzer/data/remote/provider/GroqProvider.kt',
    name: 'GroqProvider.kt',
    category: 'data',
    content: `// Groq free-tier implementation for fast technical analysis`
  },
  {
    path: 'app/src/main/java/com/aixauusd/analyzer/data/local/datastore/PreferencesManager.kt',
    name: 'PreferencesManager.kt',
    category: 'data',
    content: `// Jetpack DataStore Preferences + MasterKey EncryptedSharedPreferences`
  },
  {
    path: 'app/src/main/java/com/aixauusd/analyzer/data/local/room/AppDatabase.kt',
    name: 'AppDatabase.kt',
    category: 'data',
    content: `// Room DB for chat history, analysis history, and price alerts`
  },
  {
    path: 'README.md',
    name: 'README.md',
    category: 'docs',
    content: `// Build guide, Gradle sync, WebSocket price alert instructions, API Key configuration`
  }
];
