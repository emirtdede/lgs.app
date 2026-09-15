# 23 — Excel Master Plan Reference

File: `data/LGS_2027_MASTER_PLAN.xlsx`

The workbook is the period/schedule source and contains these major areas:

- `Gunluk_Gorevler`: task-level plan (TaskID, date, week, phase, time, subject, task type, topic, source, planned questions, timing type, required, status, note).
- `Ana_Takvim`: daily rollup from 1 Oct 2026 through the temporary 13 Jun 2027 anchor.
- `Soru_Takibi`: daily Math/Paragraph targets and actual result columns.
- `Haftalik_Degerlendirme`: weekly completion/accuracy/time review.
- `Matematik_Yol`, `Turkce_Yol`, `Fen_Yol`, `Inkilap_Yol`, `Din_Yol`, `Ingilizce_Yol`: subject roadmaps.
- `MEB_Takibi`: MEB official resource tracking.
- `Yanlis_Defteri`: wrong-answer logging.
- `Kurallar`, `Kaynaklar`, `Ayarlar`: plan rules/resources/settings.
- `Dashboard`: present but empty in the source workbook; **not imported** and not a semantic source.

## Critical interpretation

Raw workbook data is retained for traceability, but application import must apply `08_EXCEL_IMPORT_SPEC.md` normalizations. In particular:

1. 1 Oct Math daily 20 is baseline, not topic mastery.
2. Hız trend uses exact 20 even when daily total grows above 20.
3. rest/meal blocks do not count as mandatory academic task completion.
4. optional reading does not count toward required completion.
5. 108 compound `Konu Anlatımı` rows are split into video + embedded practice so 1,080 planned questions are not lost.
6. all 18 raw `Görev Türü` values use the exhaustive N-010 mapping; generic `Pekiştirme` is not assigned a guessed topic.

Do not edit Math/Turkish playlist choice during import.

## Audited workbook facts (2026-09-13)

- 17 sheets.
- `Gunluk_Gorevler`: **2,491** task rows across **256** dates (`2026-10-01` → `2027-06-13`).
- Every date has exactly one Math daily routine and one Paragraph daily routine.
- No planned time overlap was detected; no planned block ends after 22:00.
- The source workbook has **240** `Konu Anlatımı` rows but only **7 playlist-level YouTube URLs**. Therefore exact per-video URLs are deliberately a required resource-resolution gate (N-006), not inferred from the workbook.
- **108/240** teaching rows also contain non-zero planned questions (10 each), so N-009 deterministically creates a separate practice child and preserves **1,080** questions.
- The workbook contains exactly **18** raw task-type labels; N-010 maps every one and rejects unknown future labels.
- `Pekiştirme` appears 179 times with planned questions but often only the generic topic label `Günün ana konusu`; importer keeps this as mixed subject practice rather than inventing mastery attribution.
- The raw 1 Oct Math row says “learned topics” even though Math teaching starts 2 Oct; N-001 deterministically converts it to the foundation baseline.
- `MEB_Takibi` is generic weekly tracking and must pass N-007 before executable required MEB work is created.

## Raw workbook versus effective calendar

The included workbook is retained byte-for-byte as source evidence. Two verified public-holiday availability corrections (17–18 May 2027) are applied by N-011 from `data/calendar_overrides.json`, so the runtime effective schedule is not required to preserve the workbook's weekday-after-school time template on those dates. This is intentional and hash-audited.
