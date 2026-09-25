# Courier Simulator — Çalıştırma ve Paketleme (v0.3.0)

Tek kod tabanı ile 3 çıktı. Site: `index.html` (tanıtım + indirme),
oyun: `game.html` (Three.js, CDN + `assets/` gerekir).

Gerçek modeller `assets/` altındadır: `assets/city/` (City Pack bina/araç/yol/doku),
`assets/character/Adventurer.fbx` (Quaternius, animasyonlu),
`assets/package/package.fbx` (Isa Lousberg). Sayfa http ile sunulunca
(Pages / `npx serve` / APK / Electron) modeller yüklenir; dosya çift tıklanırsa
tarayıcı engeller, oyun yedek kutularla açılır.

## 1. Website (canlı)
- GitHub Pages `main` dalından yayınlanır:
- **https://keremmkilincc-wq.github.io/Couriersimulator/** → site
- **https://keremmkilincc-wq.github.io/Couriersimulator/game.html** → oyun
- Lokalde: `npx serve .` → `http://localhost:3000`

## 2. EXE (Windows)
- Otomatik: her `v*` tag'inde `.github/workflows/build-exe.yml` cloud'da
  Electron paketini derler ve release'e `CourierSimulator-Win-EXE.zip` ekler.
- Manuel: `npm install` → `npm run exe` → `release-exe/CourierSimulator-win32-x64/CourierSimulator.exe`
- Hızlı: `OYNA-Windows.bat` (tarayıcıda app modunda açar, kurulum yok).

## 3. APK (Android + joystick)
- Otomatik: her `v*` tag'inde `.github/workflows/build-apk.yml` cloud'da
  debug APK derler ve release'e `CourierSimulator.apk` ekler.
  Telefonda bilinmeyen kaynağa izin verip kur (yan yükleme).
- Mobil kontroller oyunda dahili: sol joystick, sağ swipe kamera,
  ▲ zıpla, ▼ kayma, ⚡ depar, E etkileşim.
- Manuel (Java 17 + Android SDK gerekir):
- `npm install` → `npx cap add android` → `npm run cap:sync` →
  `cd android && ./gradlew assembleDebug`

## Kontroller
WASD koş, Shift depar, Space zıpla/wall-jump, C kayma, E al/bırak/zipline, M motor, R reset.
Duvara hızlı sürt = wall-run. Mavi = yumuşak iniş, Sarı = sekme, Camgöbeği silindir = fan.

## Görev döngüsü
Depo (mor silindir) → E → iş seç → beacon'a git → E ile teslim → Bronz/Gümüş/Altın + para/puan.
