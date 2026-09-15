# 09 — UI/UX Specification

## Design direction

Calm, premium, highly legible, mobile-first. The system should feel like a focused personal learning tool, not an LMS admin dashboard.

Default language: Turkish.

### Visual tokens

- neutral/light default surface with optional system dark mode
- primary interaction: restrained blue
- success: green used with text/icon, never color-only
- warning/error: semantic only; timer does not use red pressure styling
- system font stack; no mandatory third-party font request
- rounded corners modest, not playful/toy-like
- motion minimal; respect `prefers-reduced-motion`

## Student information architecture

Bottom navigation on mobile:

1. Bugün
2. Plan
3. Gelişim
4. Yanlışlar
5. Profil

### Student Today

Top:

- date
- `X / Y zorunlu görev tamamlandı`
- progress bar

Sections:

- Şimdi / Sıradaki
- Günlük rutin: Paragraf + Matematik
- Konu görevleri
- Tamamlananlar collapsed
- Kitap okuma (locked until day complete)

Every task card:

- subject
- task title/topic
- source/resource
- expected question count if applicable
- primary action
- status

Do not expose admin IDs, raw plan data or analytics noise.

### Timer screen

- large elapsed `HH:MM:SS`
- label `İleri Sayım`
- no target time, no countdown ring
- pause is not allowed for benchmark by default; if interrupted, allow Cancel and restart to preserve measurement integrity
- Finish opens result form

Result form validates sum. Display neutral feedback: “Kayıt tamamlandı.”

### Progress

Charts:

- Benchmark 20 duration trend
- accuracy trend
- seconds/question trend
- daily/weekly question counts
- topic completion

Always explain that lower time is meaningful only when accuracy is maintained/improves.

## Adult UI

Desktop sidebar; responsive mobile nav.
Dashboard cards:

- today completion
- overdue tasks
- 7/30-day consistency
- question volume
- benchmark speed + accuracy
- topics complete/in progress

Admin plan screens support explicit reschedule and audit history.

## Copy rules

Avoid:

- “Geç kaldın”
- “Serin bozuldu”
- “Başarısız”
- “Hedef süreni aşmışsın”

Prefer:

- “Bugünden kalan 1 görev var.”
- “Bu görevi yeniden planlayabilirsiniz.”
- “20 soruluk ölçüm tamamlandı.”
- “Son 30 gündeki kendi gelişimin.”
