package com.aixauusd.analyzer.data.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.aixauusd.analyzer.MainActivity
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
        const val CHANNEL_NAME = "XAUUSD Price Alerts"
        const val CHANNEL_DESC = "Notifikasi saat harga emas menembus level Support atau Resistance"
    }

    init {
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = CHANNEL_DESC
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 300, 200, 300)
            }
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    fun showPriceBreachNotification(alert: PriceAlertEntity, currentPrice: Double) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            alert.id.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val isSupport = alert.alertType.uppercase() == "SUPPORT"
        val title = if (isSupport) {
            "🔴 XAUUSD Menembus Support: $${String.format("%.2f", alert.targetPrice)}"
        } else {
            "🟢 XAUUSD Menembus Resistance: $${String.format("%.2f", alert.targetPrice)}"
        }

        val content = "Harga terkini: $${String.format("%.2f", currentPrice)}. " +
                (if (alert.note.isNotBlank()) "Catatan: ${alert.note}" else "Pertimbangkan eksekusi order atau trailing stop.")

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText(content)
            .setStyle(NotificationCompat.BigTextStyle().bigText(content))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setVibrate(longArrayOf(0, 300, 200, 300))
            .build()

        try {
            NotificationManagerCompat.from(context).notify(alert.id.toInt(), notification)
        } catch (e: SecurityException) {
            // Missing POST_NOTIFICATIONS permission
            e.printStackTrace()
        }
    }
}
