# Arıcı Kovan Takip — Tasarım Brifi

> Bu belge, uygulamanın arayüz tasarımını (HTML prototip) hazırlamak için yazıldı. Uygulamanın ne olduğunu, kimin nasıl kullanacağını, hangi ekranlardan oluştuğunu ve tasarımdan geriye ne beklendiğini anlatır. Kod tarafı Expo / React Native ile yazılıyor; HTML prototip, uygulamadaki renk, yazı ve bileşen değerlerinin kaynağı olacak.

---

## 1. Uygulama nedir?

Türk arıcılar için **çevrimdışı çalışan** kovan takip uygulaması (iOS + Android). Arıcı sahada, internet olmadan:

- arılıklarını ve kovanlarını kaydeder,
- kovan denetimi yapar (çerçeve sayıları, kraliçe durumu, varroa sayımı, mizaç),
- ilaçlama, besleme, bal sağımı ve kovan taşıma kayıtlarını tutar,
- kraliçelerini takip eder,
- bölgesine ve mevsime göre üretilen **görev takvimini** görür (ör. "Varroa kontrolü yap", "Besleme zamanı"),
- hava durumu uyarıları alır.

Kayıtlar önce telefona yazılır, internet gelince arka planda sunucuya gider. Aynı işletmede birden çok cihaz kullanılabilir.

**Kısaca:** Sahada, eldivenle, güneş altında, tek elle hızlı kayıt aracı + akıllı arıcılık takvimi.

---

## 2. Kullanıcı ve kullanım koşulları

| Koşul | Tasarıma etkisi |
|---|---|
| Arıcı arılıkta, **eldiven ve arı maskesiyle** | Dokunma alanları büyük: **en az 56×56 px**. Küçük ikon düğmeleri yok. Kaydırarak silme gibi ince hareketlere dayanma. |
| **Güneş altında**, ekran parlaklığı sınırlı | Yüksek kontrast (metin/arka plan en az **4.5:1**, büyük metinde 3:1). Açık renkli arka plan. Açık gri üstüne açık gri metin yok. |
| Bir elde çerçeve ya da körük, **tek elle** kullanım | Ana eylemler ekranın **alt yarısında**, başparmağın ulaştığı yerde. |
| İnternet çoğu zaman **yok** | Çevrimdışı / senkron durumu her zaman görünür ama rahatsız etmeyen bir şeritle gösterilir. "Kaydedildi" hissi internete bağlı olmamalı. |
| Kullanıcıların çoğu **orta yaş ve üstü**, teknolojiyle arası değişken | Gövde metni en az **17 px**. Sade dil, ikon + yazı birlikte. Gizli menüler yerine görünür düğmeler. |
| Dil **Türkçe** | Yazı tipi Türkçe karakterleri (ç, ğ, ı, İ, ö, ş, ü) desteklemeli. Türkçe kelimeler uzun olabilir; düğmeler iki satıra düşebilmeli. |
| Hızlı veri girişi | Klavye yerine sayaç (– / +), seçim çipleri ve segmentli seçimler tercih edilir. |

---

## 3. Tasarım kuralları (zorunlu)

1. **Dokunma alanı:** Her tıklanabilir öğe en az 56×56 px.
2. **Yazı boyutu:** Gövde en az 17 px, başlıklar 22–28 px, yardımcı metin en az 15 px.
3. **Kontrast:** WCAG AA (normal metin 4.5:1).
4. **Renge tek başına anlam yükleme:** Uyarı/hata durumlarında renkle birlikte ikon ve metin de olsun.
5. **Açık tema:** Şimdilik yalnızca açık (light) tema. Karanlık mod sonra düşünülecek.
6. **Ton:** Arı ve bal temalı, sıcak ama abartısız. Ciddi bir iş aracı; oyuncak görünmesin.
7. **Yazı tipi:** Google Fonts'tan, Türkçe destekli, ücretsiz bir yazı tipi (uygulamaya kolayca eklenebilsin).
8. **İkonlar:** Expo'da hazır gelen ikon setlerinden biri: **Ionicons** ya da **Material Community Icons** (ikisinde de arı/bal/kovan ikonları sınırlı; gerekirse özel ikon olarak SVG verilebilir).
9. **Ekran genişliği:** Prototip **390 px** genişlik (iPhone 14 boyu) üzerine tasarlansın. 1 px = uygulamada 1 dp kabul edilecek.
10. **Web'e özgü efektlerden kaçın:** Hover durumları, arka plan bulanıklığı (backdrop-filter), karmaşık CSS animasyonları uygulamaya taşınamaz. Basılı (pressed) durum tasarlanmalı.

