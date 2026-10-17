package com.aixauusd.analyzer.util

import android.app.Activity
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Rect
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import android.webkit.WebView
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

object WebViewCapture {

    /**
     * Captures the visible content of a WebView as a Bitmap.
     * Uses PixelCopy on Android O+ (API 26+) for hardware-accelerated accuracy,
     * with graceful fallback to Canvas drawing.
     */
    suspend fun capture(webView: WebView, activity: Activity): Bitmap? {
        val width = webView.width
        val height = webView.height

        if (width <= 0 || height <= 0) return null

        return suspendCancellableCoroutine { continuation ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try {
                    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                    val location = IntArray(2)
                    webView.getLocationInWindow(location)

                    val rect = Rect(
                        location[0],
                        location[1],
                        location[0] + width,
                        location[1] + height
                    )

                    PixelCopy.request(
                        activity.window,
                        rect,
                        bitmap,
                        { copyResult ->
                            if (copyResult == PixelCopy.SUCCESS) {
                                continuation.resume(bitmap)
                            } else {
                                // Fallback to software Canvas draw if PixelCopy returns non-success
                                val fallbackBitmap = captureViaCanvas(webView, width, height)
                                continuation.resume(fallbackBitmap)
                            }
                        },
                        Handler(Looper.getMainLooper())
                    )
                } catch (e: Exception) {
                    e.printStackTrace()
                    continuation.resume(captureViaCanvas(webView, width, height))
                }
            } else {
                continuation.resume(captureViaCanvas(webView, width, height))
            }
        }
    }

    private fun captureViaCanvas(webView: WebView, width: Int, height: Int): Bitmap? {
        return try {
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            webView.draw(canvas)
            bitmap
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
