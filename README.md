<div align="center">

# 📦 COURIER SIMULATOR
### *Şehrin en hızlı kuryesi ol — çatılardan uç, duvarda koş, paketi zamanında bırak.*

[![Version](https://img.shields.io/badge/version-v0.2.0-8b5cf6?style=for-the-badge)](https://github.com/keremmkilincc-wq/Couriersimulator/releases)
[![Web](https://img.shields.io/badge/▶_WEB-hemen_oyna-22c55e?style=for-the-badge)](https://keremmkilincc-wq.github.io/Couriersimulator/game.html)
[![Windows](https://img.shields.io/badge/🖥_EXE-auto_build-3b82f6?style=for-the-badge)](https://github.com/keremmkilincc-wq/Couriersimulator/releases)
[![Android](https://img.shields.io/badge/📱_APK-auto_build-f59e0b?style=for-the-badge)](https://github.com/keremmkilincc-wq/Couriersimulator/releases)
[![License](https://img.shields.io/badge/license-MIT-6b7280?style=for-the-badge)](LICENSE)
[![GDD](https://img.shields.io/badge/📖_GDD-tasarım_belgesi-ec4899?style=for-the-badge)](GDD.md)

**Site:** https://keremmkilincc-wq.github.io/Couriersimulator/ · **Oyun:** https://keremmkilincc-wq.github.io/Couriersimulator/game.html

**Tek kod tabanı → 3 platform:** 🌐 Web (canlı) · 🖥 EXE (her sürümde otomatik derlenir) · 📱 APK (her sürümde otomatik derlenir)

[🎮 Hemen Oyna](#-hızlı-başlangıç) · [📖 GDD](GDD.md) · [📦 Releases](https://github.com/keremmkilincc-wq/Couriersimulator/releases) · [🛠 Kurulum](#-kurulum) · [🗺 Yol Haritası](#-yol-haritası)

</div>

---

## 🎬 Nedir bu oyun?

Üçüncü şahıs **3D parkur + kurye simülasyonu**. Depodan paketi kap, şehrin sana sunduğu üç yoldan birini seç, **Bronz / Gümüş / Altın** derecesiyle teslim et:

```
   SOKAK  → güvenli ama yavaş   (vault + slide cenneti)
   ÇATI   → riskli ama hızlı    (wall-run + gap jump)
   KESTİRME → sadece ustalar    (zipline + fan + gizli hat)
```

> 💡 Felsefe: **Durmak cezadır, akmak ödüldür.** 5-7 saniye temiz zincir → **FLOW STATE**: müzik yükselir, FOV açılır, hız bonusu gelir.

---

## 🎮 Hızlı Başlangıç

| Yol | Komut / Adım |
|---|---|
| 🌐 **Web (önerilen)** | **https://keremmkilincc-wq.github.io/Couriersimulator/game.html** — kurulum yok, hemen oyna |
| 🖥 **Windows EXE** | [Releases](https://github.com/keremmkilincc-wq/Couriersimulator/releases) → `CourierSimulator-Win-EXE.zip` (otomatik derleme; yoksa `OYNA-Windows.bat`) |
| 📱 **Android APK** | [Releases](https://github.com/keremmkilincc-wq/Couriersimulator/releases) → `CourierSimulator.apk` (otomatik derleme, yandan kur) |

İnternet gerekir (Three.js CDN). Kurulum gerekmez, kayıtlar tarayıcıda saklanır.

---

## 🕹 Kontroller

### ⌨️ Klavye + Fare (PC / Web)

| Tuş | Hareket |
|---|---|
| `W A S D` | Koş (kamera yönüne göre) |
| `Shift` | Depar (hız patlaması) |
| `Space` | Zıpla · havada duvardaysan **Wall-Jump** · kayarken basarsan **Slide-Hop** |
| `C` | Kayma (Crouch Slide) — yokuşta hızlandırır |
| `E` | Paket al / teslim et / Zipline'a bin |
| `M` | Motor modu (hızlı transfer, parkursuz) |
| `R` | Takılırsan yeniden doğ (+5 sn ceza) |
| `Fare` | Kamera (sürükle) |

### 📱 Dokunmatik (Mobil)

| Kontrol | İşlev |
|---|---|
| 🕹 Sol joystick | Hareket |
| 👉 Sağ yarı swipe | Kamera |
| `▲` | Zıpla |
| `▼` | Kayma |
| `⚡` | Depar aç/kapa |
| `E` | Etkileşim |

---

## 📦 Paketler — paketi seçmek rotayı seçmektir

| Paket | Özellik | İdeal rota |
|---|---|---|
| ✉️ Standart Zarf | Hafif, dayanıklı | Serbest — ısınma |
| 🫗 Cam Vazo (kırılabilir) | Sert inişte **%34 hasar** | Alçak + yumuşak (konteyner/tente) |
| 🍕 Sıcak Lahmacun | Süre dar, **ısısı bitiyor** | En hızlı hat: zipline + fan |
| 💧 Damacana (ağır) | **0.82x hız**, alçak zıplama | Yokuş aşağı + zipline |
| 💊 Eczane Acil | Kırılabilir + sıkı süre | Usta işi |
| 📚 Toplu Sipariş | Ağır + yüksek ödül | Planlı transfer |

### 🏅 Dereceler

| Derece | Şart | Ödül |
|---|---|---|
| 🥉 Bronz | Süre barajı içinde teslim | Baz ücret |
| 🥈 Gümüş | Sıkı süre + paket %70+ | **x1.5** + itibar |
| 🥇 Altın | Çok sıkı süre + paket %90+ | **x2.2** + itibar |
| ⏰ Geç | Baraj +30 sn aşıldı | %40 ücret |

---

## 🌆 Şehir Oyuncakları

| Oyuncak | Renk | Fantezi |
|---|---|---|
| 🌀 Fan | Camgöbeği silindir | Üstüne düş → yukarı fırlatıl |
| 🚡 Zipline | Kırmızı küreler arası hat | `E` ile bin, çatıdan çatıya uç |
| 🟦 Konteyner | Mavi kutu | Hasarsız iniş sigortası |
| 🟨 Pano | Sarı platform | Trambolin gibi sek |
| 🟣 Depo | Mor silindir | İş al / motor hub'ı |
| 🟡 Beacon | Sarı ışık sütunu | Hedef — oku takip et |

---

## 🛠 Kurulum

### Gereksinimler
- Modern tarayıcı (Chrome / Edge önerilir) + internet (Three.js CDN)
- Windows portable için: ek kurulum yok
- Gerçek `.exe` derlemek için: Node 18+ (`npm install` → `npm run exe`)
- Gerçek `.apk` derlemek için: Java 17 + Android Studio (detay: `BUILD.md`)

### Klasör yapısı
```
Couriersimulator/
├── index.html            → oyunun girişi (Web / EXE / APK aynı dosya)
├── game.js               → tüm oyun mantığı (Three.js)
├── style.css             → HUD + mobil arayüz
├── electron-main.js      → Windows EXE sarmalayıcı
├── capacitor.config.json → Android sarmalayıcı
├── package.json          → npm scriptleri (web / exe)
├── BUILD.md              → derleme rehberi
├── GDD.md                → tam tasarım belgesi (kodsuz)
├── dist/                 → indirilebilir paketler (releases)
└── LICENSE               → MIT
```

---

## 🤖 EXE / APK nasıl üretiliyor? (şeffaf not)

Bu PC'de Java 8 var, Android SDK yok — o yüzden gerçek `.exe` / `.apk` burada değil,
GitHub'ın cloud makinelerinde derleniyor: her `v*` tag'inde
`.github/workflows/build-exe.yml` (Windows) ve `build-apk.yml` (Java 17 + Gradle)
otomatik çalışır ve dosyaları release'e ekler. Detay: `BUILD.md`.

---

## 🗺 Yol Haritası

- [x] v0.1.0 MVP — sprint/slide/wall-run/zipline/fan, 6 iş, dereceler, flow, mobil UI
- [ ] v0.2 — GitHub Pages canlı link + günlük rota (daily seed) + hayalet yarış
- [ ] v0.3 — Gerçek FBX binaların Godot/üç-js ithali + gece modu + yağmur modifiyesi
- [ ] v1.0 — İmzalı APK + imzalı EXE, liderlik tablosu, 4 bölge (12+ görev)

---

## 🤝 Katkı

1. Forkla → dal aç (`ozellik/duvar-kosusu-suresi`)
2. Oyna-test et (`npx serve .`)
3. PR aç — GDD'ye aykırıysa gerekçesini yaz, his korunur: *durma, ak, teslim et.*

## 📄 Lisans

MIT — bkz. [LICENSE](LICENSE). Şehir assetleri (FBX/OBJ) orijinal sahiplerine aittir, repoda prosedürel MVP şehri kullanılır.

<div align="center">

**Durma. Ak. Teslim et.** 📦💨

[⬆ Başa dön](#-courier-simulator)

</div>