**Kraliçe işaret renkleri sabittir** (uluslararası standart, yılın son hanesine göre): 1/6 beyaz, 2/7 sarı, 3/8 kırmızı, 4/9 yeşil, 5/0 mavi. Kraliçe rozetinde bu renkler kullanılacak; paletle çakışmamalı.

---

## 4. Uygulama yapısı (önerilen gezinme)

```
Giriş (telefon + SMS kodu)
  └─ İlk kurulum (onboarding): işletme adı → ilk arılık → bildirim izni
       └─ Alt sekmeler:
            ├─ Ana Sayfa     (bugünün görevleri, hava, özet)
            ├─ Arılıklar     (arılık listesi → arılık detayı → kovanlar → kovan detayı)
            ├─ Takvim        (günlük / haftalık / aylık / yıllık görevler)
            └─ Ayarlar       (senkron durumu, bildirimler, abonelik, hukuki, hesap)
       + Her yerden ulaşılan: QR kod tarama (kovan etiketini okutup kovanı açar)
```

Ekranların üstünde, gerektiğinde görünen **senkron şeridi** (banner) vardır.

---

## 5. Ekranlar

Aşağıdaki listede her ekranın ne gösterdiği ve hangi alanları içerdiği var. Prototipte hepsinin olması gerekmez; **öncelik sırası** bölüm 8'de.

### 5.1 Giriş
- **Telefon girişi:** "+90" sabit ön ek + telefon numarası kutusu (5xx xxx xx xx biçiminde), "Kod gönder" düğmesi, kısa açıklama ("Telefonuna SMS ile bir kod göndereceğiz").
  - Durumlar: geçersiz numara, gönderiliyor, çok sık deneme ("1 dakika sonra tekrar dene"), internet yok.
- **Kod doğrulama:** 6 haneli kod kutusu (hane hane kutular), "Doğrula" düğmesi, "Kodu tekrar gönder" (geri sayımlı: "45 sn sonra tekrar gönderebilirsin"), "Numarayı değiştir".
  - Durumlar: yanlış/süresi geçmiş kod, doğrulanıyor.

### 5.2 İlk kurulum (onboarding) — 3 adım, üstte ilerleme göstergesi
1. **İşletme adı** ("Karaca Arıcılık").
2. **İlk arılık:** arılık adı + konum (GPS ile al ya da haritadan/elle gir; konum izni açıklaması).
3. **Bildirim izni:** neden istendiği (görev hatırlatmaları, hava uyarıları), "İzin ver" / "Şimdi değil".
- Ayrıca bir **sorumluluk reddi onayı** (öneriler genel bilgidir, kesin veteriner tavsiyesi değildir).

### 5.3 Ana Sayfa
- Bugünün ve geciken görevler (kart listesi; "Tamamlandı", "Ertele" eylemleri).
- Hava durumu kartı (bugün + uyarı varsa öne çıkar: don, şiddetli rüzgâr, yağış).
- Kısa özet: kovan sayısı, son denetim, bekleyen ilaç arınma süreleri.
- Hızlı eylemler: "Denetim başlat", "QR okut".

### 5.4 Arılıklar
- **Arılık listesi:** her kartta ad, kovan sayısı, son ziyaret, konum var mı. "Arılık ekle".
- **Arılık ekle/düzenle:** ad, konum (GPS / elle), iklim profili (bölge seçimi), not.
- **Arılık detayı / özet paneli:** kovan listesi, toplam güçlü/zayıf kovan, aktif ilaçlamalar, son denetimler, hava.

### 5.5 Kovanlar
- **Kovan listesi:** arama (numara/ad), filtre (durum: aktif / ölü / satıldı / birleştirildi), **toplu seçim** ve toplu eylem çubuğu (taşı, denetle, ilaçla).
- **Kovan kartı:** numara (büyük), ad, durum, kraliçe rozeti (renk + yaş), son denetim özeti, uyarı simgesi (ör. arınma süresi devam ediyor).
- **Kovan ekle:** tekli (numara, ad, not) ve **toplu** ("1'den 24'e kadar kovan ekle").
- **Kovan detayı:** üstte özet kartı, altında **zaman çizelgesi** (denetim, ilaçlama, besleme, sağım, taşıma, kraliçe değişimi olayları, her biri kendi simgesiyle). Eylemler: denetle, ilaçla, besle, sağ, taşı, kraliçe.
- **Kovan taşıma:** hedef arılık seçimi, tek ya da toplu.
- **QR etiket:** seçili kovanlar için yazdırılabilir etiket önizlemesi (PDF).
- **QR tarayıcı:** kamera görüntüsü + çerçeve, okununca kovan detayı açılır.

