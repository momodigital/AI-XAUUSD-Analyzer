# 📱 Panduan Lengkap Build APK — AI XAUUSD & Forex Analyzer

### Metode 1: Build Cepat Lewat Terminal
```bash
# Di folder android/
chmod +x gradlew
./gradlew assembleDebug
```
Lokasi file APK: `app/build/outputs/apk/debug/app-debug.apk`

### Metode 2: Build via Android Studio
1. Buka folder android/ di Android Studio (Ladybug 2024.2+ / Koala / Hedgehog).
2. Sync Gradle selesai.
3. Klik Build > Build Bundle(s) / APK(s) > Build APK(s).
4. Klik 'locate' untuk mengambil file app-debug.apk.

### Metode 3: Build Otomatis di Cloud (GitHub Actions)
1. Push project ini ke GitHub.
2. Buka tab Actions -> Workflow "Build Android APK" otomatis mengompilasi APK.
3. Download app-debug.apk langsung dari Artifacts.