# AI XAUUSD Analyzer — Android Native (Jetpack Compose)

Aplikasi Android native produksi untuk analisa teknikal pasar emas Spot (**XAUUSD • OANDA**) bertenaga Artificial Intelligence Multimodal. Menggabungkan charting real-time TradingView, capture snapshot otomatis via `PixelCopy`, dan analisis mendalam menggunakan model AI terkini (**Google Gemini**, **Groq Llama 3.3**, **OpenAI GPT-4o**, dan **OpenRouter**).

---

## 🏗️ Arsitektur & Teknologi

- **Bahasa**: Kotlin 2.0+
- **UI Toolkit**: Jetpack Compose + Material 3 (Dark Theme default `#0E1117`)
- **Arsitektur**: Clean Architecture + MVVM (Model-View-ViewModel)
- **Dependency Injection**: Hilt (Dagger)
- **Database Lokal**: Room DB (riwayat chat & riwayat analisa chart)
- **Penyimpanan Konfigurasi**: Jetpack DataStore Preferences + Android Jetpack Security (`EncryptedSharedPreferences` untuk keamanan API Key dengan enkripsi AES-256)
- **Networking**: Retrofit 2 + OkHttp 4 + Gson
- **Chart**: TradingView Advanced Candlestick Chart via WebView (`OANDA:XAUUSD`)
- **Image Capture & Multimodal**: Android `PixelCopy` API + `WebView.draw(Canvas)` fallback, base64 JPEG encoder, dan Coil Compose untuk visualisasi thumbnail.

---

## 📁 Struktur Direktori Proyek

```
android/
├── gradle/
│   └── libs.versions.toml                     # Version catalog dependensi modern
├── app/
│   ├── build.gradle.kts                       # Konfigurasi modul app & dependensi
│   ├── src/main/
│   │   ├── AndroidManifest.xml                # Izin kamera, internet, media storage
│   │   ├── assets/
│   │   │   └── tradingview.html               # Template resmi embed TradingView
│   │   ├── res/
│   │   │   └── values/
│   │   │       ├── strings.xml                # Resource teks Bahasa Indonesia
│   │   │       ├── colors.xml                 # Palet warna gelap Material 3
│   │   │       └── themes.xml                 # Window flags & styling
│   │   └── java/com/aixauusd/analyzer/
│   │       ├── XauUsdApp.kt                   # Hilt Application Class
│   │       ├── MainActivity.kt                # Single Activity edge-to-edge
│   │       ├── navigation/
│   │       │   └── NavGraph.kt                # Compose Navigation (Dashboard & Settings)
│   │       ├── ui/
│   │       │   ├── theme/                     # Color.kt, Theme.kt, Type.kt
│   │       │   ├── dashboard/
│   │       │   │   ├── DashboardScreen.kt     # Layar utama (TopBar, Chart, Chips, Chat)
│   │       │   │   ├── DashboardViewModel.kt  # State handling, capture, flow chat
│   │       │   │   └── components/
│   │       │   │       ├── TradingViewWidget.kt
│   │       │   │       ├── ChartToolbar.kt
│   │       │   │       ├── TemplateChipsRow.kt
│   │       │   │       ├── AnalysisBottomSheet.kt
│   │       │   │       └── ChatSection.kt
│   │       │   └── settings/
│   │       │       ├── SettingsScreen.kt      # Layar konfigurasi multi-provider AI
│   │       │       └── SettingsViewModel.kt   # Preference & test ping latency
│   │       ├── data/
│   │       │   ├── local/
│   │       │   │   ├── datastore/PreferencesManager.kt
│   │       │   │   └── room/
│   │       │   │       ├── AppDatabase.kt
│   │       │   │       ├── dao/ChatDao.kt & AnalysisDao.kt
│   │       │   │       └── entity/ChatMessageEntity.kt & AnalysisEntity.kt
│   │       │   ├── remote/
│   │       │   │   ├── api/GeminiApiService.kt & OpenAiCompatibleApiService.kt
│   │       │   │   ├── dto/GeminiDto.kt & OpenAiDto.kt
│   │       │   │   └── provider/
│   │       │   │       ├── AiProvider.kt (Interface)
│   │       │   │       ├── GeminiProvider.kt
│   │       │   │       ├── OpenAiProvider.kt
│   │       │   │       ├── GroqProvider.kt
│   │       │   │       ├── OpenRouterProvider.kt
│   │       │   │       └── AiProviderFactory.kt
│   │       │   └── repository/
│   │       │       ├── ChatRepository.kt
│   │       │       └── SettingsRepository.kt
│   │       ├── di/                            # AppModule, DatabaseModule, NetworkModule
│   │       └── util/                          # BitmapUtils.kt, WebViewCapture.kt
├── build.gradle.kts                           # Root build script
├── settings.gradle.kts                        # Root project setup
└── README.md
```