### 5.6 Kraliçe
- Kraliçe rozeti (işaret rengi + yaş).
- Alanlar: doğum yılı, işaretli mi, kökeni (kendi üretimi / satın alındı / oğul / bilinmiyor), veriliş tarihi, bitiş tarihi ve nedeni (değiştirildi / öldü / oğul verdi / bilinmiyor), not.
- Kraliçe geçmişi listesi.

### 5.7 Denetim formu (en önemli ekran — sahada en çok kullanılan)
Tek ekran ama gruplara bölünmüş, hızlı doldurulur:
- **Çerçeveler:** arılı çerçeve, yavrulu çerçeve, ballı çerçeve → her biri **sayaç (– / +)**.
- **Kraliçe durumu:** görüldü / yumurta görüldü / görülmedi / kraliçesiz → **segmentli seçim**.
- **Varroa:** yöntem (alkol yıkama / şeker silkeleme / yapışkan tabla), akar sayısı, örnek büyüklüğü → sonuç yüzdesi otomatik.
- **Mizaç:** sakin / sinirli / saldırgan → çipler.
- **Not.**
- Altta sabit "Kaydet" düğmesi.

**Toplu denetim oturumu:** arılıktaki kovanları sırayla denetleyen sihirbaz ("Kovan 3 / 24", ileri/geri, atla) ve sonunda **oturum özeti**.

### 5.8 Diğer kayıtlar
- **İlaçlama:** ürün seçimi (liste), başlangıç / bitiş tarihi, doz, **arınma süresi (gün)** otomatik; arınma süresince sağım uyarısı.
- **Besleme:** tarih, besin tipi (şeker şurubu / kek (fondan) / polen keki / bal / diğer), miktar + birim (kg / litre).
- **Bal sağımı:** tarih, çerçeve sayısı, ağırlık (kg); ilaç arınma süresi bitmemişse **uyarı kutusu** ve onay.

### 5.9 Takvim
- Görünümler: günlük, haftalık, aylık, yıllık (sekme ya da segmentli seçim).
- Görev kartı: başlık, ilgili arılık/kovan, tarih, kaynak (otomatik öneri / elle eklendi), durum (bekliyor / tamamlandı / ertelendi / kapatıldı).
- **Görev detayı:** açıklama, neden önerildiği, "Bu öneri bölgemde farklı" geri bildirimi.

### 5.10 Hava
- Hava kartı (sıcaklık, rüzgâr, yağış, arıcılık için uygun mu) ve 7 günlük detay ekranı.

### 5.11 Ayarlar
- Menü listesi: Senkron durumu, Bildirimler, Abonelik, Hukuki metinler, Veri dışa aktarma (CSV), Hesabı sil, Çıkış yap.
- **Senkron durumu ekranı:** son senkron zamanı, bekleyen kayıt sayısı ve listesi, "Şimdi senkronla" düğmesi.
- **Bildirim ayarları:** görev hatırlatmaları, hava uyarıları, saat seçimi.
- **Abonelik / paywall:** ücretsiz sürümde kovan limiti (varsayım: 5 kovan), Pro aylık/yıllık fiyat kartları.
- **Hesap silme:** uyarı + onay ekranı.

---

## 6. Ortak bileşenler (her ekranda tekrar kullanılacak)

Lütfen her birini **normal, basılı, devre dışı** ve gerekiyorsa **hata** durumlarıyla tasarla:

| Bileşen | Not |
|---|---|
| **Metin (AppText)** | Başlık, alt başlık, gövde, yardımcı metin, etiket stilleri |
| **Düğme (Button)** | Birincil, ikincil, tehlikeli (sil), metin düğmesi; ikonlu ve ikonsuz; yükleniyor hali |
| **Kart (Card)** | Kovan kartı, görev kartı, hava kartı için temel kutu |
| **Liste öğesi (ListItem)** | Sol ikon, başlık + alt metin, sağda değer ya da ok |
| **Sayaç (Stepper)** | – / + düğmeli sayı girişi (çerçeve sayıları için) |
| **Segmentli seçim (SegmentedChoice)** | 2–4 seçenek (kraliçe durumu gibi) |
| **Çip (Chip)** | Seçilebilir etiket (mizaç, filtreler) |
| **Alt sayfa (BottomSheet)** | Alttan açılan seçim/onay paneli |
| **Boş durum (EmptyState)** | "Henüz kovan yok" + açıklama + eylem düğmesi |
| **Çevrimdışı şeridi (OfflineBanner / SyncBanner)** | Aşağıdaki durumlar |
| **Metin kutusu** | Telefon girişi, 6 haneli kod girişi, not alanı, sayı girişi |
| **Kraliçe rozeti** | İşaret rengi + yaş |
| **Uyarı kutusu** | Bilgi / uyarı / hata (arınma süresi uyarısı gibi) |

