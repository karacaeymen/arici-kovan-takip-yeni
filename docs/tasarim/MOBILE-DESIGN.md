# Kovan Takip · MOBILE-DESIGN.md

Tasarım kararlarının kalıcı kaydı. Arayüzle ilgili her işten önce okunur; karar değişince bu dosya güncellenir.

- Brif: `docs/tasarim/TASARIM_BRIFI.md`
- Prototip ve bütün değerler: `docs/tasarim/prototip.html` (değerler dosyanın başındaki `:root` bloğunda; tarayıcıda açılır)
- Durum: sürüm 0.1, Faruk onayladı (2026-11-24). Değerler `src/theme/*` dosyalarına, ortak bileşenler `src/components/ui/*`'a işlendi (T0.8).

## Uygulama okuması

Türk arıcılar için çevrimdışı saha aracı. Kullanıcı orta yaş ve üstü; güneşte, çoğu zaman tek elle kullanıyor. Dil sıcak ama ciddi ("saha ekipmanı"). Expo / React Native.

- Platform: iOS ve Android birinci sınıf, web yok
- Duruş: tek marka görünümü (iki platformda aynı bileşenler, gezinme çubukları navigator'a ait)
- Marka ifadesi 5/10 · Hareket 2/10 · Yoğunluk 3/10
- İmza öğe: kovan plakası (numara etiketi). Ekran başına başka gösterişli öğe yok.
- Yalnızca açık tema (brif gereği). Renkler anlamsal adlarla tanımlı; koyu tema sonradan aynı adlarla eklenebilir.

## Gezinme okuması

```
platforms: iOS + Android birinci sınıf, web yok
tabs (4): Ana Sayfa · Arılıklar · Takvim · Ayarlar
app/
  (auth)/phone, code                      tam ekran grup, oturuma göre değişir
  (onboarding)/business, apiary, notify   3 adım, her biri gerçek bir girdi alır
  (tabs)/
    index       Ana Sayfa   -> push weather, task/[id]
    apiaries    Arılıklar   -> push apiary/[id] -> hive/[id] -> queen/[id]
    calendar    Takvim      -> push task/[id]
    settings    Ayarlar     -> push settings/sync, notifications, subscription, legal, delete-account
  inspection/[hiveId]                     tam ekran modal, "Vazgeç" her zaman görünür
  inspection-session/[apiaryId]           tam ekran akış (toplu denetim) -> summary
  record/[type]/[hiveId]                  modal: ilaçlama, besleme, sağım, taşıma
  apiary/new, hive/new                    modal
  scan                                    tam ekran modal (kamera), "Kapat" görünür
entry points: scan <- "QR okut" (sekme ana ekranlarının alt eylem çubuğu)
              inspection <- "Denetle" (kovan detayı), "Denetim başlat" (Ana Sayfa)
sheets: kayıt-ekle (kovan detayı), durum-süzgeci (kovan listesi)
deep links: /hive/:id (QR etiketi), /apiary/:id, /task/:id
android back: varsayılan; denetim formu ve toplu denetim kaydedilmemiş veride çıkış onayı sorar
max taps to any core screen: 2
```

Düzen kalıbı: üstte ad, ortada içerik, altta sabit eylem çubuğu (en çok iki düğme, toplu denetimde üç). Sekme ana ekranlarında eylem çubuğunun ikinci düğmesi her zaman "QR okut".

## Tasarım sistemi (özet)

| Konu | Karar |
|---|---|
| Birincil renk | Bal sarısı `#F7B618`, üstünde mürekkep `#1F1709` (9,8:1), 1,5 px `#9A6A00` kenarlık |
| İkincil vurgu | Kestane `#5E3A12`: metin düğmesi, geri, onay kutusu, ilerleme |
| Zemin | `#FBF7EE` ekran, `#FFFFFF` yüzey, `#F2EBDD` basılı zemin |
| Durum renkleri | Yeşil `#1B6E3A`, turuncu `#A14B00`, kırmızı `#B3261E`, mavi `#1B5E9E`; hepsi ikon ve metinle |
| Kraliçe | Beyaz, sarı `#FFDD00`, kırmızı `#E0281E`, yeşil `#17803C`, mavi `#1F6FD0`; disk 2 px mürekkep kenarlı, içinde doğum yılı |
| Yazı tipi | IBM Plex Sans 400 / 600 / 700 (`@expo-google-fonts/ibm-plex-sans`) |
| Yazı ölçeği | 28/34 başlık · 22/28 alt başlık · 18/26 gövde · 16/22 yardımcı · 15/20 etiket · 18/24 düğme |
| Boşluk | 4, 8, 12, 16, 20, 24, 32, 40. Ekran kenarı 20. |
| Köşe | 8 küçük · 12 bütün kontroller · 16 kart ve alt sayfa · tam yuvarlak yalnızca disk, anahtar, sekme hapı |
| Dokunma | En az 56 × 56; düğme ve giriş 60; sekme çubuğu 68 |
| Gölge | Kartlarda yok. Yalnızca alt sayfa ve kayıt bildirimi. |
| İkon | Material Community Icons, çizgi biçimi, her ikonun yanında yazı |
| Hareket | Sistem geçişleri ve basılı hal. Süs amaçlı animasyon yok. |

## Risk kaydı

1. **Bal sarısı düğme, koyu yazı.** Kazanç: yüksek kontrast, arı kimliği. Bedel: açık zeminde sınır zayıf, koyu bal kenarlık zorunlu; uyarı rengi turuncuya kaydı.
2. **IBM Plex Sans (sistem yazı tipi yerine).** Kazanç: 1/l/I ayrışır, sıfır düz, iki platformda aynı. Bedel: üç yazı dosyası. Atkinson Hyperlegible Next denendi; sıfırı çizgili olduğu için elendi.
3. **Kovan plakası.** Kazanç: numara hemen bulunur. Bedel: satır 84 px, ekrana 4-5 kovan sığar.
4. **56-60 px kontroller, 18 px gövde.** Kazanç: gözlüksüz ve eldivenle kullanım. Bedel: denetim formu iki ekran boyu.

## Brifle ve kurallarla çakışmalar

- **Ayarlar sekmesi:** mobile-taste "ayarlar sekme olmaz" der. Brif gizli menü istemiyor ve senkron durumu Ayarlar'da; sekme olarak kaldı. Alternatif: üç sekme + Ana Sayfa başlığında Ayarlar düğmesi.
- **Bildirim izni ilk kurulumda:** kural ilk değer anından sonra sormayı önerir. Brif gereği kurulumda; ama açıklama ekranı var ve sistem penceresi yalnızca "İzin ver"e basınca açılır.
- **Sorumluluk reddi onayı:** ilk kurulum 1. adıma kondu. Yeri kullanıcıyla netleşecek.
- **Uygulama adı:** prototipte geçici olarak "Kovan Takip".

## Kapsam

Yapılan (0.1): tasarım değerleri, 13 ortak bileşen (durumlarıyla), giriş, ilk kurulum, Ana Sayfa, arılık listesi ve detayı, kovan detayı, kayıt ekle alt sayfası, denetim formu, toplu denetim ve oturum özeti, Ayarlar, senkron durumu.

Sıradaki: Takvim ve görev detayı, hava ekranı, ilaçlama / besleme / sağım formları, kraliçe ekranı, kovan ekle (tekli, toplu), kovan taşıma, QR tarayıcı ve etiket, bildirim ayarları, abonelik, hesap silme. Eldiven kullanımı için ek uyarlama kullanıcı isteğiyle ertelendi.

Cihazda doğrulanmayanlar: klavye açıkken düğme konumu, 1,3 kat yazı büyütmede sekme çubuğu, Android alt çubuk boşlukları, güneş altında gerçek okunurluk.