---

## 🚀 Cara Build & Menjalankan Aplikasi

### Syarat Perangkat Lunak:
- **Android Studio Ladybug (2024.2+)** atau **Koala / Hedgehog**
- **JDK 17** (disetel di `File > Settings > Build, Execution, Deployment > Build Tools > Gradle > Gradle JDK`)
- **Android SDK API 35** (Minimum SDK: API 26 / Android 8.0)

### Langkah Kompilasi:
1. Buka folder `android/` di Android Studio via menu **File > Open**.
2. Biarkan Gradle melakukan sinkronisasi otomatis (`Sync Project with Gradle Files`).
3. Sambungkan HP Android atau nyalakan Emulator (Android 10+ direkomendasikan).
4. Jalankan perintah terminal atau klik tombol hijau **Run 'app'**:
   ```bash
   ./gradlew assembleDebug
   # Atau langsung install ke perangkat yang terhubung:
   ./gradlew installDebug
   ```

---

## 🔑 Cara Konfigurasi API Key di Aplikasi

Aplikasi tidak menggunakan hardcoded API key demi keamanan. Buka icon ⚙️ **Settings** di pojok kanan atas aplikasi:

### 1. Opsi Provider Gratis — Groq (Sangat Cepat & Tanpa Kartu Kredit):
1. Buka [https://console.groq.com/keys](https://console.groq.com/keys) lalu buat API key gratis (`gsk_...`).
2. Di Settings aplikasi, pilih tab **Groq (Free)**.
3. Tempel API key di kolom yang disediakan.
4. Model default otomatis: `llama-3.3-70b-versatile`.
5. Tekan tombol **Test Endpoint** untuk memverifikasi ping (rata-rata 150-300ms).
6. Tekan **Simpan**.

### 2. Opsi Google Gemini (Multimodal Vision Chart Paling Direkomendasikan):
1. Buka [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2. Dapatkan API Key Gemini.
3. Di Settings aplikasi, pilih varian model:
   - `gemini-3.8-flash` (Paling cepat dan membaca chart dengan sangat teliti).
   - `gemini-4-argon` (Reasoning mendalam untuk analisa tren jangka panjang).
4. Masukkan API Key Anda pada kolom **Gemini API Key**.
5. Tekan **Test Endpoint** lalu **Simpan**.

### 3. Opsi OpenAI / OpenRouter:
- Mendukung model seperti `gpt-4o-mini`, `gpt-4o`, atau `google/gemini-flash-1.5` via OpenRouter.
- Masukkan API Key dan Base URL jika Anda menggunakan proxy lokal atau gateway kustom.

---

## 💡 Alur Penggunaan Fitur Screenshot Analisa

1. Pada layar Dashboard, tentukan Timeframe (misal `1H` atau `15m`) dan aktifkan indikator teknikal (misal `EMA 20, EMA 50, RSI, MACD`).
2. Tekan tombol **📸 Screenshot** di atas chart.
3. Sistem secara otomatis menjalankan `PixelCopy` terhadap tampilan WebView TradingView secara real-time.
4. Muncul dialog **Perintah Analisa (Manual)**:
   - Anda dapat menggunakan prompt otomatis atau mengetikkan pertanyaan khusus (misal: *"Cari area fibonacci retracement 61.8% dan tentukan posisi Stop Loss yang aman"*).
5. Tekan **Analisa dengan AI**. Gambar dan prompt dikirim ke model aktif.
6. Hasil analisa terstruktur lengkap dengan harga entry, target take profit, level stop loss, dan pola candlestick akan muncul di kolom percakapan chat dan tersimpan permanen di database Room lokal.
