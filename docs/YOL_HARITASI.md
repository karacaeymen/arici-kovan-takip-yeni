# Yol Haritası ve İş Bölümü

> Kaynak: [`TODO.md`](../TODO.md) (61 görev, 8 faz). Bu belge görevleri **aşamalara** ve **iki kişiye** dağıtır; görevlerin kapsamı, dosya listesi ve kabul kriterleri için her zaman `TODO.md` esastır.
>
> Ekip: **Eymen** ve **Arkadaş** (adı netleşince bu belgede değiştirilecek).

---

## 1. İş bölümü mantığı

İki kişinin aynı dosyalarda çakışmaması için iş, mimarideki katmanlara göre ikiye ayrıldı:

| | **Eymen** — Altyapı, Backend ve Veri | **Arkadaş** — İstemci, Ekranlar ve Deneyim |
|---|---|---|
| Ana alan | Repo/CI/EAS, Supabase, Edge Function'lar, migration + RLS, senkron, domain kuralları, referans içerik | Tema + saha bileşenleri, yerel SQLite + repository'ler, ekran/hook/servis akışları, bildirim/abonelik istemcisi, E2E |
| Ağırlıklı klasörler | `supabase/**`, `src/domain/**`, `src/services/sync/**`, `src/data/api/**`, `.github/**` | `app/**`, `src/features/**`, `src/components/ui/**`, `src/theme/**`, `src/i18n/**`, `src/data/db/**`, `src/data/repositories/**` |
| Görev sayısı | 32 (T7.6–T7.7 ortak, liderlik Eymen'de) | 29 |

Arkadaş'ın görevleri daha çok ekran içerdiği için tek tek daha uzun sürer; sayı farkı bunu dengeler.

---

## 2. Aşamalar (kilometre taşları)

Her aşama bir **kilometre taşı** ile biter. Bir aşama bitmeden sonrakine geçmek zorunlu değildir; tablodaki sıra, bağımlılıklara göre en az beklemeli sıradır.

### Aşama 1 — Temel (Faz 0)
**Hedef:** Lint, test ve CI çalışan boş ama kurallı bir proje.

| Sıra | Eymen | Arkadaş |
|---|---|---|
| 1 | **T0.1** Expo iskeleti ve repo ⚠️ *her şeyi bloklar, ilk gün bitmeli* | (T0.1'i bekler; K2 için hesap araştırması) |
| 2 | **T0.2** ESLint + katman import kuralları | **T0.3** Test altyapısı (Jest + deno test + `Clock`) |
| 3 | **T0.4** Supabase ortamları + `health` şablonu | **T0.8** Tema, i18n, saha bileşenleri |
| 4 | **T0.5** EAS + mağaza hesapları (K2) | **T0.7** Sentry + config modülü (T0.5 sonrası) |
| 5 | **T0.6** CI hattı | — |

✅ **Kilometre taşı:** `main`'e merge için 6 CI job'ı zorunlu; `GET /health` üç ortamda 200; development build iki platformda açılıyor.

### Aşama 2 — Veri, senkron ve giriş (Faz 1)
**Hedef:** Kullanıcı telefonla giriş yapar, onboarding'i tamamlar; veri çevrimdışı yazılıp senkronlanır.

| Sıra | Eymen | Arkadaş |
|---|---|---|
| 1 | **T1.1** Domain varlıkları + zod şemaları ⚠️ *ikiniz de buna bağlısınız* | (T0.8 / T0.7 bitirilir, T1.1 beklenir) |
| 2 | **T1.2** Supabase şeması + `sync` fonksiyonu | **T1.4** Yerel SQLite şeması (Drizzle) |
| 3 | **T1.3** RLS politikaları | **T1.5** Repository katmanı |
| 4 | **T1.6** İstemci senkron motoru | **T1.7** Kimlik doğrulama |
| 5 | **T4.1** Referans içerik servisi *(öne çekildi: T2.2 buna bağlı)* | **T1.9** Ayarlar + senkron ekranı, ardından **T1.8** Onboarding |

✅ **Kilometre taşı:** Uçak modunda yazılan kayıt, ağ gelince sunucuya gider; başka işletmenin verisi RLS ile görünmez.

### Aşama 3 — Arılık ve kovan yönetimi (Faz 2)
**Hedef:** Arılık ve kovan ekleme, listeleme, taşıma, kraliçe takibi, QR etiket ve tarama.

| Sıra | Eymen | Arkadaş |
|---|---|---|
| 1 | **T4.2** İlk içerik derlemesi (iklim, nektar, ilaç seed'leri) | **T2.1** Konum izni servisi |
| 2 | **T2.3** Kovan oluşturma (tekli/toplu) *(T2.2 biter bitmez)* | **T2.2** Arılık yönetimi |
| 3 | **T2.4** Kovan listesi, arama, toplu işlemler | **T2.5** Kraliçe takibi |
| 4 | **T2.6** Kovan taşıma | **T2.7** QR etiket PDF |
| 5 | **T5.1** `weather-forecast` fonksiyonu *(öne çekildi)* | **T2.8** QR tarayıcı |

✅ **Kilometre taşı:** 200 kovanlık arılık sorunsuz listeleniyor; basılan QR etiket okutulunca doğru kovan açılıyor.

### Aşama 4 — Saha denetimi (Faz 3)
**Hedef:** Arıcı sahada denetim, ilaçlama, besleme ve bal sağımını kaydedip kovan geçmişini görür.

| Sıra | Eymen | Arkadaş |
|---|---|---|
| 1 | **T3.3** İlaçlama + arınma süresi | **T3.1** Hızlı denetim formu |
| 2 | **T3.4** Besleme kaydı | **T3.2** Toplu denetim oturumu |
| 3 | **T3.5** Bal sağımı + çakışma uyarısı | **T3.6** Kovan detayı ve zaman çizelgesi |
| 4 | **T4.4** Kural motoru çekirdeği *(öne çekilebilir)* | **T3.7** Arılık özet paneli |

✅ **Kilometre taşı:** Bir arılığın tüm kovanları tek oturumda denetlenip özet alınabiliyor; arınma süresindeki kovan için hasat uyarısı çıkıyor.

### Aşama 5 — Takvim ve akıllı öneriler (Faz 4)
**Hedef:** Uygulama, bölgeye ve kovan durumuna göre yapılacak işleri takvimde önerir.

| Sıra | Eymen | Arkadaş |
|---|---|---|
| 1 | **T4.5** 13 MVP kuralı | (T3.6 / T3.7 bitirilir) |
| 2 | **T4.3** İçerik geri bildirimi (K5 gerekli) | **T4.6** Görev materyalizasyon servisi |
| 3 | — | **T4.7** Takvim ekranları + ana sayfa "bugün" kartı |
| 4 | — | **T4.8** Sorumluluk reddi |

✅ **Kilometre taşı:** Ana sayfada bugünün görevleri; tamamlanan/ertelenen görev tekrar üretilmiyor.

### Aşama 6 — Hava durumu ve bildirimler (Faz 5)

| Sıra | Eymen | Arkadaş |
|---|---|---|
| 1 | **T5.5** Push token servisi | **T5.2** İstemci hava servisi + UI |
| 2 | **T5.3** Hava sinyalleri ve kuralları (T5.2 sonrası) | **T5.4** Yerel bildirimler + ayar ekranı |
| 3 | **T5.6** `weather-alerts` cron fonksiyonu | **T5.7** Arka plan görev koordinatörü |

✅ **Kilometre taşı:** Kötü hava uyarısı push olarak geliyor; takvim görevleri yerel bildirim üretiyor.

### Aşama 7 — Abonelik, hukuk ve hesap (Faz 6)

| Sıra | Eymen | Arkadaş |
|---|---|---|
| 1 | **T6.6** Veri dışa aktarma (CSV) | **T6.1** RevenueCat servis katmanı (K1 gerekli) |
| 2 | **T6.2** RevenueCat webhook + kota (T6.1 sonrası) | **T6.3** Paywall ve abonelik ekranları |
| 3 | **T6.5** Hesap silme | **T6.4** Hukuki metin ekranları (K4 gerekli) |

✅ **Kilometre taşı:** Ücretsiz limit sunucuda da zorlanıyor; satın alma ve geri yükleme iki platformda çalışıyor; hesap silme tüm veriyi temizliyor.

### Aşama 8 — Kalite, beta ve yayın (Faz 7)

| Sıra | Eymen | Arkadaş |
|---|---|---|
| 1 | **T7.2** Çevrimdışı ve çoklu cihaz testleri | **T7.1** Maestro E2E akışları |
| 2 | (beta için K5 grubu ve TestFlight/Play hazırlığı) | **T7.3** Performans optimizasyonu |
| 3 | **T7.5** Mağaza meta verileri ve formlar (T7.4 sonrası) | **T7.4** İzinler, gizlilik manifesti, erişilebilirlik |
| 4 | **T7.6** Kapalı beta 🤝 *(ortak; lider Eymen)* | **T7.6** Beta geri bildirimlerinin UI düzeltmeleri |
| 5 | **T7.7** Eş zamanlı yayın 🤝 | **T7.7** Mağaza son kontrolleri |
| 6 | **T7.8** Yayın sonrası izleme | — |

✅ **Kilometre taşı:** Crash-free > %99 beta; iki mağazada aynı gün canlı.

---

## 3. Kritik el değiştirme noktaları

Bir kişinin işi diğerini beklettiği yerler. Bunlar öncelikli bitirilmeli ve bitince diğerine haber verilmeli:

| Bekleyen | Beklenen iş | Neden |
|---|---|---|
| Arkadaş | **T0.1** (Eymen) | Proje iskeleti olmadan hiçbir şey başlamaz |
| İkiniz | **T1.1** (Eymen) | Hem SQLite şeması hem Supabase şeması domain varlıklarından türer |
| Eymen | **T1.5** (Arkadaş) | Senkron motoru (T1.6) outbox'lı repository'lere bağlı |
| Arkadaş | **T1.6** (Eymen) | Onboarding (T1.8) ve senkron ekranı (T1.9) senkron motoruna bağlı |
| Arkadaş | **T4.1** (Eymen) | Arılık formu (T2.2) iklim profillerini referans içerikten okur |
| Eymen | **T2.2** (Arkadaş) | Kovan oluşturma (T2.3) ve hava fonksiyonu (T5.1) arılığa bağlı |
| Arkadaş | **T2.4** (Eymen) | Toplu denetim oturumu (T3.2) kovan listesine bağlı |
| Arkadaş | **T3.3–T3.5** (Eymen) | Kovan zaman çizelgesi (T3.6) tüm kayıt türlerine bağlı |
| Arkadaş | **T4.5** (Eymen) | Görev üretimi (T4.6) kurallara bağlı |
| Eymen | **T6.1** (Arkadaş) | Webhook ve kota (T6.2) abonelik servisine bağlı |

**Paylaşılan dosyalar** (çakışma riski): `src/domain/entities/*`, `src/data/db/schema/*`, `src/i18n/tr.json`, `package.json`, `app.config.ts`. Bu dosyalara dokunan PR'lar küçük tutulmalı ve hızlı merge edilmeli.

---

## 4. Açık kararlar — kim, ne zamana kadar

| Karar | Sorumlu | Son tarih (hangi görevden önce) |
|---|---|---|
| **K2** Bundle ID, Apple/Google hesap türü | Eymen | T0.5 — **Aşama 1, en acil** |
| **K5** En az 12 kişilik beta arıcı grubu | Arkadaş | T4.3 (Aşama 5) |
| **K1** Pro fiyatı, ücretsiz kovan limiti | Birlikte | T6.1 (Aşama 7) |
| **K4** KVKK yurt dışı aktarım hukuki görüşü | Eymen | T6.4 (Aşama 7) |
| **K3** Open-Meteo ticari plan / MET Norway yedeği | Eymen | T7.7 (Aşama 8) |

---

## 5. Çalışma kuralları

1. **Dal adı:** `t<faz>.<sıra>-kisa-ad` (ör. `t1.2-sync-function`). Bir görev = bir PR.
2. **Çapraz inceleme:** Her PR'ı diğer kişi onaylar. Eymen'in backend PR'ını Arkadaş, Arkadaş'ın ekran PR'ını Eymen inceler; böylece ikiniz de tüm sistemi tanırsınız.
3. **Bitti tanımı:** `TODO.md`'deki kabul kriterleri iOS **ve** Android'de doğrulandı, CI yeşil, PR şablonundaki kutucuklar işaretli.
4. **TODO.md güncelleme:** Görevi bitiren kişi aynı PR'da kabul kriteri kutucuklarını `[x]` yapar ve **Güncel Durum** bölümünü günceller.
5. **Haftalık senkron (15 dk):** Biten görevler, bu haftanın el değiştirmeleri, bekleyen kararlar (K1–K5).
6. **Eksik dosya:** `TODO.md` mimari kurallar için önce `CLAUDE.md`'yi okumayı söylüyor; bu dosya henüz yok ve T0.1 kapsamında yazılacak.
