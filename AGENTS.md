# Workspace Agent Contract

Bu repo Google Antigravity ile otonom geliştirilecektir. Aşağıdaki kurallar **zorunludur**.

## 1. Önce Oku

Her yeni ana görevde sırasıyla oku:

1. `docs/00_DECISIONS_AND_PRECEDENCE.md`
2. `docs/05_DOMAIN_MODEL_AND_INVARIANTS.md`
3. İlgili teknik doküman(lar)
4. İlgili `.agents/skills/*/SKILL.md`

Kod yazmadan önce mevcut kodu keşfet; aynı davranışın ikinci implementasyonunu oluşturma.

## 2. Çelişki Çözme

Öncelik:

1. Kullanıcının o anki açık talimatı.
2. `docs/00_DECISIONS_AND_PRECEDENCE.md`.
3. Domain invariant dokümanları.
4. Excel planı + deterministik import normalizasyonu.
5. PRD/SRS.
6. Teknik tercih dokümanları.
7. Mevcut kod.

Çelişkiyi tahminle çözme. Yukarıdaki sırayı uygula, kararın gerekçesini `docs/DECISION_LOG.md` içine ekle.

## 3. Otonom Çalışma

Kullanıcının önceden karara bağladığı konuları tekrar sorma. Belirsizlik varsa güvenlik, veri bütünlüğü, sadelik ve domain invariantlarını koruyan en düşük riskli kararı ver; `DECISION_LOG.md`'a kaydet.

Yalnızca şu durumlarda kullanıcı müdahalesi gerekir:

- dış servis credential/secrets olmadan devam etmek fiziksel olarak imkânsızsa,
- geri döndürülemez prod veri silme/değiştirme gerekiyorsa,
- kullanıcı adına ücretli işlem yapılması gerekiyorsa.

Bunların dışında durma.

## 4. Quality Gate

Bir fazdaki sorunlar **tespit + çözüm + doğrulama** tamamlanmadan sonraki faza geçme. Sadece sorun listesi üretip ilerlemek yasaktır.

Her değişiklikten sonra uygun kombinasyonu çalıştır:

- typecheck
- lint
- unit tests
- integration tests
- RLS/security tests
- E2E tests
- build

Failing gate varken işi tamamlanmış sayma.

## 5. Kod İlkeleri

- TypeScript strict.
- `any`, `@ts-ignore`, non-null assertion ve unsafe cast istisna olmalıdır; gerekçe yoksa kullanma.
- Server/client sınırını açık tut.
- Domain kuralları UI component içine gömülmez.
- DB erişimi typed repository/server layer üzerinden yapılır.
- Tarih/saat tek saat dilimi: `Europe/Istanbul`.
- Tüm tarih-only değerler `YYYY-MM-DD` olarak domain'de korunur.
- Para/reklam/ödeme/sosyal özellik yok.
- Öğrenciyi başka öğrencilerle kıyaslayan hiçbir metrik yok.

## 6. Güvenlik

- Browser'a service-role/secret key koyma.
- Exposed her Supabase tablosunda RLS + minimal GRANT.
- Anonymous student auth `authenticated` rolüdür; JWT `is_anonymous` kontrolü gerekir.
- Student cihazı yalnız kendi student_id verisini görür/yazar.
- Adult viewer read-only'dir.
- Owner/admin planı yönetebilir.
- Public profile/public API yok.
- Secrets commit edilmez.

## 7. Plan Bütünlüğü (LGS 2027 Final 500 Planı)

`data/LGS_2027_MASTER_PLAN.xlsx` (veya `LGS_2027_MASTER_PLAN_500_FINAL.xlsx`) nihai kaynak-gerçeklik planıdır (256 Gün, 2.947 Görev).

Önemli semantik:

- **Matematik Modeli**: Bağımsız bir "Matematik Günlük Rutini / Benchmark 20" görevi YOKTUR. Her öğrenme gününde Matematik: **Konu Videosu → Aynı Konunun Soruları** zinciridir. Konu sorularının **ilk 20 sorusu** ileri sayımlı kronometreyle ölçülür; D/Y/B ve süre kaydedilir.
- **Türkçe Modeli**: Her öğrenme gününde **Paragraf Rutini (ilk 20 soru ileri sayımlı ölçüm)** → Türkçe Konu Videosu → Türkçe Konu Soruları zinciridir.
- **3. Ders Deterministik Döngüsü**: `Fen Bilimleri → Din Kültürü → İnkılap Tarihi → İngilizce → ...` sırasıyla 195 öğrenme günü boyunca 0 rotasyon hatasıyla döner.
- **Video Çözümleme**: YouTube videoları için karmaşık video ID çözümü yapılmaz; ilgili dersin genel oynatma listesi URL'si açılır (`Oynatma Listesini Aç`) ve "Bu konunun videosunu izledim" butonuyla tamamlanır.
- **Dönemler ve Kilometre Taşları**:
  - `1 Ekim 2026`: Çalışma planı başlangıcı (Öncesinde: "Plan 1 Ekim 2026 tarihinde başlıyor" ekranı).
  - `13 Nisan 2027`: Tüm LGS konu öğretiminin kesin bitiş tarihi.
  - `14 Nisan – 12 Haziran 2027`: 60 Gün / 60 Tam LGS Deneme Sınavı dönemi.
  - `13 Haziran 2027`: Geçici Sınav Çapa Günü.
- **Hız Grafiği & Karşılaştırma**: Yalnızca tam 20 soruluk standart benchmark bloklarını karşılaştırır. Ek sorular benchmark süresine dahil edilmez.
- **Kronometre**: İleri sayar; hedef veya geri sayım yoktur.
- **Kitap Okuma**: Opsiyoneldir ve yalnız o günün zorunlu işleri bittikten sonra açılır.
- **Uyku ve Dinlenme**: 22:00 uyku; 21:50 sonrası yeni zorunlu çalışma başlatılmaz.
- **Üretim Kodunda Sahte Veri Yasağı**: `buildDefaultTodayData()` vb. sahte görevler kesinlikle bulunamaz; tüm veriler Supabase'den gerçek yüklenir.

## 8. UI İlkeleri

- Öğrenci ana ekranının ana sorusu: “Bugün ne yapacağım?”
- Mobil önce.
- Minimum 44x44 px hedefler.
- Timer kırmızı/baskıcı görünmez.
- “geciktin”, “başarısız”, “seri bozuldu” gibi utandırıcı dil yok.
- Renk tek başına durum iletmez.
- WCAG 2.2 AA hedefi.

## 9. Definition of Done

Bir iş ancak:

- acceptance criteria karşılanmış,
- testler yazılmış ve geçmiş,
- güvenlik etkisi değerlendirilmiş,
- doküman/traceability güncellenmiş,
- build geçmiş,
- regression yoksa tamamdır.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
