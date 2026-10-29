# Yol Haritası ve İş Bölümü

> Kaynak: [`TODO.md`](../TODO.md) (61 görev, 8 faz). Bu belge görevleri **iki döneme** ve **iki kişiye** dağıtır. Görevlerin kapsamı, dosya listesi ve kabul kriterleri için her zaman `TODO.md` esastır.
>
> Ekip: **Eymen** ve **Arkadaş** (adı netleşince bu belgede değiştirilecek).
>
> Son güncelleme: 2026-10-29. Dönem A kodu Claude ve ChatGPT arasında paylaştırıldı (§2.4). Önceki not (2026-10-24): İş bölümü "temeli Eymen atar, özellikleri sonra birlikte ekleriz" modeline çevrildi.

---

## 1. İş bölümü mantığı

Proje iki döneme ayrılır:

| | **Dönem A — Temel** | **Dönem B — Özellik geliştirme** |
|---|---|---|
| Ne yapılır | İskelet, kurallar, test, sunucu, veritabanı, senkron, giriş: uygulamanın "tesisatı" | Arıcının gördüğü ekranlar ve özellikler, tasarım, sesler |
| Kod kimde | **Eymen** (Claude ve ChatGPT ile paralel, §2.4) | Ekran/özellik işleri **Arkadaş** (Claude ile, "vibe coding"); sunucu ve altyapı işleri **Eymen** |
| Arkadaş ne yapar | Kod yazmaz; tasarım, ses ve içerik hazırlığı yapar (bkz. §2.2) | Hazır temelin üstüne özellik ekler |
| Bitiş ölçütü | Dönem A kilometre taşı (§2.3) | Mağazada yayın |

**Neden böyle?** Mimari kurallar (`CLAUDE.md`, `eslint.config.js`) ve altyapı oturduktan sonra yeni özellik eklemek "şablonu takip etmek" haline gelir. Arkadaş, kuralları çiğneyen kod yazamaz; lint buna izin vermez. Bu yüzden temelin tek elden ve sağlam atılması, Dönem B'yi hem hızlı hem güvenli yapar.

---

## 2. Dönem A — Temel (Eymen)

### 2.1 Eymen'in sırası

Dönem A'nın kodunu Eymen, **Claude** ve **ChatGPT**'yi aynı anda çalıştırarak yazar. Ayrıntılı paylaşım §2.4'te.

