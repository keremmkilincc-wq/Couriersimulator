# COURIER SIMULATOR — Oyun Tasarım Belgesi (GDD) v1.0
> 3D Hızlı Parkur + Zamanla Yarış + Kurye Simülasyonu | First-Person / Tight Third-Person
> Platform Hedefi: **Web (tarayıcıda oynanır) + Android APK + Windows EXE** | Motor: **Unity DEĞİL — Godot 4.x önerisi**
> Tema: Dikey Şehirde Akış — A'dan B'ye En Hızlı, En Akıcı, En Yetenekli Rota

---

## 0. KÜNYE VE HIGH CONCEPT

### 0.1 Tek Cümlelik Pitch
Sen şehrin en hızlı kuryesisin: çatılardan uç, duvarlarda koş, fanlarla yüksel, paketi sarsmadan ve dakikası dakikasına teslim et.

### 0.2 Tasarım Sütunları (Pillars)
1.  **Akış Her Şeydir (Flow is King):** Durmak cezadır, akıcı kalmak ödüldür. Tüm sistemler momentumu korumaya hizmet eder.
2.  **Rota Senin İmzan:** Her teslimatta 3 yol var — güvenli sokak, riskli çatı, gizli kestirme. Usta oyuncu kendi rotasını çizer.
3.  **Paket Bir Karakterdir:** Paket ağırlığı, kırılganlığı ve ısısı oyuncunun hareket kararlarını değiştirir.
4.  **Minimal Dikkat Dağıtma:** Göz rotada, kulak ritimde. HUD yokmuş gibi hissettiren diyergetik yönlendirme.
5.  **Tek Kod Tabanı, Üç Çıktı:** Web'de hemen oyna, telefonda APK ile kap, PC'de EXE ile tam deneyim. Tasarım bu üçüne de uyar.

### 0.3 Fantazi ve Oyuncu Rolü
- Oyuncu: Bağımsız, çevik, şehirle bütünleşmiş bir kurye. Ne araba kuryesi kadar yavaş, ne drone kadar ruhsuz.
- Şehir: Dikey bir oyun alanı. Binalar duvar değil pist, çatılar boşluk değil tramplen.
- Duygu Eğrisi: Başlangıçta "kaybolma ve yetişememe" -> ortada "rota bulma sevinci" -> ustalıkta "flow state sarhoşluğu".

### 0.4 Kamera Kararı
- **Varsayılan: Tight Third-Person (omuz üstü yakın).** Parkur okunabilirliği en yüksek olan budur. Ayaklar, çıkıntı tutuşu ve paket görünür.
- **Alternatif Mod: First-Person.** Hız hissi %30 artar ama uzuv takibi zorlaşır. Ayarlardan açılabilir, dereceli görevlerde third-person zorunlu tutulur (adalet için).
- Kamera Mantığı: Hız arttıkça FOV genişler (70 -> 90), inişlerde hafifçe aşağı eğilir, wall-run'da yana yatar. Sarsıntı asla mide bulandıracak seviyeye çıkmaz, Web ve mobilde ek sınırlandırılır.

