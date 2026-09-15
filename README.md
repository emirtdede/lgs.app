<div align="center">

# 🎯 LGS 2027 — Kişiselleştirilmiş LGS Hazırlık & Disiplinli Takip Sistemi

</div>

---

<div align="center">

[![](https://img.shields.io/badge/Language-English-blue?style=for-the-badge&logo=google-translate)](#english-version)
&nbsp;&nbsp;&nbsp;&nbsp;
[![](https://img.shields.io/badge/Dil-T%C3%BCrk%C3%A7e-red?style=for-the-badge&logo=google-translate)](#turkish-version)

</div>

---

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-WebAPK_Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![Android](https://img.shields.io/badge/Android-Capacitor_8-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-5.0-FCC72B?style=for-the-badge&logo=vitest&logoColor=black)
![Playwright](https://img.shields.io/badge/Playwright-1.63-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
[![Website](https://img.shields.io/badge/Website-lgsapp.vercel.app-0070F3?style=for-the-badge&logo=googlechrome&logoColor=white)](https://lgsapp.vercel.app)
[![Developer](https://img.shields.io/badge/Developer-Vellium-7928CA?style=for-the-badge)](https://vellium.dev)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

</div>

---

<a id="english-version"></a>
# English Version

<div align="center">
  <h3>LGS 2027 Study & Habit Tracker — Personalized Academic Mastery Platform</h3>
  <p><em>A stress-free, growth-mindset, family-aligned study companion engineered for high-school entrance exam (LGS) mastery</em></p>
  <p><strong>Project Website: <a href="https://lgsapp.vercel.app">lgsapp.vercel.app</a> &bull; Developed & Published by <a href="https://vellium.dev">Vellium</a></strong></p>
</div>

<br>

## 💻 Project Overview

**LGS 2027** is a modern, high-fidelity, mobile-first academic and habit-tracking platform designed specifically for an 8th-grade student preparing for Turkey's nationwide High School Entrance Exam (LGS). Engineered with **Next.js 16 (App Router & Turbopack)**, **React 19**, **TypeScript 6.0 (Strict)**, and **Tailwind CSS v4**, the application is backed by a resilient cloud architecture featuring **Supabase (PostgreSQL with Row Level Security)**, an **Offline-First Synchronization Engine (IndexedDB)**, and **Capacitor 8 / PWA WebAPK** native integration.

Unlike generic study apps that induce stress through toxic countdowns, ranking tables, and public shaming notifications, **LGS 2027** prioritizes psychological safety and pedagogical soundness:

- **Strict Growth-Mindset Environment**: Zero social comparison, zero peer leaderboards, and absolute prohibition of shaming or guilt-inducing terminology (enforced through automated CI guardrail tests).
- **Count-Up Benchmark 20 Routine**: Speed and accuracy are timed with a calm forward-counting stopwatch (no intimidating alarms or countdown clocks).
- **Deterministic 256-Day Master Curriculum**: An immutable schedule covering 2,947 granular study tasks across 6 subjects, running from **October 1, 2026** to **June 13, 2027** (incorporating a final 60-day / 60 full mock-exam phase).
- **Deterministic 3rd Subject Rotation**: Zero drift cycling between Science, Religious Studies, History, and English across 195 teaching days.
- **Family Role Hierarchy & Anonymous Pairing**: Student device connects anonymously via a one-time cryptographic 6-digit pairing code with zero password friction, while parent/guardian accounts maintain read-only analytics and audited plan oversight.
- **Offline-First Resilience**: Full offline operation via IndexedDB; completed tasks, notes, and benchmark timings automatically queue and synchronize upon network reconnection.
- **270 Daily Motivation Quotes**: Unique, bespoke growth-mindset inspirations mapped to each calendar day of the preparation journey.

---

## 🚀 Key Features

- **Single Mobile-First Question**: Student interface revolves around one intuitive core question: *"What will I achieve today?"*
- **Forward-Counting Benchmark Stopwatch**:
  - Measures speed and accuracy on standardized 20-question benchmark blocks.
  - Refresh-resilient state recovery with atomic server-side session locks.
  - Glassmorphic, calming visual aesthetics without high-stress red indicators.
- **Deterministic Curriculum & Milestones**:
  - **Start Date**: October 1, 2026.
  - **Curriculum Completion**: April 13, 2027.
  - **Final Mock Exam Phase**: April 14 – June 12, 2027 (60 days / 60 full trials).
  - **Exam Anchor Day**: June 13, 2027.
- **Zero Mock Data in Production**: All tasks, subjects, video playlists, and question blocks are loaded from verified PostgreSQL schema tables.
- **Restful Sleep Protection (21:50 Cutoff)**:
  - 22:00 sleep invariant.
  - Mandatory academic study initiation is locked after 21:50 to ensure adequate cognitive recovery.
  - Free reading unlocks only after mandatory academic tasks are completed.
- **Student Mistake Vault (Yanlış Havuzu)**:
  - Subject-categorized mistake tracking with photo attachments and personal notes.
  - Structured categorization (Knowledge Gap, Reading Comprehension, Calculation Error, Carelessness).
- **Bespoke Apple-Minimalist Notes System**:
  - Clean, airy note-taking workspace with subject badges and instant filtering.
- **Comprehensive Family Analytics**:
  - Overall curriculum completion percentage.
  - True speed evolution (seconds/question) across standardized 20-question routines.
  - Subject-by-subject accuracy distribution (Correct / Incorrect / Blank).
  - Audited rescheduling ledger for missed or postponed tasks.
- **Opt-In Notification Service**:
  - Strictly opt-in architecture with granular toggles (Daily Inspiration, Evening Rest, Scheduled Reminders).
- **Professional SVG Iconography**:
  - Clean Lucide SVG iconography across all views with zero informal emojis.

---

## 🛠️ Tech Stack

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_16.3-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor_8-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)
![Zod](https://img.shields.io/badge/Zod_3.25-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

</div>

### Frontend & User Experience
- **Next.js 16.3 (App Router & Turbopack)**: Blazing fast server-rendered views, route handlers, and static optimization.
- **React 19.3**: Modern concurrent rendering, transitions, and client-side reactive components.
- **TypeScript 6.0**: Strict type-safety, zero `any` policy, and exhaustive domain models.
- **Tailwind CSS v4**: High-performance CSS engine with native CSS variables and dark mode support.
- **Lucide React**: Crisp vector iconography tailored for accessible mobile interfaces.
- **Zod 3.25**: Robust runtime validation for schema enforcement and environment variables.

### Backend, Database & Security
- **Supabase (PostgreSQL 15+)**: Managed cloud database with ACID transactional integrity.
- **Row Level Security (RLS)**: Fine-grained policies isolating student data, pairing codes, and family scopes.
- **Anonymous Student Authentication**: Zero-credential device pairing via cryptographically hashed 6-digit codes.
- **Audited Rescheduling Ledger**: Enforces that only adult owners can postpone or reschedule study tasks.
- **Cloudflare Turnstile**: Zero-friction bot defense on pairing endpoints.

### Native Mobile & PWA
- **Progressive Web App (PWA)**: W3C compliant `manifest.webmanifest` and Service Worker (`sw.js`).
- **Google WebAPK**: Native Android installation directly from Chrome/Edge with standalone window display.
- **Capacitor 8 Android Bridge**: Native Android wrapper (`com.lgs2027.studytracker`) ready for Google Play or direct APK distribution.

### Quality Assurance & Automated Testing
- **Vitest 5.0**: In-memory unit and component testing suite (16 test files, 66 tests, 100% pass).
- **PGlite (In-Memory PostgreSQL)**: Real PostgreSQL engine running migrations and RLS verification tests in memory (8 test files, 30 tests, 100% pass).
- **Playwright 1.63**: Cross-browser End-to-End browser automation for mobile viewports.
- **A11y & Shame-Language Linters**: Automated regex scanners ensuring WCAG 2.2 AA accessibility and pedagogical compliance.

---

## 📁 Project Structure

```tree
LGS-App/
├── .agents/                        # AI development agent rules, skills & workflows
├── android/                        # Native Android studio project (Capacitor 8)
│   ├── app/src/main/               # Android Manifest, icons, and native splash screens
│   └── build.gradle                # Gradle configuration
├── data/                           # Master source documents
│   ├── LGS_2027_MASTER_PLAN.xlsx   # 256-day canonical curriculum workbook
│   └── resource_sources.json       # Curated video playlists and MEB resource catalog
├── docs/                           # Architectural specifications and domain invariants
│   ├── 00_DECISIONS_AND_PRECEDENCE.md # Core decision hierarchy
│   ├── 05_DOMAIN_MODEL_AND_INVARIANTS.md # Invariant rules
│   └── DECISION_LOG.md             # Formal decision history
├── public/                         # Public static web assets
│   ├── icons/                      # PWA icons (192x192, 512x512, maskable)
│   ├── manifest.webmanifest        # PWA web manifest specification
│   └── sw.js                       # Service worker for caching and push notifications
├── src/                            # Application source code
│   ├── app/                        # Next.js App Router architecture
│   │   ├── (auth)/                 # Pairing and authentication routes
│   │   ├── admin/                  # Adult administration (Plan & Mistakes)
│   │   ├── analiz/                 # Adult deep analytics
│   │   ├── ayarlar/                # Adult settings & notifications
│   │   ├── dashboard/              # Adult family overview dashboard
│   │   ├── kaynaklar/              # Curated MEB & video resources directory
│   │   ├── mistakes/               # Student mistake question vault
│   │   ├── notes/                  # Student Apple-minimalist notes system
│   │   ├── plan/                   # Student curriculum calendar & phase filters
│   │   ├── profile/                # Student profile, notifications & offline sync status
│   │   ├── progress/               # Student speed and accuracy evolution
│   │   ├── takvim/                 # Adult study calendar
│   │   ├── today/                  # Student daily primary workspace
│   │   ├── layout.tsx              # Root HTML layout with PWA metadata
│   │   └── page.tsx                # Gateway portal
│   ├── components/                 # Component library
│   │   ├── layout/                 # Navigation bars, bottom bars & headers
│   │   ├── student/                # BenchmarkTimer, TodayTasks, CutoffBanner, ReadingBlock
│   │   └── ui/                     # Badges, buttons, modals, input fields
│   ├── domain/                     # Pure domain logic & business rules
│   │   ├── motivation-quotes.ts    # 270 curated growth-mindset quotes
│   │   ├── time-utils.ts           # Europe/Istanbul timezone calculations
│   │   └── xlsx-parser.ts          # Normalization engine for study plan
│   ├── lib/                        # Core infrastructural libraries
│   │   ├── notifications.ts        # Granular opt-in notification manager
│   │   ├── offline-sync.ts         # IndexedDB mutation queue & network sync
│   │   └── supabase/               # Client, server, and admin Supabase instances
│   └── env.ts                      # Zod-validated environment configuration
├── supabase/                       # Supabase database layer
│   ├── migrations/                 # PostgreSQL DDL migrations (001 - 010)
│   └── seed.sql                    # Initial seed data
├── tests/                          # Automated testing suites
│   ├── components/                 # Component rendering and interaction tests
│   ├── db/                         # In-memory PGlite RLS & trigger tests
│   ├── e2e/                        # Playwright end-to-end workflows
│   └── unit/                       # Pure logic, parsing, and invariant tests
├── capacitor.config.ts             # Capacitor native mobile bridge configuration
├── next.config.ts                  # Next.js configuration & security headers
└── package.json                    # Project dependencies and script runner
```

---

## ⚙️ Installation & Usage

### Prerequisites
- **Node.js**: Version 20.0.0 or higher (Node 24 LTS recommended)
- **pnpm**: Version 10.0.0 or higher
- **Git**: Version 2.40+

### Step-by-Step Developer Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/emirtdede/lgs.app.git
   cd lgs.app
   ```

2. **Install Dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Create `.env.local` in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   NEXT_PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA"
   TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"
   ```

4. **Run Quality Verification & Testing Suites:**
   ```bash
   # TypeScript strict type check (0 errors)
   pnpm typecheck

   # ESLint code style scan
   pnpm lint

   # Code formatting verification
   pnpm format:check

   # Unit & Component test suite (Vitest)
   pnpm test

   # Database & RLS security test suite (PGlite in-memory PostgreSQL)
   pnpm test:db

   # End-to-end browser test suite (Playwright)
   pnpm test:e2e
   ```

5. **Start Local Development Server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Compile Production Build:**
   ```bash
   pnpm build
   pnpm start
   ```

---

## 📱 Android APK & Installation Options

1. **Instant WebAPK Installation (Recommended - Zero Setup):**
   - Open [https://lgsapp.vercel.app](https://lgsapp.vercel.app) in Chrome or Samsung Internet on any Android device.
   - Tap **"Install App"** or select **"Add to Home Screen"** from the browser menu.
   - Android automatically packages and installs the application as a standalone native WebAPK.
2. **PWABuilder Direct APK Package:**
   - Generate and download signed `.apk` binaries via [PWABuilder for LGS App](https://www.pwabuilder.com/reportcard?site=https://lgsapp.vercel.app).
3. **Native Capacitor Android Project:**
   - Open the `android/` directory in Android Studio.
   - Click **Build ➔ Build Bundle(s) / APK(s) ➔ Build APK(s)** for immediate offline debugging.

---

## ⚖️ License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

**Project Website**: [lgsapp.vercel.app](https://lgsapp.vercel.app) &bull; **Developer & Publisher**: [Vellium](https://vellium.dev)

---

<br>

---

<a id="turkish-version"></a>
# Türkçe Versiyon

<div align="center">
  <h3>LGS 2027 Çalışma ve Alışkanlık Takip Sistemi — Kişiselleştirilmiş Başarı Platformu</h3>
  <p><em>Öğrenciyi strese sokmayan, gelişim odaklı, aile içi uyumu ve disiplini merkeze alan LGS hazırlık sistemi</em></p>
  <p><strong>Proje Web Sitesi: <a href="https://lgsapp.vercel.app">lgsapp.vercel.app</a> &bull; Geliştirici ve Yayıncı: <a href="https://vellium.dev">Vellium</a></strong></p>
</div>

<br>

## 💻 Project Overview (Proje Genel Bakışı)

**LGS 2027**, 8. sınıf öğrencisi Yusuf'un Liselere Geçiş Sistemi (LGS) hazırlık sürecini 256 gün boyunca adım adım, huzurla ve pedagojik disiplinle yönetmesi için özel olarak geliştirilmiş modern bir akademik takip ve alışkanlık platformudur. **Next.js 16 (App Router & Turbopack)**, **React 19**, **TypeScript 6.0 (Strict)** ve **Tailwind CSS v4** ön yüz mimarisi üzerine inşa edilen uygulama; **Supabase (PostgreSQL Satır Düzeyi Güvenlik - RLS)**, **Çevrimdışı Senkronizasyon Motoru (IndexedDB)** ve **Capacitor 8 / PWA WebAPK** yerel mobil entegrasyonu ile tam donanımlı bir hibrit çözüm sunar.

Piyasadaki öğrencileri kırmızı geri sayımlarla, sıralama kaygısıyla ve utandırıcı bildirimlerle strese sokan ticari uygulamaların aksine, **LGS 2027** tamamen öğrencinin psikolojik sağlamlığı ve kalıcı öğrenmesi üzerine kurgulanmıştır:

- **Baskısız ve Gelişim Odaklı Ortam**: Başka öğrencilerle kıyaslama, sınıf sıralaması veya utandırıcı dil ("geciktin", "başarısızsın") kesinlikle bulunmaz (otomatik CI testleri ile garanti altına alınmıştır).
- **İleri Sayımlı 20 Soru Ölçüm Rutini**: Hız ve doğruluk, süresi kısıtlı ve stres yaratan geri sayım sayaçları yerine sakin bir ileri sayımlı kronometre ile ölçülür.
- **Deterministik 256 Günlük Müfredat**: 1 Ekim 2026'da başlayıp 13 Haziran 2027'de sonlanan, 6 derse yayılmış 2.947 görevi kapsayan ve son 60 günü 60 tam denemeyle taçlandıran değişmez bir çalışma programı.
- **Kusursuz 3. Ders Döngüsü**: Fen, Din, İnkılap ve İngilizce dersleri 195 konu günü boyunca sıfır rotasyon hatasıyla döner.
- **Aile İçi Güvenli Rol Matrisi**: Öğrenci cihazı şifre karmaşası olmadan 6 haneli tek kullanımlık eşleştirme koduyla anonim bağlanırken; veli paneli salt-okunur analiz ve plan yönetimini güvenle yürütür.
- **İnternetsiz Çalışma Güvencesi (Offline-First)**: İnternet kesilse bile çözülen sorular, ölçüm süreleri ve notlar yerel IndexedDB kuyruğuna kaydedilir; bağlantı sağlandığında arka planda otomatik senkronize edilir.
- **270 Günlük Özgün Motivasyon Sözü**: Hazırlık sürecindeki her bir güne özel kaleme alınmış gelişim zihniyeti aşılayan özgün ilham sözleri.

---

## 🚀 Key Features (Önemli Özellikler)

- **Mobil Odaklı Tek Temel Soru**: Öğrenci arayüzü tek bir temel soruya odaklanır: *"Bugün ne yapacağım?"*
- **İleri Sayımlı 20 Soru Ölçüm Kronometresi**:
  - Standart 20 soruluk bloklarda soru başına düşen süreyi (sn/soru) ve D/Y/B dağılımını ölçer.
  - Sayfa yenilense veya tarayıcı kapansa bile süreci kaybetmeyen dayanıklı durum yönetimi.
  - Göz yormayan, kırmızı içermeyen yumuşak cam tasarımı (glassmorphism).
- **Deterministik Müfredat ve Kilometre Taşları**:
  - **Başlangıç:** 1 Ekim 2026.
  - **Tüm Konuların Kesin Bitişi:** 13 Nisan 2027.
  - **60 Günlük Deneme Sınavı Maratonu:** 14 Nisan – 12 Haziran 2027 (60 Gün / 60 Tam LGS Denemesi).
  - **Sınav Çapa Günü:** 13 Haziran 2027.
- **Üretimde Sıfır Sahte Veri**: Tüm görevler, konular ve oynatma listeleri doğrudan doğrulanmış PostgreSQL veritabanından dinamik yüklenir.
- **Akşam Dinlenme ve Uyku Kuralı (21:50 Barajı)**:
  - 22:00 uyku kuralı.
  - Bilişsel dinlenmeyi korumak adına saat 21:50'den sonra yeni zorunlu akademik çalışma başlatılamaz.
  - Serbest kitap okuma etkinliği yalnız o günün zorunlu işleri tamamlandıktan sonra açılır.
- **Öğrenci Yanlış Soru Havuzu**:
  - Ders bazlı yanlış soru arşivleme, görsel fotoğraf yükleme ve özel çözüm notu ekleme.
  - Yapılandırılmış hata analizi (Bilgi Eksikliği, Paragraf/Okuma Hatası, İşlem Hatası, Dikkat Dağınıklığı).
- **Apple Minimalist Not Sistemi**:
  - Sade, ferah, ders rozetleriyle zenginleştirilmiş ve tek butondan filtrelenen not alma çalışma alanı.
- **Kapsamlı Veli Analiz Paneli**:
  - Müfredat tamamlanma yüzdesi.
  - Başlangıçtan günümüze net hız gelişimi (sn/soru kazanımı).
  - Ders bazlı soru dağılımı ve başarı oranları.
  - Plan değişiklikleri ve erteleme denetim izi.
- **Kullanıcı Kontrolünde Bildirim Sistemi**:
  - Varsayılan olarak kapalı, kullanıcının iznine bağlı (Günün İlhamı, Akşam Dinlenmesi, Çalışma Saati Hatırlatıcısı).
- **Kurumsal SVG İkon Standardı**:
  - Arayüzde hiçbir gayriresmi emojiye yer vermeyen modern ve erişilebilir Lucide SVG ikon seti.

---

## 🛠️ Tech Stack (Teknoloji Yığını)

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_16.3-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor_8-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)
![Zod](https://img.shields.io/badge/Zod_3.25-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

</div>

### Ön Yüz ve Kullanıcı Deneyimi
- **Next.js 16.3 (App Router & Turbopack)**: Hızlı sunucu taraflı render, optimize statik sayfalar ve dinamik rota işleyicileri.
- **React 19.3**: Eşzamanlı render kabiliyeti, modern hooklar ve reaktif istemci bileşenleri.
- **TypeScript 6.0**: Sıkı tip güvenliği, sıfır `any` prensibi ve kapsamlı alan modelleri.
- **Tailwind CSS v4**: CSS değişkenleri ve modern dark mode altyapısı ile yüksek performanslı stil yönetimi.
- **Lucide React**: Kurumsal eğitim araçlarına uygun, erişilebilir vektörel SVG ikon kütüphanesi.
- **Zod 3.25**: Çalışma zamanı veri şeması ve ortam değişkeni doğrulaması.

### Arka Yüz, Veritabanı ve Güvenlik
- **Supabase (PostgreSQL 15+)**: ACID işlem garantili, bulut tabanlı ilişkisel veritabanı.
- **Row Level Security (RLS)**: Öğrenci verilerini ve aile yetkilerini veritabanı seviyesinde izole eden güvenlik ilkeleri.
- **Anonim Cihaz Eşleme**: 6 haneli kriptografik kodlarla parolasız ve güvenli öğrenci girişi.
- **Denetim İzi (Audit Ledger)**: Görev erteleme ve plan değişikliklerinin yalnızca veli tarafından yapılabilmesini sağlayan işlem kaydı.
- **Cloudflare Turnstile**: Eşleşme ekranında sıfır etkileşimli akıllı bot koruması.

### Hibrit Mobil & PWA
- **Progressive Web App (PWA)**: W3C standartlarında `manifest.webmanifest` ve Service Worker (`sw.js`).
- **Google WebAPK**: Chrome/Edge üzerinden doğrudan telefona bağımsız uygulama olarak kurulabilme desteği.
- **Capacitor 8 Android Köprüsü**: Google Play veya doğrudan APK dağıtımına hazır yerel Android projesi (`com.lgs2027.studytracker`).

### Kalite Güvencesi ve Test Otomasyonu
- **Vitest 5.0**: Hızlı birim ve bileşen test süiti (16 test dosyası, 66 test, %100 başarı).
- **PGlite (Bellek İçi PostgreSQL)**: RLS ve tetikleyicileri bellek içi gerçek PostgreSQL motorunda sınayan testler (8 dosya, 30 test, %100 başarı).
- **Playwright 1.63**: Mobil ve masaüstü tarayıcılarda uçtan uca (E2E) kullanıcı senaryosu testleri.
- **Erişilebilirlik ve Pedagojik Dil Denetimi**: WCAG 2.2 AA standartları ve utandırıcı dil kullanımını engelleyen otomatik linterlar.

---

## 📁 Project Structure (Proje Klasör Yapısı)

```tree
LGS-App/
├── .agents/                        # Geliştirici yapay zeka ajan kuralları ve becerileri
├── android/                        # Yerel Android Studio projesi (Capacitor 8)
│   ├── app/src/main/               # Android Manifest, ikonlar ve yerel açılış ekranı
│   └── build.gradle                # Gradle derleme yapılandırması
├── data/                           # Ana kaynak belgeleri
│   ├── LGS_2027_MASTER_PLAN.xlsx   # 256 günlük kanonik çalışma planı Excel tablosu
│   └── resource_sources.json       # Onaylı konu anlatım oynatma listeleri ve MEB kaynakları
├── docs/                           # Mimari şartnameler ve değişmez kurallar
│   ├── 00_DECISIONS_AND_PRECEDENCE.md # Karar hiyerarşisi
│   ├── 05_DOMAIN_MODEL_AND_INVARIANTS.md # Değişmez ürün kuralları
│   └── DECISION_LOG.md             # Resmi karar geçmişi
├── public/                         # Statik web varlıkları
│   ├── icons/                      # PWA ikonları (192x192, 512x512, maskable)
│   ├── manifest.webmanifest        # PWA web manifest bildirimi
│   └── sw.js                       # Önbellek ve bildirim servis işçisi
├── src/                            # Uygulama kaynak kodları
│   ├── app/                        # Next.js App Router rota mimarisi
│   │   ├── (auth)/                 # Cihaz eşleme ve giriş rotaları
│   │   ├── admin/                  # Veli yönetim konsolu (Plan & Yanlışlar)
│   │   ├── analiz/                 # Veli derin analiz sayfası
│   │   ├── ayarlar/                # Veli ayarları ve bildirim yönetimi
│   │   ├── dashboard/              # Veli ana panosu
│   │   ├── kaynaklar/              # Onaylı MEB ve video kaynakları rehberi
│   │   ├── mistakes/               # Öğrenci yanlış soru havuzu
│   │   ├── notes/                  # Öğrenci minimalist not defteri
│   │   ├── plan/                   # Öğrenci çalışma takvimi ve dönem filtreleri
│   │   ├── profile/                # Öğrenci profil, bildirim ve çevrimdışı senkronizasyon ayarları
│   │   ├── progress/               # Öğrenci hız ve doğruluk gelişim grafikleri
│   │   ├── takvim/                 # Veli çalışma takvimi
│   │   ├── today/                  # Öğrenci günlük çalışma masası
│   │   ├── layout.tsx              # Kök HTML düzeni ve PWA metaverileri
│   │   └── page.tsx                # Karşılama ve giriş portalı
│   ├── components/                 # Yeniden kullanılabilir bileşen kütüphanesi
│   │   ├── layout/                 # Alt gezinme barları, üst başlıklar ve menüler
│   │   ├── student/                # BenchmarkTimer, TodayTasks, CutoffBanner, ReadingBlock
│   │   └── ui/                     # Rozetler, butonlar, modallar, giriş alanları
│   ├── domain/                     # Saf iş mantığı ve kurallar
│   │   ├── motivation-quotes.ts    # 270 adet özgün motivasyon sözü
│   │   ├── time-utils.ts           # Europe/Istanbul zaman dilimi hesaplamaları
│   │   └── xlsx-parser.ts          # Çalışma planı normalizasyon motoru
│   ├── lib/                        # Altyapı kütüphaneleri
│   │   ├── notifications.ts        # Kullanıcı kontrollü bildirim yöneticisi
│   │   ├── offline-sync.ts         # IndexedDB çevrimdışı işlem kuyruğu ve senkronizasyon
│   │   └── supabase/               # İstemci, sunucu ve yönetici Supabase örnekleri
│   └── env.ts                      # Zod ile doğrulanan ortam değişkenleri
├── supabase/                       # Supabase veritabanı katmanı
│   ├── migrations/                 # PostgreSQL şema migrasyonları (001 - 010)
│   └── seed.sql                    # Başlangıç tohum verileri
├── tests/                          # Otomatik test süitleri
│   ├── components/                 # Bileşen etkileşim testleri
│   ├── db/                         # Bellek içi PGlite RLS ve tetikleyici güvenlik testleri
│   ├── e2e/                        # Playwright uçtan uca tarayıcı testleri
│   └── unit/                       # Birim, ayrıştırma ve değişmez kural testleri
├── capacitor.config.ts             # Capacitor mobil köprü yapılandırması
├── next.config.ts                  # Next.js derleme ve güvenlik başlıkları
└── package.json                    # Bağımlılıklar ve çalıştırma komutları
```

---

## ⚙️ Kurulum ve Çalıştırma

### Gereksinimler
- **Node.js**: Sürüm 20.0.0 veya üzeri (Node 24 LTS önerilir)
- **pnpm**: Sürüm 10.0.0 veya üzeri
- **Git**: Sürüm 2.40+

### Adım Adım Kurulum

1. **Depoyu Klonlayın:**
   ```bash
   git clone https://github.com/emirtdede/lgs.app.git
   cd lgs.app
   ```

2. **Bağımlılıkları Yükleyin:**
   ```bash
   pnpm install
   ```

3. **Ortam Değişkenlerini Tanımlayın:**
   Kök dizinde `.env.local` dosyasını oluşturun:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://projeniz.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="anon-anahtariniz"
   SUPABASE_SERVICE_ROLE_KEY="service-role-anahtariniz"
   NEXT_PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA"
   TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"
   ```

4. **Kalite Kapılarını ve Testleri Çalıştırın:**
   ```bash
   # TypeScript tip denetimi (0 hata)
   pnpm typecheck

   # ESLint kod kalitesi denetimi
   pnpm lint

   # Kod biçimlendirme doğrulaması
   pnpm format:check

   # Birim ve bileşen testleri (Vitest)
   pnpm test

   # Veritabanı ve RLS güvenlik testleri (Bellek içi PostgreSQL)
   pnpm test:db

   # Uçtan uca tarayıcı testleri (Playwright)
   pnpm test:e2e
   ```

5. **Geliştirme Sunucusunu Başlatın:**
   ```bash
   pnpm dev
   ```
   Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

6. **Canlı Sürümü Derleyin:**
   ```bash
   pnpm build
   pnpm start
   ```

---

## 📱 Android APK ve Telefona Yükleme Yolları

1. **Tek Tıkla WebAPK Kurulumu (Önerilen — En Hızlı):**
   - Android telefonunuzda Chrome veya Samsung Internet ile [https://lgsapp.vercel.app](https://lgsapp.vercel.app) adresini açın.
   - **"Uygulamayı Yükle"** veya menüden **"Ana Ekrana Ekle"** butonuna dokunun.
   - Cihazınız uygulamayı tam ekran, yerel simgeli ve çevrimdışı destekli bir Android uygulaması olarak anında kurar.
2. **PWABuilder ile İmzalı `.apk` Paketi:**
   - [PWABuilder LGS App Sayfası](https://www.pwabuilder.com/reportcard?site=https://lgsapp.vercel.app) üzerinden doğrudan `.apk` dosyası üretip indirebilirsiniz.
3. **Yerel Android Studio Projesi:**
   - `android/` klasörünü Android Studio ile açın.
   - **Build ➔ Build Bundle(s) / APK(s) ➔ Build APK(s)** adımıyla dilediğiniz zaman hata ayıklama / imzalı APK derleyebilirsiniz.

---

## ⚖️ Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır. Detaylar için [`LICENSE`](./LICENSE) dosyasına göz atabilirsiniz.

**Proje Web Sitesi**: [lgsapp.vercel.app](https://lgsapp.vercel.app) &bull; **Geliştirici ve Yayıncı**: [Vellium](https://vellium.dev)
