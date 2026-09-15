# 10 — Timer and Benchmark 20 Specification

## Purpose

Measure natural progress without time pressure.

## Timer semantics

- count-up from 00:00:00.
- no configured goal duration.
- no countdown.
- no red time warning.
- authoritative start and finish timestamps are server-side timestamptz.
- `duration_seconds = finished_at - started_at` on trusted server/DB path.
- UI interval is presentation only; refresh/reopen recomputes from persisted `started_at`. A local non-secret `{sessionId, startedAt}` pointer may be used only for continuity; server state wins.

## Benchmark 20

For both Math and Paragraph:

- exactly 20 questions.
- one valid benchmark per plan date/routine by default.
- result sum must equal 20.
- invalid/cancelled attempt does not feed trends.
- the normal student finish is final. A different payload after successful finalization is rejected; any future correction feature must be a separate audited adult workflow and is not part of MVP.

## Daily target > 20

Example target = 35:

```text
Benchmark 20: 20 questions, timed, trend-eligible
Extra block: 15 questions, result tracked separately, not benchmark trend-eligible
```

This prevents false speed trends caused by comparing different sample sizes.

## Metrics

- duration_seconds
- seconds_per_question
- accuracy_pct
- correct/wrong/blank

Chart pairs:

- duration or seconds/question line
- accuracy line/adjacent panel

Never label faster time alone as “better”.

## Interruptions

If browser refreshes: resume from same server start.
If student intentionally cancels: session status = cancelled; keep audit row, start a new attempt.
If session remains active past a configurable sanity threshold (default 4 hours), flag for review; do not silently invent finish time.