### 0.5 Eldeki Gerçek Asset Envanteri (Tasarım Buna Göre Yapıldı)
`C:\Users\Kilinc\Downloads\` altında doğrulanan paketler:

- **City Pack.undefined-zip.zip (19 MB):**
  - Yapılar: `Apartment.obj`, `large_buildingA.obj`, `large_buildingG.obj`, `model.obj (Hotel Building)`, `CUPIC_HOSPITAL.obj`, `CUPIC_BAR.obj`, `HouseWithDriveway.obj`, `Building4.fbx`, `Convertible`, arabalar, insan modelleri (`Casual_2.fbx`, `Punk.fbx`, `Suit.fbx`, `Male_Shirt.fbx`)
  - Şehir mobilyası: `Billboard 2.obj`, `bussy.fbx (Bus stop sign)`, `bikes.fbx`, `Road Bits.fbx`, `Path_Straight.fbx`, araçlar (`1994-nissan-180mx_2.fbx`, `2015-dodge-challanger.fbx`, `Cop.obj`, `l200.obj`, `GTR.obj`, `1377 Car.obj`, `Lamborghini_Aventador.obj`)
- **Motorcycle by jeremy - 0lBe-ApqJs4.zip:** `Motorcycle_01.obj` — Kurye motosikleti
- **Package by Isa Lousberg - hvj3HXY7FG.zip:** `package.fbx` — Sırt çantası / elde taşınan teslimat paketi görseli

Tasarım kararı: Şehir çekirdeği bu FBX/OBJ'lerden kurulur, parkur katmanı (ledge, zipline, fan, konteyner, pano) bunların üstüne modüler olarak eklenir. Sıfırdan şehir modellemeye gerek yok.

---

## 1. KARAKTER HAREKET VE PARKUR MEKANİKLERİ (MOVEMENT SYSTEM)

Tasarım hedefi hissiyat cümlesi: **"Koşarken yer seni itiyor, atlarken hava seni taşıyor, hata yapınca şehir seni affetmiyor ama ikinci şans veriyor."**

### 1.1 Temel Hareket Seti

- **Yürü / Koş / Depar (Sprint):**
  - Yürü: Dar saçaklarda ve kalabalıkta hassas kontrol. Hız düşük, dönüş keskin.
  - Koş: Varsayılan tempo. Merdiven, rampa ve düz çatıda ivme biriktirmenin tabanı.
  - Depar: Sınırlı dayanıklılıkla tüketilen patlama. Düzlükte ve yokuş aşağı ivme üretir, yokuş yukarı çabuk tükenir. Depar sırasında kamera FOV açılır, rüzgar sesi belirginleşir.
  - Tasarım kuralı: Depar basılı tutmak değil, doğru yerde açıp kapatmaktır. Sürekli depar dayanıklılığı bitirir ve dönüşleri savurur.

- **Zıplama / Gap Jump (Çatı Atlayışı):**
  - Kısa basış = kısa zıplama, uzun basış = tam güç. Kenardan geç basılırsa "Coyote-Time" affı ile atlayış kabul edilir (yeni oyuncular için kritik).
  - Gap Jump: İki çatı arası. Mesafe renk koduyla öğretilir: Yeşil atlanabilir, Sarı tam depar ister, Kırmızı sadece Flow State + rüzgar desteğiyle geçilir. Renkler diyergetik olarak çatı kenarı şerit boyalarıyla verilir.

- **Kayma (Crouch Slide):**
  - Kullanım: Alçak barikat altı, çamaşır ipi altı, dar tünel girişi, yokuş aşağı hız artırma.
  - Hissiyat: Yokuş aşağı kayma hız kazandırır, düzde sürtünmeyle yavaşlar. Kaymadan çıkışta zamanında zıplanırsa momentum korunur (Slide-Hop), geç kalınırsa karakter tökezler.
  - Şehir eşleşmesi: `Path_Straight.fbx` ve `Road Bits.fbx` yollarına "kayma koridorları" (parke taş, muşamba, ıslak zemin) yerleştirilir.

- **Tırmanma (Ledge Grab / Vault):**
  - Ledge Grab: Tutunulabilir kenarlar (klima ünitesi, parapet, tabela çerçevesi) parlar değil, doku farkıyla anlaşılır. Tutunma otomatiktir ama yukarı çekilme oyuncu ritmine bağlıdır: Hızlı gelen oyuncu beklemeden vault ile geçer, yavaş gelen asılı kalıp güç harcar.
  - Vault: Bel hizasındaki engeller (kaput, konteyner kapağı, barikat) üzerinden tek hamlede geçme. Hızı kesmez, aksine küçük bir itki verir. Sokak seviyesinin kalbi budur.

- **Duvar Koşusu (Wall-Run):**
  - Koşul: Yana doğru yeterli hızla ve doğru açıyla duvara girmek. Giriş açısı affedici, çıkış zamanlaması ustalık ister.
  - Süre: Temel süre kısa tutulur, duvarda kalmak yavaşlatır. Usta oyuncu duvardan duvara seker (Wall-Run -> Jump -> Opposite Wall-Run) ve hiç hız kaybetmez.
  - Çıkışlar: Yukarı zıplama (yüksek tutamaklara), ileri atılma (boşluğa), aşağı kayma (iniş yumuşatma). Yanlış çıkış = hız kaybı + sendeleme animasyonu.
  - Şehir eşleşmesi: Dar sokak kanyonları, `Apartment.obj` ve `large_building` yan cepheleri wall-run koridoru olarak işaretlenir.

### 1.2 İleri Düzey: Momentum ve Flow State

- **Momentum Mantığı:**
  - Her hareketin bir "girdi hızı" ve "çıktı hızı" vardır. İdeal zincir: Depar -> Kayma (yokuş aşağı) -> Slide-Hop -> Wall-Run -> Atlayış -> İniş Yuvarlanması.
  - Doğru zamanlama penceresi: İniş anında zıplama, kayma bitişinde zıplama, wall-run son adımında zıplama. Pencereyi yakalayan hızını korur veya %5-12 artırır.
  - Yanlış zamanlama cezası: Erken/geç basış hızı %15-30 kırpar, ekranda değil bedende hissettirilir (ağır iniş sesi, kısa tökezleme, FOV daralması).

- **Flow State (Akış Modu):**
  - 5-7 saniye kesintisiz temiz zincir sonrası aktive olur. Belirtileri:
    - Görsel: Hafif motion blur kenarları, hız çizgileri, renk doygunluğu artışı.
    - İşitsel: Müzik bir katman ekler, rüzgar tizleşir, adım ritmi müziğe kilitlenir.
    - Oynanış: Hava kontrolü artar, dayanıklılık tüketimi azalır, Sarı/Kırmızı boşluklar geçilebilir hale gelir.
  - Flow kırılırsa (duvara çarpma, sert düşüş, paket hasarı) tüm bonus sıfırlanır. Bu risk/ödül döngüsü "bir daha dene" hissini üretir.

- **Hata Affı Tasarımı:**
  - Yeni oyuncu: Geniş coyote-time, otomatik vault, yumuşak iniş toleransı.
  - Usta oyuncu: Affı kapatıp hız bonusuna çeviren "Hardcore Kurye" modifiyesi. Aynı parkur, farklı risk.

### 1.3 Çevre ile Etkileşim (Şehir Oyuncakları)

Her oyuncak tek cümlelik fanteziyle tanımlanır:

- **Zipline:** "Çatıdan sokağa kestirme uçuş." Hız sabit yüksek, yön sabit. Binişte küçük çömelme, inişte yuvarlanma gerekir. Bazı zipline'lar tek yönlüdür, dönüşte farklı rota gerekir.
- **Havalandırma Fanı (Updraft):** `Apartment` ve `Hotel` çatılarına yerleştirilir. Üstüne düşünce yukarı fırlatır. Hafif paketle yüksek, ağır paketle alçak fırlatır. Zamanlamayla süzülme uzatılabilir.
- **Çöp Konteyneri / Karton Yığını:** "Hasarsız iniş sigortası." Doğru nişanlanırsa düşüş hasarı ve paket hasarı sıfırlanır. Yanlış nişan = normal hasar. Usta oyuncular bilerek konteynere atlar.
- **Reklam Panosu (Billboard Sekmesi):** `Billboard 2.obj` yüzeyleri esnek kabul edilir. Doğru açıyla atlanırsa trambolin gibi sekilir, yanlış açıyla kayılır. Rota planlamada "sekme panoları" kritik kavşaklardır.
- **Tente / Branda:** Hızı emer, hasarı azaltır ama Flow'u kırar. Güvenli ama yavaş iniş.
- **Trafik ve Yayalar (Hareketli Engel):** `Cop.obj`, `GTR.obj`, `l200.obj`, `1377 Car.obj`, insan modelleri sokakta devinir. Çarpma = sendeleme + paket sarsıntısı. Araba kaputundan vault yapılırsa ceza yerine bonus verilir (risk ödüllendirilir).
- **Motosiklet (`Motorcycle_01.obj`):**
  - Rolü: Parkurun yerini almaz, tamamlar. Uzun, düz, sıkıcı transfer etaplarında "ekspres sürüş" olarak açılır.
  - Mantık: Belirli hub'lar arası (kurye deposu -> mahalle girişi) motorla gidilir, son 200-300 metre yaya parkuruna zorunlu geçilir. Böylece hem motor fantezisi yaşanır hem parkur değersizleşmez.
  - Web sürümünde motor etapları basitleştirilmiş tutulur (performans ve kontrol kolaylığı için).

### 1.4 Hasar ve Başarısızlık Hissiyatı
- Düşme hasarı üç kademeli: Sıyırık (devam et), Sendeleme (Flow kırılır), Paket Kaybı Riski (görev tehlikeye girer).
- Ölüm yok, "teslimat başarısızlığı" var. Oyuncu asla ekrana bakakalmaz, en yakın çatıda 3 saniyede yeniden doğar ve zaman işlemeye devam eder. Tempo korunur.

---

## 2. KULLANICI DENEYİMİ VE ARAYÜZ (UI / UX)

Felsefe: **"En iyi HUD görünmez olandır. Şehir sana söyler."**

### 2.1 Diyergetik Yönlendirme (Şehir İçinde Rota Gösterme)
- **Boya Şeritleri ve İşaretler:** Usta kuryelerin bıraktığı varsayılan sarı-beyaz oklar, çatı kenarı şeritleri. Ana rota boyayla, alternatif rota soluk tebeşirle gösterilir.
- **Tabela ve Billboard Yönlendirmesi:** `Billboard 2.obj` ve otobüs durağı (`bussy.fbx`) teslimat bölgesine doğru döner / ışık yakar. Oyuncu tabelayı takip eder, mini haritaya bakmaz.
- **Rüzgar ve Kumaş Dili:** Bayraklar, çamaşırlar, poşetler hedefe doğru dalgalanır. Flow State'te rüzgar partikülleri rota yönünde hızlanır.
- **Işık Hattı (Sadece Gerektiğinde):** Yeni oyuncularda veya kaybolma 5 saniyeyi geçerse yerdeki ince ışık çizgisi belirir, rota bulununca söner. Ustalarda tamamen kapalıdır.
- **Sesli İpucu:** Dağıtım telsizi: "İkinci çatıdan sola, fan seni kaldırır." Altyazı yok, kısa sesli direktif var. Web'de sessiz modda görsel ikona dönüşür.

### 2.2 Minimalist HUD Yerleşimi
- **Hız Göstergesi:** Sayı yok. Ekran kenarlarında hız çizgileri + FOV + rüzgar sesi. Kesin hızı merak eden duraklatma menüsünde görür.
- **Teslimat Süresi:** Üst merkezde ince halka / bar. Renk dili: Beyaz (rahat), Turuncu (sınırda), Kırmızı nabız (kritik). Son 10 saniyede kalp atışı sesi eklenir.
- **Paket Dayanıklılığı:** Paketin sırt ikonunda çatlak kademesi. `package.fbx` modeli hasarla görsel olarak yıpranır (ezik köşe, açılan bant). Sayı yok, görsel yıpranma var.
- **Sıcak / Soğuk Göstergesi:** Sıcak gıda görevlerinde paketten çıkan buhar partikülü. Buhar azalıyorsa zaman daralıyor demektir.
- **Ağırlık Hissi:** Ağır pakette kamera biraz daha alçaktan ve ağır sallanır, zıplama animasyonu daha tok hissettirir. HUD'da "AĞIR" yazmaz, bedende hissedilir.

### 2.3 Platforma Göre UX Farkları
- **Web (Tarayıcı):** Tek elle fare + WASD, düşük grafik önayarı varsayılan, yükleme 10 sn altında tutulmalı. Tuş açıklamaları ilk 2 görevde ekranın köşesinde hayalet olarak durur.
- **APK (Mobil):** Sol sanal joystick + sağ kaydırma (kamera) + büyük Zıpla/Kay tutamacı. Wall-run ve vault yarı otomatikleşir. 30 FPS altına düşerse motion blur ve partikül otomatik kısılır.
- **EXE (PC):** Tam grafik, FOV kaydırıcısı, tuş remapping, 60+ FPS hedef. Fotoğraf modu ve rota tekrar izleme bu sürümde tam özelliklidir.

---

## 3. TESLİMAT SİSTEMİ VE PAKET MEKANİKLERİ

Döngü cümlesi: **"Paketi seçmek, rotayı seçmektir."**

### 3.1 Paket Türleri (Ağırlık / Hassasiyet Matrisi)

- **Standart Zarflar ve Küçük Kutular (`package.fbx` küçük varyant):**
  - Özellik: Hafif, dayanıklı. Hız cezası yok.
  - Rota: Öğretici ve ısınma görevleri. Çatı ve sokak serbest.
  - Oyuncu dersi: Temel akış öğrenilir.

- **Kırılabilir Eşya (Cam / Seramik / Elektronik):**
  - Özellik: Sert iniş, duvara çarpma, konteyner dışı düşüş hasar verir. 3 kademeli dayanıklılık.
  - Kural: Yüksekten atlama serbest ama iniş yumuşak olmalı (yuvarlanma / konteyner / tente zorunlu). Flow bonusu yüksek ama riskli.
  - Rota: Daha alçak, daha yumuşak, daha teknik. Hızdan çok temizlik ister.
  - Görsel: Paket köşeleri çatlar, bant açılır.

- **Sıcak Gıda / Zaman Kritik:**
  - Özellik: Paket sağlam ama zaman penceresi çok dar. Soğuma çubuğu sürekli erir.
  - Kural: En kısa değil en hızlı rota gerekir. Zipline ve fan zorunluya yakın, kayma koridorları altın değerinde.
  - Rota: Riskli çatı hattı, kırmızı boşluklar göze alınır.

- **Ağır Paket (Su Damacanası / Parça / Toplu Sipariş):**
  - Özellik: İvmelenme yavaş, zıplama mesafesi kısa, duvar koşusu süresi kısa, fan yükseltmesi alçak.
  - Kural: Momentum biriktirmek 2 kat zaman ister ama bir kez hızlanınca durmak zordur (ağır tren hissi).
  - Rota: Yokuş aşağı kayma ve zipline ağırlıklı, dikey tırmanıştan kaçınan rotalar.
  - Görsel: Karakter eğilir, adım sesi toklaşır.

- **Gizli / Değerli Paket (Gece Görevleri):**
  - Özellik: Sarsıntıya orta hassas, ama en kritik şey "görünmezlik". Belirli bölgelerde koşmak alarm üretir.
  - Rota: Arka sokak, havalandırma tüneli, çatı gölgesi. Hızdan çok sessizlik.

### 3.2 Görev Yapısı
1.  **Teklif Ekranı:** 3 teklif arasından seç (mesafe, paket türü, ödül, hava durumu gösterilir). Oyuncu rotayı harita önizlemede 10 sn planlar.
2.  **Teslimat:** Süre işler. Checkpoint'ler ara zaman verir. Paket durumu anlık izlenir.
3.  **Teslim Anı:** Hedef kapıda "yavaşla ve bırak" alanı. Hızlı girip sert fren yapmak paket hasarı verir — finalde bile ustalık ister.

### 3.3 Derecelendirme (Bronz / Gümüş / Altın)
- **Bronz:** Teslim edildi. Temel ücret + küçük bahşiş. Hikaye ilerler.
- **Gümüş:** Süre barajı + paket %70+ sağlam. Ücret x1.5 + rastgele modifiye parçası.
- **Altın:** Sıkı süre + paket %90+ sağlam + Flow süresi eşiği (örn. 20 sn+ Flow). Ücret x2.2 + nadir yetenek puanı + liderlik tablosu kaydı.
- **Platin (Gizli):** Altın + hiç hasarsız + kestirme rota kullanımı. Sadece ustalar. Özel kaplama / unvan verir, ekonomiyi bozmaz.
- Ödül mantığı: Para (ekipman), İtibar (yeni bölge kilidi), Yetenek Puanı (skill tree). Altın kasmak progression'ı hızlandırır ama Bronz ile de oyun bitirilebilir — kimse duvara toslamaz.

### 3.4 Hava ve Trafik Modifiyeleri
- Yağmur: Kayma uzar, tutunma kısalır, fren mesafesi artar. Kırılabilir paketler için kabus, sıcak gıda için fırsat (az trafik).
- Rüzgarlı: Gap Jump mesafesi değişir, fanlar güçlenir. Kırmızı boşluklar sarıya dönebilir.
- Yoğun Trafik: Sokak zorlaşır, çatı değerlenir. Tersine gece sakinliğinde sokak altın rota olur.

---

## 4. BÖLGE VE HARİTA TASARIMI (LEVEL DESIGN MATRİSİ)

İlke: **Aynı şehir, üç okuma seviyesi.** Yeni oyuncu sokakta yaşar, orta oyuncu çatıya çıkar, usta şehrin damarlarında gezer.

### 4.1 Sokak Seviyesi (Başlangıç / Kolay)
- **Zemin:** `Road Bits.fbx` + `Path_Straight.fbx` ile geniş ana arterler. Kaldırım, yaya geçidi, park şeridi net okunur.
- **Engeller:** Park etmiş arabalar (`1377 Car.obj`, `l200.obj`), otobüs durağı (`bussy.fbx`), yayalar (`Casual_2.fbx`, `Suit.fbx`), barikatlar.
- **Öğretme:** Vault (kaput üstü), Slide (bariyer altı), temel Gap (kaldırım boşluğu) burada öğretilir.
- **Risk:** Düşük düşme, yüksek çarpma. Trafik zaman kaybettirir ama öldürmez.
- **Motosiklet Bağlantısı:** Depo ve mahalle hub'ları sokaktadır. `Motorcycle_01.obj` burada devralınır.

### 4.2 Çatı Seviyesi (Orta / İleri)
- **Zemin:** `Apartment.obj` çatıları (düz, parapetli), `large_buildingA/G.obj` kule geçişleri, `Hotel Building model.obj` terasları, `CUPIC_HOSPITAL.obj` heliport düzlüğü, `HouseWithDriveway.obj` alçak banliyö sıçrama tahtası.
- **Fırsatlar:** Uzun düzlüklerde depar + Flow biriktirme, fanlarla dikey sıçrama, zipline ile vadi geçişi.
- **Riskler:** Dar saçaklar, büyük boşluklar (3-8 metre), yanlış atlayışta sokak seviyesine düşüş (ölüm değil, 15-20 sn kayıp).
- **Okunabilirlik:** Tutunulabilir kenarlarda koyu metal şerit, kaygan zeminlerde su birikintisi parlaması, fana yakınken yaprak/toz yükselmesi.

### 4.3 Gizli / Kestirme Rotalar (Usta Oyuncu)
- **Dikey Kanyonlar:** İki `large_building` arası 2-3 metrelik wall-run bacaları. Girişi sokaktan görünmez, çatıdan bakınca fark edilir.
- **Havalandırma Tünelleri:** Çatı fan bacasından girilen kısa karanlık tünel. Eğilerek kayarak geçilir, diğer çatının arkasından çıkılır. Haritada işaretli değildir, rüzgar sesi ele verir.
- **Arka Sokak Zinciri:** `CUPIC_BAR.obj` arkası, depo brandaları, `Billboard` direkleri arası sekme hattı. Trafik yok, vault + slide cenneti.
- **Kilise / Hastane Bacası:** `CUPIC_HOSPITAL` yan cephesindeki bakım merdiveni + pano sekmesiyle 15 metre kazandıran "şeytan hattı". Sadece Altın kovalayanlar dener.
- Tasarım kuralı: Kestirme asla bedava değildir. Ya teknik ister (dar giriş), ya risk ister (kırmızı boşluk), ya bilgi ister (gizli kapı). Üçünden biri her zaman ödenir.

### 4.4 Asset Kullanım Tablosu (Eldeki Pakete Birebir)
- Barınma ve Dikeylik: Apartment, large_buildingA/G, Hotel model.obj -> ana parkur kütlesi.
- Landmark ve Görev Kapısı: HOSPITAL (acil teslimat), BAR (gece görevleri), Hotel (VIP kırılabilir), HouseWithDriveway (banliyö başlangıç).
- Yön ve Reklam: Billboard 2.obj -> sekme + yön tabelası.
- Trafik Canlılığı: Challenger, Nissan, GTR, L200, Cop, Lamborghini, NormalCar2 -> sokak akışı ve vault nesnesi.
- İnsan Dokusu: Casual_2, Punk, Suit, Male_Shirt -> yaya kalabalığı, çarpma riski.
- Rota Kumaşı: Road Bits, Path_Straight -> kayma koridoru ve motor yolu.

### 4.5 Bölge Kilidi ve İlerleme
- Bölge 1 Banliyö (HouseWithDriveway): Öğretici, sokak ağırlıklı.
- Bölge 2 Çarşı (Bar + Billboard + Road Bits): Trafik + vault/slide olgunlaşma.
- Bölge 3 Kuleler (Apartment + large_building): Wall-run + gap okul.
- Bölge 4 Landmark (Hospital + Hotel): Fan + zipline + gece görevleri.
- Her bölge 8-12 teslimat, 2 vitrin görevi (senaryolu kovalamaca / fırtına teslimatı).

---

## 5. OYUN DÖNGÜSÜ VE İLERLEME SİSTEMİ (GAME LOOP & PROGRESSION)

### 5.1 Çekirdek Döngü (30-180 Saniyelik Mutluluk)
**Görev Al -> Rota Planla (10 sn) -> Parkur Yap (60-120 sn) -> Teslim Et (5 sn seremonisi) -> Ödül Kazan (10 sn dopamin) -> Geliştir (menüde karar) -> Daha Zor Göreve Dön**

- Dakika başına karar: Hangi paket, hangi rota, Flow'u ne zaman zorlamalı?
- Saat başına karar: Hangi yeteneğe yatırım, hangi bölgeye açılma?
- Bırakma noktası asla görev ortası değildir, her teslimat "bir tane daha" dedirtir.

### 5.2 Yetenek Ağacı (Skill Tree) — Seviye Kilitli, Oyun Tarzı Seçmeli

Üç dal, birbirini dışlamaz ama öncelik ister:

- **Kedi Dalı (Çeviklik / Affedicilik):**
  - Düşme Hasarı Azaltma I/II/III (konteynere düşmeden de kurtulma)
  - Ledge affı (tutunma penceresi genişler)
  - Yuvarlanma mesafesi artışı (inişten hıza geçiş kolaylaşır)

- **Rüzgar Dalı (Hız / Momentum):**
  - Depar verimliliği (dayanıklılık geç tükenir)
  - Slide-Hop penceresi genişler
  - Wall-Run süresi +1 sn / +2 sn
  - Flow State'e giriş süresi kısalır (7 sn -> 5 sn)

- **Karga Dalı (Zeka / Kestirme):**
  - Gizli rota sezgisi (yaklaşınca hafif ses/ipucu belirir)
  - Fan yükseltmesi artışı
  - Kanca (Grappling Hook) açma: Sadece belirli ankrajlara (vinç, pano direği). Oyunu kırmaması için menzili kısa, soğuma süresi uzun tutulur. Çatıya ışınlanma değil, boşluk kurtarma aracıdır.
  - Motosiklet çevikliği (dar sokakta dönüş artışı)

- Kilit mantığı: Kanca erken verilmez. Önce wall-run ve gap ustalaşılır, sonra kanca "ödül oyuncağı" olarak açılır. Ağacın sonu "Platin Rotalar" lisansıdır.

### 5.3 Ekonomi ve Ekipman
- Para: Ayakkabı (tutuş), eldiven (tutunma), sırt çantası (paket koruma +1 kademe), motor lastiği (yağmur performansı).
- Ekipman asla "hız satın alma" değildir, "hata toleransı satın alma"dır. Usta çıplak karakterle de Altın yapabilir.

### 5.4 Tekrar Oynanabilirlik
- Günlük Rota (Daily Run): Her gün aynı seed ile tek deneme, global skor tablosu. Web sürümünün can damarı.
- Hayalet Yarış: Kendi en iyi koşunun hayaletiyle yarış. EXE ve Web'de tam, APK'da basitleştirilmiş.
- Zamanlı Etkinlik: Fırtına, festival kalabalığı, gece karartması.

---

## 6. SES VE GÖRSEL ATMOSFER (AUDIO & VISUAL DIRECTION)

### 6.1 Ses Tasarımı
- **Rüzgar:** Hızın ana göstergesi. 0-20 km/h fısıltı, 20-40 uğultu, 40+ tiz ıslık. Flow'da stereo genişler.
- **Adım Ritimleri:** Zemin tipine göre değişir (beton tok, metal tınlar, muşamba kayar). Usta oyuncu gözü kapalı zemini anlar. Adım temposu müzik BPM'ine yaklaşınca Flow'a giriş kolaylaşır (ritim senkronu).
- **Şehir Uğultusu:** Uzak trafik, hastane anonsu, bar müziği sızıntısı, martı/klima sesi. Sokakta bas ağırlıklı, çatıda rüzgar ağırlıklı miks.
- **Dinamik Müzik:** 3 katmanlı: Davul (nabız), Bas (hız), Melodi (Flow). Yavaşken sadece davul, hızlanınca bas girer, Flow'da melodi açılır. Teslimata 10 sn kala tüm katmanlar yükselir, teslimde 2 saniyelik sessizlik + tatmin akoru.
- **Paket Sesleri:** Cam şıngırtısı (kırılabilir sarsılınca), buhar cızırtısı (sıcak gıda soğurken), fermuar gıcırtısı (ağır pakette adımda).

### 6.2 Görsel Geri Bildirim
- **Motion Blur:** Sadece kenarlarda, hızla orantılı. Mobilde kapatılabilir.
- **Kamera Sallantısı:** İnişte tek vuruş, depar da ritmik nefes, Flow'da süzülme (sallantı azalır, hız artar — tezat his).
- **İvme Çizgileri:** Ekran kenarlarından merkeze akan ince çizgiler. Flow'da renk sıcaklaşır.
- **Paket Dili:** `package.fbx` sırt çantasında sallanır, hasarla eğilir, sıcak görevde buhar çıkarır.
- **Şehir Paleti:** Gündüz pastel beton + sarı rota boyası, gece neon tabela + ıslak asfalt yansıması. Web sürümünde gündüz öncelikli (performans için ucuz ışık).

### 6.3 Performans Bütçesi (Web / APK / EXE Ortak Dil)
- Şehir modüler: Bina içleri yok, sadece dış kabuk + çarpışma kutuları. Pencere dokuları atlaslanır.
- Trafik araçları düşük poligon, uzakta sadeleşir (LOD).
- Hedef: Web 30 FPS (düşük), APK 30 FPS (orta-düşük), EXE 60 FPS (yüksek). Ayarlar oyuncuya değil, cihaza göre önerilir.

---

## 7. TEKNİK MİMARİ — UNITY DEĞİL, WEB + APK + EXE STRATEJİSİ

### 7.1 Motor Kararı
- **Öneri: Godot 4.x (GDScript).** Neden: Tek proje dosyasından üç çıktı alınır — Web (HTML5), Android APK, Windows EXE. Lisans ücretsiz, dosya boyutu küçük, FBX/OBJ/GLTF ithalatı yerleşik.
- Unity kullanılmamasının karşılığı: Asset Store yerine eldeki FBX/OBJ'lerin doğrudan Godot'a ithali + açık kaynak eklentilerle tamamlama.

### 7.2 Dosya Paketlerinin Motora Girişi
- City Pack OBJ/FBX'ler Godot'a sahne olarak ithal edilir, malzemeler `BaseColor.png` ve yüzey dokularıyla eşleştirilir.
- `Motorcycle_01.obj` sürülebilir araç değil, "hub transfer aracı" olarak ayrı fizik profiliyle ayarlanır.
- `package.fbx` sırt aparatına bağlanır, 3 hasar kademesinde 3 görünüm varyantı kullanılır.

### 7.3 Üç Çıktı İçin Tek Proje Yapısı
- **Web Sitesi Sürümü:** `index.html` + Web export. İpucu: 40 MB üstü paket dilimlenir, ilk bölge öncelikli yüklenir. Klavye + fare varsayılan.
- **APK Sürümü:** Android export şablonu ile imzalı APK. Dokunmatik UI katmanı sadece mobilde açılır. Depolama izni istemez, çevrimdışı çalışır.
- **EXE Sürümü:** Windows masaüstü export. Tam grafik + kayıt klasörü + ekran görüntüsü modu.

### 7.4 GitHub Repo Kullanımı
- Repo: `https://github.com/keremmkilincc-wq/Couriersimulator`
- Bu GDD `GDD.md` olarak ana dalda durur. Oyun projesi `courier-web/`, `courier-apk/`, `courier-exe/` diye ayrılmaz — tek `godot-project/` klasörü, üç export profili olur.
- Büyük FBX/ZIP'ler repoya olduğu gibi konulmaz, `assets-source/` notu ve indirme bağlantısı konur (repo şişmez, Web build hızlı kalır).

### 7.5 MVP Yol Haritası (İlk Oynanabilir)
1.  Hafta 1: Sokak seviyesi gri kutu + koş/zıpla/kay/vault hissi.
2.  Hafta 2: 1 çatı adası + wall-run + gap + fan prototipi.
3.  Hafta 3: 3 paket türü + Bronz/Gümüş/Altın zamanlayıcı + minimal HUD.
4.  Hafta 4: Web export + günlük rota + hayalet. APK ve EXE profilleri dondurulur.

---

## 8. KAPSAM DIŞI VE RİSKLER
- Kapsam dışı: Araçla parkur ezme, yayaya çarpıp düşürme şiddeti, çok oyunculu temaslı yarış (sadece hayalet/asenkron skor).
- Risk: Web'de fizik tutarsızlığı -> sabit zaman adımı ve hız üst sınırı ile çözülür.
- Risk: APK'da kontrol zorluğu -> yarı otomatik vault/wall-run affıyla çözülür.

---

*Bu belge kodsuz tasarım belgesidir. Sayılar playtest ile ±%20 oynayabilir, his korunur: Durma, ak, teslim et.*
