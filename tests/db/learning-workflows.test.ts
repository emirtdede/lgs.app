import { describe, it, expect, beforeEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { createTestDatabase, createAuthUser, setAuthContext, TestUser } from "./pglite-helper";

describe("M4: Learning Workflows, Mistakes, MEB & Rescheduling RPCs", () => {
  let db: PGlite;
  let owner: TestUser;
  let studentUser: TestUser;
  let familyId: string;
  let studentId: string;
  let planId: string;
  let planDay1Id: string;
  let planDay2Id: string;

  beforeEach(async () => {
    db = await createTestDatabase();
    owner = await createAuthUser(db, "owner@family.local", false);
    studentUser = await createAuthUser(db, "student@anon.local", true);

    // 1. Create family with owner
    await setAuthContext(db, owner);
    const famRes = await db.query<{ create_family_with_owner: string }>(
      "SELECT public.create_family_with_owner('Test Learning Family');"
    );
    familyId = famRes.rows[0].create_family_with_owner;

    // 2. Create student
    await setAuthContext(db, null);
    const sRes = await db.query<{ id: string }>(
      "INSERT INTO public.students (family_id, display_name) VALUES ($1, 'Ali') RETURNING id;",
      [familyId]
    );
    studentId = sRes.rows[0].id;

    // 3. Setup active plan and plan days (Day 1 = today, Day 2 = tomorrow)
    const pRes = await db.query<{ id: string }>(
      `INSERT INTO public.study_plans (student_id, name, starts_on, status)
       VALUES ($1, 'Master Plan', CURRENT_DATE, 'active')
       RETURNING id;`,
      [studentId]
    );
    planId = pRes.rows[0].id;

    const pd1Res = await db.query<{ id: string }>(
      `INSERT INTO public.plan_days (study_plan_id, plan_date, day_number, week_number, phase)
       VALUES ($1, (now() AT TIME ZONE 'Europe/Istanbul')::date, 1, 1, 'Faz 1')
       RETURNING id;`,
      [planId]
    );
    planDay1Id = pd1Res.rows[0].id;

    const pd2Res = await db.query<{ id: string }>(
      `INSERT INTO public.plan_days (study_plan_id, plan_date, day_number, week_number, phase)
       VALUES ($1, ((now() AT TIME ZONE 'Europe/Istanbul')::date + interval '1 day')::date, 2, 1, 'Faz 1')
       RETURNING id;`,
      [planId]
    );
    planDay2Id = pd2Res.rows[0].id;
  });

  it("completes topic only when all milestone tasks are completed, and records MEB evidence", async () => {
    // 1. Create topic
    await setAuthContext(db, null);
    const topicRes = await db.query<{ id: string }>(
      `INSERT INTO public.topics (subject_id, name_tr, sort_order)
       VALUES (1, 'Çarpanlar ve Katlar', 1)
       RETURNING id;`
    );
    const topicId = topicRes.rows[0].id;

    // Create resources and resource items for topic_video and meb_questions
    const resRes = await db.query<{ id: string }>(
      `INSERT INTO public.resources (family_id, subject_id, resource_type, label)
       VALUES ($1, 1, 'youtube_playlist', 'Matematik Kaynak')
       RETURNING id;`,
      [familyId]
    );
    const resourceId = resRes.rows[0].id;

    const item1Res = await db.query<{ id: string }>(
      `INSERT INTO public.resource_items (resource_id, external_key, label, url, position)
       VALUES ($1, 'V-01', 'Video 1', 'https://youtube.com/watch?v=1', 1)
       RETURNING id;`,
      [resourceId]
    );
    const item1Id = item1Res.rows[0].id;

    const item2Res = await db.query<{ id: string }>(
      `INSERT INTO public.resource_items (resource_id, external_key, label, url, position)
       VALUES ($1, 'MEB-01', 'MEB 1', 'https://odsgm.meb.gov.tr/1', 2)
       RETURNING id;`,
      [resourceId]
    );
    const item2Id = item2Res.rows[0].id;

    const hash64A = "a".repeat(64);
    const hash64B = "b".repeat(64);

    // 2. Create 2 tasks for topic: video + MEB questions
    const task1Res = await db.query<{ id: string }>(
      `INSERT INTO public.tasks (
         plan_day_id, current_plan_day_id, external_task_id, task_group_key,
         subject_id, topic_id, task_type, title, required,
         counts_toward_topic_completion, sort_order, resource_id, resource_item_id,
         source_sheet, source_row, source_row_hash
       ) VALUES (
         $1, $1, 'MAT-01', 'grp1', 1, $2, 'topic_video', 'Çarpanlar Video', true, true, 1,
         $3, $4, 'Ekim', 2, $5
       ) RETURNING id;`,
      [planDay1Id, topicId, resourceId, item1Id, hash64A]
    );
    const task1Id = task1Res.rows[0].id;

    const task2Res = await db.query<{ id: string }>(
      `INSERT INTO public.tasks (
         plan_day_id, current_plan_day_id, external_task_id, task_group_key,
         subject_id, topic_id, task_type, title, required, planned_question_count,
         counts_toward_topic_completion, sort_order, resource_id, resource_item_id,
         source_sheet, source_row, source_row_hash
       ) VALUES (
         $1, $1, 'MEB-01', 'grp2', 1, $2, 'meb_questions', 'MEB Doğrulama Soruları', true, 12, true, 2,
         $3, $4, 'Ekim', 3, $5
       ) RETURNING id;`,
      [planDay1Id, topicId, resourceId, item2Id, hash64B]
    );
    const task2Id = task2Res.rows[0].id;

    // 3. Pair student device
    await setAuthContext(db, owner);
    const pairCodeRes = await db.query<{ code: string }>(
      "SELECT code FROM public.create_student_pairing_code($1);",
      [studentId]
    );
    const plainCode = pairCodeRes.rows[0].code;

    await setAuthContext(db, studentUser);
    await db.query("SELECT * FROM public.claim_student_pairing_code($1, 'Ali Phone');", [
      plainCode,
    ]);

    // 4. Complete task 1 (video) as student
    await db.query("SELECT * FROM public.complete_non_question_task($1);", [task1Id]);

    const comp1 = await db.query<{ status: string }>(
      "SELECT status FROM public.task_completions WHERE task_id=$1 AND student_id=$2;",
      [task1Id, studentId]
    );
    expect(comp1.rows[0].status).toBe("completed");

    // 5. Complete task 2 (MEB questions: 10 correct, 2 wrong, 0 blank)
    const mebRes = await db.query<{ result_status: string; question_session_id: string }>(
      "SELECT * FROM public.record_question_task_result($1, 10, 2, 0);",
      [task2Id]
    );
    expect(mebRes.rows[0].result_status).toBe("completed");

    // 6. Verify question session has block_kind='meb'
    const qSession = await db.query<{
      block_kind: string;
      correct_count: number;
      wrong_count: number;
    }>(
      "SELECT block_kind, correct_count, wrong_count FROM public.question_sessions WHERE task_id=$1;",
      [task2Id]
    );
    expect(qSession.rows[0].block_kind).toBe("meb");
    expect(qSession.rows[0].correct_count).toBe(10);
    expect(qSession.rows[0].wrong_count).toBe(2);

    // 7. Add mistake from MEB session
    const qSessionId = mebRes.rows[0].question_session_id;
    const mistakeRes = await db.query<{ add_mistake: string }>(
      "SELECT public.add_mistake($1::uuid, 1::smallint, $2::uuid, 'calculation_error'::public.mistake_reason, 'İşlem hatası yaptım');",
      [qSessionId, topicId]
    );
    const mistakeId = mistakeRes.rows[0].add_mistake;
    expect(mistakeId).toBeDefined();

    // 8. Verify mistake state
    const mistakeRow = await db.query<{ status: string; reason: string; note: string }>(
      "SELECT status, reason, note FROM public.mistakes WHERE id=$1;",
      [mistakeId]
    );
    expect(mistakeRow.rows[0].status).toBe("open");
    expect(mistakeRow.rows[0].reason).toBe("calculation_error");
    expect(mistakeRow.rows[0].note).toBe("İşlem hatası yaptım");

    // 9. Transition mistake status: open -> reviewed
    await db.query("SELECT public.set_mistake_review_status($1, 'reviewed');", [mistakeId]);
    const reviewedRow = await db.query<{ status: string }>(
      "SELECT status FROM public.mistakes WHERE id=$1;",
      [mistakeId]
    );
    expect(reviewedRow.rows[0].status).toBe("reviewed");

    // 10. Transition mistake status: reviewed -> resolved
    await db.query("SELECT public.set_mistake_review_status($1, 'resolved');", [mistakeId]);
    const resolvedRow = await db.query<{ status: string; resolved_at: string | null }>(
      "SELECT status, resolved_at FROM public.mistakes WHERE id=$1;",
      [mistakeId]
    );
    expect(resolvedRow.rows[0].status).toBe("resolved");
    expect(resolvedRow.rows[0].resolved_at).not.toBeNull();
  });

  it("handles audited plan task rescheduling and cancellation by adult owner/admin only", async () => {
    // 1. Create a task on Day 1
    await setAuthContext(db, null);
    const hash64 = "c".repeat(64);
    const taskRes = await db.query<{ id: string }>(
      `INSERT INTO public.tasks (
         plan_day_id, current_plan_day_id, external_task_id, task_group_key,
         subject_id, task_type, title, required, planned_question_count, sort_order, source_sheet, source_row, source_row_hash
       ) VALUES (
         $1, $1, 'TASK-OVERDUE', 'grp', 1, 'daily_math_benchmark', 'Matematik Rutin', true, 20, 1, 'Ekim', 5, $2
       ) RETURNING id;`,
      [planDay1Id, hash64]
    );
    const taskId = taskRes.rows[0].id;

    // Get Day 2 date
    const d2 = await db.query<{ plan_date: string }>(
      "SELECT plan_date::text FROM public.plan_days WHERE id=$1;",
      [planDay2Id]
    );
    const targetDate = d2.rows[0].plan_date;

    // 2. Test student device cannot reschedule
    await setAuthContext(db, owner);
    const pairCodeRes = await db.query<{ code: string }>(
      "SELECT code FROM public.create_student_pairing_code($1);",
      [studentId]
    );
    const plainCode = pairCodeRes.rows[0].code;

    await setAuthContext(db, studentUser);
    await db.query("SELECT * FROM public.claim_student_pairing_code($1, 'Phone');", [plainCode]);

    // Anonymous student tries to call reschedule_task -> MUST FAIL
    await expect(
      db.query("SELECT * FROM public.reschedule_task($1, $2::date, 'Öğrenci ertelemek istedi');", [
        taskId,
        targetDate,
      ])
    ).rejects.toThrow(/permanent adult auth required/);

    // 3. Switch back to adult owner and reschedule
    await setAuthContext(db, owner);
    const rescheduleRes = await db.query<{
      result_status: string;
      original_date: string;
      previous_date: string;
      current_date: string;
    }>("SELECT * FROM public.reschedule_task($1, $2::date, 'Veli ertelemesi: Zaman yetmedi');", [
      taskId,
      targetDate,
    ]);

    expect(rescheduleRes.rows[0].result_status).toBe("rescheduled");
    const resDate = new Date(rescheduleRes.rows[0].current_date).toISOString().slice(0, 10);
    expect(resDate).toBe(targetDate);

    // Verify task maintains original plan_day_id but has new current_plan_day_id
    const taskAfter = await db.query<{ plan_day_id: string; current_plan_day_id: string }>(
      "SELECT plan_day_id, current_plan_day_id FROM public.tasks WHERE id=$1;",
      [taskId]
    );
    expect(taskAfter.rows[0].plan_day_id).toBe(planDay1Id); // IMMUTABLE ORIGINAL!
    expect(taskAfter.rows[0].current_plan_day_id).toBe(planDay2Id); // CURRENT EFFECTIVE!

    // Verify plan_mutations audit record
    const mutation = await db.query<{ mutation_type: string; reason: string }>(
      "SELECT mutation_type, reason FROM public.plan_mutations WHERE task_id=$1;",
      [taskId]
    );
    expect(mutation.rows[0].mutation_type).toBe("reschedule");
    expect(mutation.rows[0].reason).toBe("Veli ertelemesi: Zaman yetmedi");

    // 4. Test cancel_plan_task
    const cancelRes = await db.query<{ result_status: string }>(
      "SELECT * FROM public.cancel_plan_task($1, 'Grip nedeniyle dinlenme');",
      [taskId]
    );
    expect(cancelRes.rows[0].result_status).toBe("cancelled");

    // Task cannot be rescheduled after cancellation
    await expect(
      db.query(
        "SELECT * FROM public.reschedule_task($1, ($2::date + interval '1 day')::date, 'Tekrar dene');",
        [taskId, targetDate]
      )
    ).rejects.toThrow(/cancelled task cannot be rescheduled/);
  });
});
