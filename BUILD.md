# Courier Simulator MVP — Çalıştırma ve Paketleme

Tek kod tabanı ile 3 çıktı. FBX City Pack bu MVP'de prosedürel şehir olarak temsil edilir
(performans + Web uyumu için). Gerçek FBX'ler `assets-source/` notunda durur.

## 1. Web (hemen oyna)
- Bu klasörü GitHub Pages'e aç veya lokalde çalıştır:
- `npx serve .` → `http://localhost:3000`
- `index.html` Three.js CDN kullanır, internet gerekir.

## 2. EXE (Windows)
- `npm install` → `npm run exe`
- Çıktı: `CourierSimulator-win32-x64/` → `CourierSimulator.exe`
- Alternatif portsuz: Electron olmadan Chrome ile `index.html` açmak da aynı oyundur.

## 3. APK (Android + joystick)
- Mobil kontroller dahili: sol joystick, sağ swipe kamera, ▲ zıpla, ▼ kayma, ⚡ depar, E etkileşim.
- Gerçek APK için:
- `npm i @capacitor/core @capacitor/cli` → `npx cap init` → `npx cap add android` → `npx cap copy` → Android Studio'da APK build.
- Bu repo `capacitor.config.json` ile hazırdır. Java 17 + Android SDK gerekir (bu PC'de Java 8 var, yükseltmeden APK derlenemez).

## Kontroller
WASD koş, Shift depar, Space zıpla/wall-jump, C kayma, E al/bırak/zipline, M motor, R reset.
Duvara hızlı sürt = wall-run. Mavi = yumuşak iniş, Sarı = sekme, Camgöbeği silindir = fan.

## Görev döngüsü
Depo (mor silindir) → E → iş seç → beacon'a git → E ile teslim → Bronz/Gümüş/Altın + para/puan.
