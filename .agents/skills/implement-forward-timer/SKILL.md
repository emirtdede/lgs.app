---
name: implement-forward-timer
description: Implements the count-up Benchmark 20 timer, refresh resilience, result validation and comparable speed metrics.
---

# Implement Forward Timer

Read timer spec first. Timer is count-up only. Starting writes server timestamp and session id. Elapsed display derives from persisted start, so refresh cannot reset it. Finishing calculates authoritative duration server-side. Benchmark result must total exactly 20. Cancelled/flagged attempts do not feed trend. Enforce one active timer per student. A daily target over 20 uses a separate extra block. Add unit, DB and Playwright refresh tests.
