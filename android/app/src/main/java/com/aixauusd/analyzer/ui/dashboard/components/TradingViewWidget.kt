package com.aixauusd.analyzer.ui.dashboard.components

import android.annotation.SuppressLint
import android.graphics.Color
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun TradingViewWidget(
    symbol: String = "OANDA:XAUUSD",
    timeframe: String,
    indicators: Set<String>,
    modifier: Modifier = Modifier,
    onWebViewCreated: (WebView) -> Unit = {}
) {
    // Map human readable timeframe to TradingView interval code
    val intervalCode = remember(timeframe) {
        when (timeframe) {
            "1m" -> "1"
            "5m" -> "5"
            "15m" -> "15"
            "30m" -> "30"
            "1H" -> "60"
            "4H" -> "240"
            "1D" -> "D"
            "1W" -> "W"
            else -> "60"
        }
    }

    // Map indicator names to TradingView basic studies
    val studiesCode = remember(indicators) {
        val list = mutableListOf<String>()
        if (indicators.contains("EMA 20") || indicators.contains("EMA 50") || indicators.contains("EMA 200")) {
            list.add("MASimple@tv-basicstudies")
        }
        if (indicators.contains("RSI")) list.add("RSI@tv-basicstudies")
        if (indicators.contains("MACD")) list.add("MACD@tv-basicstudies")
        if (indicators.contains("Bollinger Bands")) list.add("BB@tv-basicstudies")
        if (indicators.contains("Volume")) list.add("Volume@tv-basicstudies")
        if (indicators.contains("Stochastic")) list.add("Stochastic@tv-basicstudies")
        list.joinToString(",")
    }

    val url = remember(symbol, intervalCode, studiesCode) {
        "file:///android_asset/tradingview.html?symbol=$symbol&interval=$intervalCode&studies=$studiesCode"
    }

    AndroidView(
        modifier = modifier,
        factory = { ctx ->
            WebView(ctx).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                setBackgroundColor(Color.parseColor("#0E1117"))

                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    loadWithOverviewMode = true
                    useWideViewPort = true
                    cacheMode = WebSettings.LOAD_DEFAULT
                    allowFileAccess = true
                    allowContentAccess = true
                }

                webChromeClient = WebChromeClient()
                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                    }
                }

                loadUrl(url)
                onWebViewCreated(this)
            }
        },
        update = { webView ->
            if (webView.url != url) {
                webView.loadUrl(url)
            }
        }
    )
}
