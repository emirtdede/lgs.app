/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createTestDatabase, createAuthUser, setAuthContext, type TestUser } from "./pglite-helper";

describe("M3: Student Core Actions & Benchmark 20 Integration", () => {
  let db: PGlite;
  let owner: TestUser;
  let studentUser: TestUser;
  let familyId: string;
  let studentId: string;
  let planId: string;
  let planDayId: string;
  let mathTaskId: string;
  let readingTaskId: string;

  beforeEach(async () => {
    db = await createTestDatabase();
    owner = await createAuthUser(db, "owner@family.local", false);
    studentUser = await createAuthUser(db, "student@anon.local", true);

    // 1. Create family as owner
    await setAuthContext(db, owner);
    const famRes = await db.query<{ create_family_with_owner: string }>(
      "SELECT public.create_family_with_owner('Test Family');"
    );
    familyId = famRes.rows[0].create_family_with_owner;

    // 2. Create student & pair device (admin/service context)
    await setAuthContext(db, null);
    const sRes = await db.query<{ id: string }>(
      "INSERT INTO public.students (family_id, display_name) VALUES ($1, 'Ali') RETURNING id;",
      [familyId]
    );
    studentId = sRes.rows[0].id;

    await db.query(
      "INSERT INTO public.student_devices (student_id, auth_user_id, status) VALUES ($1, $2, 'active');",
      [studentId, studentUser.id]
    );

    // 3. Setup study plan and plan_day for today (in Europe/Istanbul)
    const pRes = await db.query<{ id: string }>(
      `INSERT INTO public.study_plans (student_id, name, starts_on, status)
       VALUES ($1, 'LGS 2027 Plani', CURRENT_DATE, 'active')
       RETURNING id;`,
      [studentId]
    );
    planId = pRes.rows[0].id;

    const pdRes = await db.query<{ id: string }>(
      `INSERT INTO public.plan_days (study_plan_id, plan_date, day_number, week_number, phase)
       VALUES ($1, (now() AT TIME ZONE 'Europe/Istanbul')::date, 1, 1, 'Faz 1')
       RETURNING id;`,
      [planId]
    );
    planDayId = pdRes.rows[0].id;

    // 4. Insert required Math Benchmark task
    const tRes = await db.query<{ id: string }>(
      `INSERT INTO public.tasks (
         plan_day_id, current_plan_day_id, external_task_id, task_group_key,
         task_type, required, title, planned_question_count, sort_order,
         source_sheet, source_row, source_row_hash
       ) VALUES (
         $1, $1, 'TASK_MATH_001', 'TASK_MATH_001',
         'daily_math_benchmark', true, 'Matematik 20 Soru', 20, 1,
         'Gunluk_Gorevler', 2, repeat('a', 64)
       ) RETURNING id;`,
      [planDayId]
    );
    mathTaskId = tRes.rows[0].id;

    // 5. Insert optional reading task
    const rRes = await db.query<{ id: string }>(
      `INSERT INTO public.tasks (
         plan_day_id, current_plan_day_id, external_task_id, task_group_key,
         task_type, required, title, sort_order,
         source_sheet, source_row, source_row_hash
       ) VALUES (
         $1, $1, 'TASK_READ_001', 'TASK_READ_001',
         'reading', false, 'Kitap Okuma', 2,
         'Gunluk_Gorevler', 3, repeat('b', 64)
       ) RETURNING id;`,
      [planDayId]
    );
    readingTaskId = rRes.rows[0].id;

    // Switch context to paired student device
    await setAuthContext(db, studentUser);
  });

  it("starts benchmark timer and resumes idempotently on refresh", async () => {
    // Start timer
    const start1 = await db.query<{ session_id: string; started_at: string }>(
      "SELECT session_id, started_at FROM public.start_task_timer($1);",
      [mathTaskId]
    );
    expect(start1.rows.length).toBe(1);
    const sessionId = start1.rows[0].session_id;
    const startedAt = start1.rows[0].started_at;

    // Simulate page refresh: calling start_task_timer on same active task returns existing session
    const startRefresh = await db.query<{ session_id: string; started_at: string }>(
      "SELECT session_id, started_at FROM public.start_task_timer($1);",
      [mathTaskId]
    );
    expect(startRefresh.rows[0].session_id).toBe(sessionId);
    expect(new Date(startRefresh.rows[0].started_at).getTime()).toBe(new Date(startedAt).getTime());
  });

  it("rejects benchmark finalization if sum is not 20", async () => {
    const start = await db.query<{ session_id: string }>(
      "SELECT session_id FROM public.start_task_timer($1);",
      [mathTaskId]
    );
    const sessionId = start.rows[0].session_id;

    // Sum is 19
    await expect(
      db.query("SELECT * FROM public.finish_benchmark_20($1, 18, 1, 0);", [sessionId])
    ).rejects.toThrow(/must total exactly 20/);

    // Sum is 21
    await expect(
      db.query("SELECT * FROM public.finish_benchmark_20($1, 18, 2, 1);", [sessionId])
    ).rejects.toThrow(/must total exactly 20/);
  });

  it("completes benchmark when sum is exactly 20 and unlocks reading", async () => {
    const start = await db.query<{ session_id: string }>(
      "SELECT session_id FROM public.start_task_timer($1);",
      [mathTaskId]
    );
    const sessionId = start.rows[0].session_id;

    // Attempt to start reading while math is incomplete -> must be rejected
    await expect(db.query("SELECT * FROM public.start_reading_session('Nutuk');")).rejects.toThrow(
      /reading is locked/
    );

    // Finish benchmark with 18 correct, 2 wrong, 0 blank
    const finishRes = await db.query<{ result_status: string; duration_seconds: number }>(
      "SELECT result_status, duration_seconds FROM public.finish_benchmark_20($1, 18, 2, 0);",
      [sessionId]
    );
    expect(finishRes.rows[0].result_status).toBe("completed");

    // Verify task completion
    const compRes = await db.query<{ status: string }>(
      "SELECT status FROM public.task_completions WHERE task_id = $1;",
      [mathTaskId]
    );
    expect(compRes.rows[0].status).toBe("completed");

    // Now all required tasks are completed -> reading unlocks!
    const readingStart = await db.query<{ session_id: string }>(
      "SELECT session_id FROM public.start_reading_session('Nutuk');"
    );
    expect(readingStart.rows[0].session_id).toBeDefined();

    // Finish reading session
    const readFinish = await db.query<{ session_id: string; duration_seconds: number }>(
      "SELECT session_id, duration_seconds FROM public.finish_reading_session($1, 25);",
      [readingStart.rows[0].session_id]
    );
    expect(readFinish.rows[0].session_id).toBe(readingStart.rows[0].session_id);
    expect(readFinish.rows[0].duration_seconds).toBeGreaterThanOrEqual(0);
  });

  it("cancels benchmark cleanly allowing a fresh attempt", async () => {
    const start1 = await db.query<{ session_id: string }>(
      "SELECT session_id FROM public.start_task_timer($1);",
      [mathTaskId]
    );
    const sess1 = start1.rows[0].session_id;

    // Cancel timer
    await db.query("SELECT public.cancel_task_timer($1);", [sess1]);

    // Verify status is cancelled
    const timerRes = await db.query<{ status: string }>(
      "SELECT status FROM public.timer_sessions WHERE id = $1;",
      [sess1]
    );
    expect(timerRes.rows[0].status).toBe("cancelled");

    // Can start a fresh attempt on the task
    const start2 = await db.query<{ session_id: string }>(
      "SELECT session_id FROM public.start_task_timer($1);",
      [mathTaskId]
    );
    expect(start2.rows[0].session_id).not.toBe(sess1);
  });
});