| Sıra | Görev | Yapan | Durum |
|---|---|---|---|
| 1 | **T0.1** Expo iskeleti ve repo | Eymen | ✅ |
| 2 | **T0.2** ESLint + katman import kuralları | Eymen | ✅ |
| 3 | **T0.3** Test altyapısı (Jest + deno test + `Clock`) | Eymen | ✅ |
| 4 | **T0.4** Supabase ortamları + `health` fonksiyonu şablonu | Eymen | ✅ |
| 5 | **T0.5** EAS + mağaza hesapları (önce **K2** kararı) | Eymen (elle) | 🔄 ayarlar hazır, hesaplar en sona |
| 6 | **T0.7** Sentry + config modülü | Eymen (elle) | 🔄 kod hazır, Sentry hesabı en sona |
| 7 | **T0.6** CI hattı | Eymen (elle) | 🔄 iş akışları hazır, GitHub ayarları bekliyor |
| 8 | **T0.8** Tema, i18n, saha bileşenleri (renkler/yazı tipleri Arkadaş'ın tasarımından) | ChatGPT | ⏭️ sıradaki |
| 9 | **T1.1** Domain varlıkları + zod şemaları | Claude | ✅ |
| 10 | **T1.2** Supabase şeması + `sync` fonksiyonu | Claude | |
| 11 | **T1.3** RLS politikaları | Claude | |
| 12 | **T1.4** Yerel SQLite şeması (Drizzle) | ChatGPT | |
| 13 | **T1.5** Repository katmanı | ChatGPT | |
| 14 | **T1.6** İstemci senkron motoru | Claude | |
| 15 | **T1.7** Kimlik doğrulama (telefon + OTP) | ChatGPT | |
| 16 | **T1.9** Ayarlar + senkron durum ekranı | ChatGPT | |
| 17 | **T1.8** Onboarding | ChatGPT | |
| 18 | **T4.1** Referans içerik servisi | Claude | |
| 19 | **T2.1** Konum izni servisi *(T2.2 buna bağlı olduğu için Dönem A'ya alındı)* | Claude | |
| 20 | **T2.2** Arılık yönetimi — **örnek özellik**: Dönem B'de her yeni özellik buna bakılarak yazılır | Claude | |

### 2.2 Arkadaş bu sırada (kod yazmadan)

| İş | Ne zamana kadar | Nereye girer |
|---|---|---|
| **Tasarım:** renk paleti, yazı tipleri, ikonlar, ana ekran taslakları (Claude Designer) | T0.8'den önce | `src/theme/*`, bileşenler |
| **Sesler:** dokunma, kaydetme, uyarı sesleri seçimi | Dönem B başı | TODO'da henüz görev yok; Dönem B'de eklenecek |
| **Ekran taslakları:** arılık, kovan, denetim formu, takvim | Dönem B başı | Faz 2–4 ekranları |
| **İçerik derleme:** iklim profilleri, nektar akışları, ilaç listesi (tablo olarak) | T4.2'den önce | `supabase/seed/reference/*` |
| **K5:** en az 12 kişilik beta arıcı grubu | T4.3'ten önce | Beta |
| **Kod okuma:** Eymen'in PR'larını açıp okumak, anlamadığını sormak | Sürekli | Dönem B'ye hazırlık |

### 2.3 Dönem A kilometre taşı
- `main`'e merge için CI job'ları zorunlu; `GET /health` üç ortamda 200.
- Development build iOS ve Android'de açılıyor.
- Telefonla giriş + onboarding çalışıyor; uçak modunda yazılan kayıt ağ gelince sunucuya gidiyor; başka işletmenin verisi görünmüyor.
- Arılık özelliği (T2.2) uçtan uca çalışıyor ve Dönem B için örnek görevi görüyor.

### 2.4 Dönem A'da Claude ve ChatGPT paylaşımı

**Şeritler:**
- **Claude — sunucu ve veri sözleşmesi:** domain varlıkları, Supabase şeması, RLS, `sync` ve `reference-content` fonksiyonları, istemci senkron motoru, örnek özellik (arılık).
- **ChatGPT — uygulama içi temel:** tema ve saha bileşenleri, yerel SQLite, repository'ler, giriş, ayarlar ve onboarding ekranları.
- **Eymen:** iki şeridi başlatır, PR'ları inceleyip merge eder, cihazda (iOS/Android) doğrular, hesap/ayar işlerini (T0.5, T0.6, T0.7) elle yapar.

**Turlar** (aynı satırdaki iki iş aynı anda yürür; bir sonraki tura geçmeden o turun PR'ları `main`'e merge edilir):

| Tur | Claude | ChatGPT | Tur sonunda gereken |
|---|---|---|---|
| 1 | **T1.1** Domain varlıkları | **T0.8** Tema + bileşenler | T1.1 merge edilmeden ChatGPT T1.4'e geçemez |
| 2 | **T1.2** Supabase şeması + `sync`, ardından **T1.3** RLS | **T1.4** SQLite, ardından **T1.5** repository'ler | T1.5 merge edilmeden Claude T1.6'ya geçemez |
| 3 | **T1.6** Senkron motoru | **T1.7** Giriş (telefon + OTP) | T1.6 + T1.7 merge edilmeden onboarding başlamaz |
| 4 | **T4.1** Referans içerik | **T1.9** Ayarlar/senkron ekranı, ardından **T1.8** Onboarding | T1.8 merge edilmeden T2.1 başlamaz |
| 5 | **T2.1** Konum, ardından **T2.2** Arılık (örnek özellik) | Dönem A'dan kalan düzeltmeler, Dönem B hazırlığı | Dönem A kilometre taşı (§2.3) |

**Çakışmayı önleme kuralları:**
1. **Dosya sahipliği:** `src/domain/**` ve `supabase/**` Claude'un; `src/theme/**`, `src/components/ui/**`, `src/i18n/**`, `src/data/db/**`, `src/data/repositories/**` ChatGPT'nin. Diğerinin alanında değişiklik gerekiyorsa küçük tutulur ve PR açıklamasında belirtilir.
2. **Ortak dosyalar** (`package.json`, `package-lock.json`, `TODO.md`, `docs/YOL_HARITASI.md`, `src/i18n/tr.json`): PR açmadan önce güncel `main` alınır; çakışma çıkarsa PR'ı açan taraf çözer, diğerinin satırlarını silmez.
3. **Bağımlılık eklemek:** Her iki taraf da yalnızca kendi görevinin gerektirdiği paketi ekler (`npx expo install <paket>`).
4. **Dal adı:** `claude/t<faz>.<sıra>-kisa-ad` ve `chatgpt/t<faz>.<sıra>-kisa-ad`. Bir görev = bir PR; `main`'e doğrudan push yok.
5. **Durum:** Görevi bitiren, aynı PR'da `TODO.md` → Güncel Durum ve bu belgedeki §2.1 tablosunu günceller.

---

## 3. Dönem B — Özellik geliştirme

| Aşama | Arkadaş (ekran ve özellik) | Eymen (sunucu, altyapı, inceleme) |
|---|---|---|
| **3 — Arılık ve kovan (Faz 2)** | T2.3 Kovan oluşturma, T2.4 Kovan listesi, T2.5 Kraliçe takibi, T2.6 Kovan taşıma, T2.7 QR etiket PDF, T2.8 QR tarayıcı | T4.2 İlk içerik seed'leri (Arkadaş'ın derlediği tablolardan), T5.1 `weather-forecast` fonksiyonu |
| **4 — Saha denetimi (Faz 3)** | T3.1 Denetim formu, T3.2 Toplu denetim, T3.3 İlaçlama, T3.4 Besleme, T3.5 Bal sağımı, T3.6 Kovan detayı, T3.7 Arılık özet paneli | T4.4 Kural motoru çekirdeği |
| **5 — Takvim (Faz 4)** | T4.7 Takvim ekranları, T4.8 Sorumluluk reddi | T4.5 13 MVP kuralı, T4.6 Görev üretim servisi, T4.3 İçerik geri bildirimi |
| **6 — Hava ve bildirim (Faz 5)** | T5.2 Hava kartı ve ekranı, T5.4 Bildirim ayarları | T5.3 Hava sinyalleri, T5.5 Push token servisi, T5.6 `weather-alerts` cron, T5.7 Arka plan görevleri |
| **7 — Abonelik ve hesap (Faz 6)** | T6.3 Paywall ekranları, T6.4 Hukuki metin ekranları | T6.1 RevenueCat servisi (K1), T6.2 Webhook + kota, T6.5 Hesap silme, T6.6 CSV dışa aktarma |
| **8 — Kalite ve yayın (Faz 7)** | T7.3 Performans, T7.4 Erişilebilirlik, ses ve tasarım cilası, beta geri bildirim düzeltmeleri | T7.1 E2E testleri, T7.2 Çevrimdışı testler, T7.5 Mağaza formları, T7.6 Beta 🤝, T7.7 Yayın 🤝, T7.8 İzleme |

Dönem B'de Arkadaş'ın her PR'ını Eymen inceler. Lint ve CI geçmeyen PR merge edilmez.

---

## 4. Kritik el değiştirme noktaları

| Bekleyen | Beklenen | Neden |
|---|---|---|
| Eymen (T0.8) | Arkadaş'ın renk/yazı tipi tasarımı | Tema dosyaları tasarımdan doldurulur |
| Eymen (T4.2) | Arkadaş'ın içerik tabloları | Seed dosyaları bu tablolardan yazılır |
| Arkadaş (Dönem B'nin tamamı) | Dönem A kilometre taşı | Özellikler giriş, senkron ve örnek özellik üstüne kurulur |
| Arkadaş (T3.6) | T3.3–T3.5 | Zaman çizelgesi tüm kayıt türlerine bağlı |
| Arkadaş (T4.7) | Eymen'in T4.5–T4.6 işleri | Takvim ekranı üretilen görevleri gösterir |
| Eymen (T6.2) | T6.1 | Webhook abonelik servisine bağlı |

**Paylaşılan dosyalar** (çakışma riski): `src/domain/entities/*`, `src/data/db/schema/*`, `src/i18n/tr.json`, `package.json`, `app.config.ts`. Bu dosyalara dokunan PR'lar küçük tutulmalı ve hızlı merge edilmeli.

---

## 5. Açık kararlar — kim, ne zamana kadar

| Karar | Sorumlu | Son tarih (hangi görevden önce) |
|---|---|---|
| **K2** Bundle ID, Apple/Google hesap türü | Eymen | T0.5 — **en acil** |
| **K5** En az 12 kişilik beta arıcı grubu | Arkadaş | T4.3 |
| **K1** Pro fiyatı, ücretsiz kovan limiti | Birlikte | T6.1 |
| **K4** KVKK yurt dışı aktarım hukuki görüşü | Eymen | T6.4 |
| **K3** Open-Meteo ticari plan / MET Norway yedeği | Eymen | T7.7 |

---

## 6. Çalışma kuralları

1. **Dal adı:** `t<faz>.<sıra>-kisa-ad` (ör. `t0.4-supabase-health`). Bir görev = bir PR.
2. **İnceleme:** Dönem A'da Eymen PR'larını kendisi merge eder; Arkadaş okuyup soru sorar. Dönem B'de Arkadaş'ın PR'larını Eymen onaylar.
3. **Bitti tanımı:** `TODO.md`'deki kabul kriterleri iOS **ve** Android'de doğrulandı, lint ve CI yeşil.
4. **TODO.md güncelleme:** Görevi bitiren kişi aynı PR'da kutucukları `[x]` yapar ve **Güncel Durum** bölümünü günceller.
5. **Haftalık senkron (15 dk):** Biten görevler, tasarım/içerik teslimleri, bekleyen kararlar (K1–K5).
6. **Kurallar:** Mimari kuralların özeti `CLAUDE.md`'de; lint bu kuralları otomatik denetler (`npm run lint`).
