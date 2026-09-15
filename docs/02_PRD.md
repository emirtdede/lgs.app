# 02 — Product Requirements Document

## Personas

### Student

Uses a phone. Needs one clear daily plan, large controls, timer, question result entry and visible personal progress.

### Owner

Creates family space, imports master plan, controls rescheduling/resources/roles/devices and can see all analytics.

### Admin

Same operational abilities as owner except ownership transfer/destructive workspace deletion.

### Viewer

Family member with read-only access to student plan/progress.

## Core journeys

### J1 — Student starts day

1. Opens app.
2. Sees date, required progress and ordered tasks.
3. Starts first actionable task.
4. Completes tasks in configured order; locked tasks explain prerequisite.
5. Once all required tasks complete, reading becomes available.

### J2 — Benchmark 20

1. Student opens Paragraph or Math daily routine.
2. App presents `Benchmark 20` as the first required block.
3. Student taps Start; count-up timer starts.
4. Timer state persists through refresh/reopen.
5. Student taps Finish.
6. Inputs correct/wrong/blank; sum must equal 20.
7. Session is immutable except correction through an audited edit path.
8. If daily target >20, extra block is shown separately.

### J3 — Topic task

Video/note/practice/MEB/question tasks map to a topic. Required components determine completion. Video alone cannot finish a topic.

### J4 — Missed task

At day end unfinished required tasks become overdue. They remain on original date. Owner/admin can reschedule each task with reason; both original and new dates are retained in audit.

### J5 — Family review

Adult dashboard shows completion, question volume, benchmark speed + accuracy, topics, weak areas, overdue work and recent plan changes.

## Functional requirements summary

- FR-001 family workspace and roles
- FR-002 anonymous student device pairing/revocation
- FR-003 Excel plan import with dry-run
- FR-004 Today task list
- FR-005 task-specific completion forms
- FR-006 forward timer sessions
- FR-007 exact-20 benchmark metrics
- FR-008 extra-question tracking
- FR-009 topic progression/mastery state
- FR-010 MEB validation tracking
- FR-011 wrong-answer log and review
- FR-012 overdue/rescheduling
- FR-013 optional reading
- FR-014 adult analytics
- FR-015 plan/resource admin
- FR-016 audit log
- FR-017 PWA installability
- FR-018 accessible responsive UI
- FR-019 backups/export

## KPIs

Product analytics are private and local to the family. No third-party behavioral analytics SDK is required.

- required-task completion rate
- active study days / available days
- benchmark accuracy trend
- benchmark seconds/question trend
- total questions by subject
- topic completion
- wrong-answer reason distribution
- overdue task count and age

Never surface cross-student comparisons.
