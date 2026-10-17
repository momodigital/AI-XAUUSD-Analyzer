package com.aixauusd.analyzer.data.repository

import com.aixauusd.analyzer.data.local.room.dao.PriceAlertDao
import com.aixauusd.analyzer.data.local.room.entity.PriceAlertEntity
import com.aixauusd.analyzer.data.notification.PriceAlertNotificationManager
import com.aixauusd.analyzer.data.remote.websocket.XauUsdTick
import com.aixauusd.analyzer.data.remote.websocket.XauUsdWebSocketClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PriceAlertRepository @Inject constructor(
    private val priceAlertDao: PriceAlertDao,
    private val webSocketClient: XauUsdWebSocketClient,
    private val notificationManager: PriceAlertNotificationManager
) {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    val allAlertsFlow: Flow<List<PriceAlertEntity>> = priceAlertDao.getAllAlerts()
    val liveTickFlow: StateFlow<XauUsdTick?> = webSocketClient.tickFlow

    init {
        webSocketClient.connect()
        observePriceTicksForAlerts()
    }

    private fun observePriceTicksForAlerts() {
        scope.launch {
            liveTickFlow.collect { tick ->
                if (tick != null) {
                    checkAndTriggerAlerts(tick.price)
                }
            }
        }
    }

    private suspend fun checkAndTriggerAlerts(currentPrice: Double) {
        val activeAlerts = priceAlertDao.getActiveAlerts()
        for (alert in activeAlerts) {
            val isBreached = if (alert.alertType.uppercase() == "SUPPORT") {
                currentPrice <= alert.targetPrice
            } else {
                currentPrice >= alert.targetPrice
            }

            if (isBreached) {
                // Post local/push notification
                notificationManager.showPriceBreachNotification(alert, currentPrice)
                // Mark alert as triggered
                priceAlertDao.markTriggered(alert.id, System.currentTimeMillis())
            }
        }
    }

    suspend fun createAlert(targetPrice: Double, alertType: String, note: String = ""): Long {
        val entity = PriceAlertEntity(
            targetPrice = targetPrice,
            alertType = alertType.uppercase(),
            note = note,
            isEnabled = true,
            isTriggered = false
        )
        return priceAlertDao.insertAlert(entity)
    }

    suspend fun toggleAlert(id: Long, isEnabled: Boolean) {
        priceAlertDao.toggleAlert(id, isEnabled)
    }

    suspend fun deleteAlert(id: Long) {
        priceAlertDao.deleteAlert(id)
    }
}