**Senkron şeridinin durumları:**
| Durum | Ne söyler |
|---|---|
| Senkronlanıyor | "Kayıtlar gönderiliyor…" |
| Çevrimdışı | "İnternet yok. Kayıtların telefonda, bağlantı gelince gönderilecek." |
| Hata | "Gönderilemedi, birazdan tekrar denenecek." |
| Oturum kapalı | "Kayıtları göndermek için tekrar giriş yap." |
| Güncelleme gerekli | "Uygulamayı güncellemen gerekiyor." |
| Her şey yolunda | Şerit görünmez (ya da çok küçük bir "Son senkron: 5 dk önce") |

---

## 7. Prototip için örnek veri

- İşletme: **Karaca Arıcılık**
- Arılıklar: **Yayla Arılığı** (24 kovan), **Köy Bahçesi** (8 kovan), **Kestane Ormanı** (12 kovan)
- Kovanlar: numara 1–24; bazılarının adı var ("Kraliçe Ana", "Sağlam 7")
- Kraliçe: 2025 doğumlu, mavi işaretli, satın alındı
- Denetim: 8 arılı, 5 yavrulu, 3 ballı çerçeve; kraliçe görüldü; varroa 3/300 (%1); mizaç sakin
- İlaçlama: oksalik asit, arınma süresi 14 gün, 6 gün kaldı
- Görevler: "Varroa kontrolü yap" (bugün), "Bahar beslemesi" (yarın), "Kovanları kışa hazırla" (gecikti)
- Hava: 18 °C, rüzgâr 12 km/s, "Denetim için uygun"

---

## 8. Öncelik sırası

1. **Tasarım değerleri** (renk, yazı, boşluk, köşe) ve **ortak bileşenler** — kodda ilk bunlar gerekiyor.
2. **Giriş** (telefon + kod) ve **ilk kurulum** ekranları — şu an kodlanan bunlar.
3. **Ayarlar** ve **senkron şeridi / senkron durumu**.
4. **Arılık listesi / detayı**, **kovan listesi / kartı / detayı**.
5. **Denetim formu** ve toplu denetim.
6. Takvim, hava, kayıt formları, abonelik ve diğerleri.

---

## 9. Tasarımdan geri beklenenler

HTML prototiple birlikte (ya da prototipin içinde) şu değerlerin **açıkça yazılı** olması gerekiyor; uygulama bu değerlerden kurulacak:

**Renkler** (her biri hex kodu ve kısa kullanım notuyla):
- `primary` (ana marka rengi, birincil düğme), `primaryPressed`, `onPrimary` (üstündeki yazı)
- `secondary` (ikincil vurgu)
- `background` (ekran zemini), `surface` (kart zemini), `border` (çizgi/kenar)
- `text` (ana metin), `textMuted` (yardımcı metin), `textDisabled`
- `success`, `warning`, `danger`, `info` (+ her birinin açık zemin tonu)

**Yazı:**
- Yazı tipi adı (Google Fonts) ve kullanılacak kalınlıklar
- Her stil için: boyut / satır yüksekliği / kalınlık → başlık, alt başlık, gövde, yardımcı, düğme, etiket

**Ölçüler:**
- Boşluk ölçeği (ör. 4, 8, 12, 16, 24, 32)
- Köşe yuvarlaklığı (küçük, orta, büyük)
- Gölge kullanılacaksa değerleri
- Ekran kenar boşluğu

**İkonlar:** Seçilen set (Ionicons ya da Material Community Icons) ve hangi ikonun nerede kullanıldığı; özel ikonlar varsa SVG olarak.

**Ekranlar:** Bölüm 8'deki sıraya göre, her ekran 390 px genişlikte; boş, yükleniyor ve hata durumları dahil.

Prototip tek bir HTML dosyası olabilir (CSS içinde). Renkleri CSS değişkenleri olarak tanımlamak (ör. `--color-primary: #...`) aktarımı çok kolaylaştırır.
