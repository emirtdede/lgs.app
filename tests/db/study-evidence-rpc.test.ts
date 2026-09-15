import { describe, it, expect, beforeEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { createTestDatabase, createAuthUser, setAuthContext, TestUser } from "./pglite-helper";

describe("M1: Pairing & Study Evidence RPCs", () => {
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

    // Create family as owner
    await setAuthContext(db, owner);
    const famRes = await db.query<{ create_family_with_owner: string }>(
      "SELECT public.create_family_with_owner('Caliskan Ailesi');"
    );
    familyId = famRes.rows[0].create_family_with_owner;

    // Create student
    await setAuthContext(db, null);
    const sRes = await db.query<{ id: string }>(
      "INSERT INTO public.students (family_id, display_name) VALUES ($1, 'Ali') RETURNING id;",
      [familyId]
    );
    studentId = sRes.rows[0].id;

    // Setup active plan and plan_day for today
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

    // Insert required math benchmark task
    const tRes = await db.query<{ id: string }>(
      `INSERT INTO public.tasks (
         plan_day_id, current_plan_day_id, external_task_id, task_group_key,
         task_type, required, title, planned_question_count, sort_order,
         source_sheet, source_row, source_row_hash
       ) VALUES (
         $1, $1, 'TASK_MATH_001', 'TASK_MATH_001',
         'daily_math_benchmark', true, 'Günlük Matematik 20 Soru', 20, 1,
         'Gunluk_Gorevler', 2, '0000000000000000000000000000000000000000000000000000000000000001'
       ) RETURNING id;`,
      [planDayId]
    );
    mathTaskId = tRes.rows[0].id;

    // Insert optional reading task
    const rRes = await db.query<{ id: string }>(
      `INSERT INTO public.tasks (
         plan_day_id, current_plan_day_id, external_task_id, task_group_key,
         task_type, required, title, sort_order,
         source_sheet, source_row, source_row_hash
       ) VALUES (
         $1, $1, 'TASK_READ_001', 'TASK_READ_001',
         'reading', false, 'Kitap Okuma', 99,
         'Gunluk_Gorevler', 3, '0000000000000000000000000000000000000000000000000000000000000002'
       ) RETURNING id;`,
      [planDayId]
    );
    readingTaskId = rRes.rows[0].id;
  });

  it("handles pairing code generation and claiming atomically", async () => {
    // 1. Owner generates pairing code
    await setAuthContext(db, owner);
    const codeRes = await db.query<{ code: string; expires_at: string }>(
      "SELECT * FROM public.create_student_pairing_code($1);",
      [studentId]
    );
    const pairingCode = codeRes.rows[0].code;
    expect(pairingCode).toMatch(/^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/);

    // 2. Anonymous student claims pairing code
    await setAuthContext(db, studentUser);
    const claimRes = await db.query<{ result_status: string; student_id: string }>(
      "SELECT * FROM public.claim_student_pairing_code($1, 'Ali Tablet');",
      [pairingCode]
    );
    expect(claimRes.rows[0].result_status).toBe("paired");
    expect(claimRes.rows[0].student_id).toBe(studentId);

    // 3. Second claim of same code is rejected
    const secondUser = await createAuthUser(db, "other@anon.local", true);
    await setAuthContext(db, secondUser);
    const secondClaim = await db.query<{ result_status: string }>(
      "SELECT * FROM public.claim_student_pairing_code($1);",
      [pairingCode]
    );
    expect(secondClaim.rows[0].result_status).toBe("invalid_or_expired");
  });

  it("starts benchmark timer with refresh resilience", async () => {
    // Pair studentUser
    await setAuthContext(db, null);
    await db.query(
      "INSERT INTO public.student_devices (student_id, auth_user_id, status) VALUES ($1, $2, 'active');",
      [studentId, studentUser.id]
    );

    await setAuthContext(db, studentUser);

    // Temporarily bypass or test 21:50 guard if local time is before 21:50
    const nowLocalTime = await db.query<{ is_allowed: boolean }>(
      "SELECT (now() AT TIME ZONE 'Europe/Istanbul')::time <= time '21:50' as is_allowed;"
    );

    if (nowLocalTime.rows[0].is_allowed) {
      // 1. Start timer
      const timerRes = await db.query<{ session_id: string; started_at: string }>(
        "SELECT * FROM public.start_task_timer($1);",
        [mathTaskId]
      );
      const sessionId = timerRes.rows[0].session_id;
      expect(sessionId).toBeDefined();

      // 2. Refresh resilience: calling start_task_timer again returns same session
      const refreshRes = await db.query<{ session_id: string; started_at: string }>(
        "SELECT * FROM public.start_task_timer($1);",
        [mathTaskId]
      );
      expect(refreshRes.rows[0].session_id).toBe(sessionId);

      // 3. Submitting invalid question counts (!= 20) throws error
      await expect(
        db.query("SELECT * FROM public.finish_benchmark_20($1, 15, 2, 0);", [sessionId])
      ).rejects.toThrow(/benchmark result must total exactly 20/);

      // 4. Submitting valid question counts (18 + 1 + 1 = 20) finishes session
      const finishRes = await db.query<{ result_status: string; duration_seconds: number }>(
        "SELECT * FROM public.finish_benchmark_20($1, 18, 1, 1);",
        [sessionId]
      );
      expect(finishRes.rows[0].result_status).toBe("completed");

      // 5. Retrying same finish is idempotent
      const retryRes = await db.query<{ result_status: string }>(
        "SELECT * FROM public.finish_benchmark_20($1, 18, 1, 1);",
        [sessionId]
      );
      expect(retryRes.rows[0].result_status).toBe("already_completed");
    }
  });

  it("locks reading until all required academic tasks are completed or cancelled", async () => {
    // Pair studentUser
    await setAuthContext(db, null);
    await db.query(
      "INSERT INTO public.student_devices (student_id, auth_user_id, status) VALUES ($1, $2, 'active');",
      [studentId, studentUser.id]
    );

    await setAuthContext(db, studentUser);

    // Reading should be locked because mathTaskId is not completed
    await expect(db.query("SELECT * FROM public.start_reading_session('Nutuk');")).rejects.toThrow(
      /reading is locked until required tasks are resolved/
    );

    // Mark mathTaskId as completed
    await setAuthContext(db, null);
    await db.query(
      `INSERT INTO public.task_completions (task_id, student_id, status, completed_at)
       VALUES ($1, $2, 'completed', now());`,
      [mathTaskId, studentId]
    );

    // Check 21:50 guard
    const nowLocalTime = await db.query<{ is_allowed: boolean }>(
      "SELECT (now() AT TIME ZONE 'Europe/Istanbul')::time <= time '21:50' as is_allowed;"
    );

    if (nowLocalTime.rows[0].is_allowed) {
      // Reading should now unlock and start successfully
      await setAuthContext(db, studentUser);
      const readRes = await db.query<{ session_id: string }>(
        "SELECT * FROM public.start_reading_session('Nutuk');"
      );
      expect(readRes.rows[0].session_id).toBeDefined();
    }
  });
});
