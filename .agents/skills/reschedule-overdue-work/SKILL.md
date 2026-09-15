---
name: reschedule-overdue-work
description: Implements overdue task handling without automatically overloading the next study day.
---

# Reschedule Overdue Work

Unfinished required work remains auditable on its original date and is never auto-copied to tomorrow. Owner/admin selects a date that exists inside the same active plan and enters a reason. Call the audited reschedule boundary so immutable `plan_day_id` remains original while `current_plan_day_id` changes. Reject completed/cancelled tasks and tasks with active timers. Re-evaluate destination-day workload and warn if unusually heavy, but never silently move additional tasks. Student cannot reschedule. Add idempotency, audit and RBAC tests.
