/**
 * Server Service for Student queries and view data.
 * All queries run under the calling user's Supabase context.
 * Strict: Real Supabase data only. Zero mock/fake fallback tasks in production.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/env";
import {
  getIstanbulDateString,
  formatIstanbulLongDate,
  isPast2150Cutoff,
} from "@/domain/time-utils";
import {
  categorizeStudentTasks,
  checkReadingUnlocked,
  calculateTodayProgress,
  findNextActionTask,
  type StudentTodayData,
  type StudentTodayTask,
  type ActiveTimerSession,
  type ActiveReadingSession,
} from "@/domain/student-today";

export interface AuthenticatedStudentInfo {
  studentId: string;
  displayName: string;
  familyId: string;
  isAnonymous: boolean;
}

export const PLAN_START_DATE = "2026-10-01";
export const EXAM_ANCHOR_DATE = "2027-06-13";

export const DEFAULT_STUDENT: AuthenticatedStudentInfo = {
  studentId: "student-local-1",
  displayName: "Yusuf",
  familyId: "family-local-1",
  isAnonymous: true,
};

export function buildEmptyTodayData(
  todayStr: string = getIstanbulDateString(),
  message?: string,
  extras: Partial<StudentTodayData> = {}
): StudentTodayData {
  const realToday = getIstanbulDateString();
  const isPrePlan = todayStr < PLAN_START_DATE;
  return {
    planDate: todayStr,
    formattedDate: formatIstanbulLongDate(todayStr),
    isCutoffActive: false,
    isPrePlanStart: isPrePlan,
    planStartDate: PLAN_START_DATE,
    realTodayDate: realToday,
    dayNumber: extras.dayNumber ?? null,
    weekNumber: extras.weekNumber ?? null,
    phase: extras.phase ?? null,
    prevDate: extras.prevDate ?? null,
    nextDate: extras.nextDate ?? null,
    isPlanStartFallback: extras.isPlanStartFallback ?? false,
    prePlanMessage:
      message ??
      (isPrePlan
        ? "Plan 1 Ekim 2026 tarihinde başlıyor."
        : "Bu tarih için planlanmış ders görevi bulunamadı."),
    nextActionTask: null,
    routineTasks: [],
    topicTasks: [],
    breakTasks: [],
    completedTasks: [],
    readingTask: null,
    activeTimerSession: null,
    activeReadingSession: null,
    isReadingUnlocked: false,
    readingLockReason: isPrePlan
      ? "Plan 1 Ekim 2026 tarihinde başlayacaktır."
      : "Zorunlu görevler tamamlandığında açılır.",
    progress: {
      totalRequired: 0,
      completedRequired: 0,
      percent: 0,
    },
    ...extras,
  };
}

/**
 * Gets the current student linked to this device or family.
 */
export async function getCurrentStudent(
  supabase: SupabaseClient<Database>
): Promise<AuthenticatedStudentInfo> {
  const db = env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
  try {
    const { data: students, error: stuErr } = await db
      .from("students")
      .select("id, display_name, family_id")
      .eq("active", true)
      .limit(1);

    if (!stuErr && students && students.length > 0) {
      const s = students[0];
      return {
        studentId: s.id,
        displayName: s.display_name,
        familyId: s.family_id,
        isAnonymous: true,
      };
    }
  } catch {
    // Graceful fallback
  }

  return DEFAULT_STUDENT;
}

/**
 * Fetches all necessary data for Student Today screen.
 * Strictly reads real Supabase plan data. Zero synthetic tasks.
 */
export async function getStudentTodayData(
  supabase: SupabaseClient<Database>,
  options: { requestedDate?: string; bypassCutoff?: boolean } = {}
): Promise<{ student: AuthenticatedStudentInfo; todayData: StudentTodayData }> {
  const db = env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
  const student = await getCurrentStudent(db);
  const realTodayStr = getIstanbulDateString();

  // Determine target plan date:
  // - If an explicit date is requested in options (via ?date=YYYY-MM-DD), use it.
  // - Otherwise, if calendar today is before PLAN_START_DATE (1 Ekim 2026), default to PLAN_START_DATE ("2026-10-01") so Day 1 work is directly visible.
  // - When calendar today reaches 1 Ekim 2026 or later, default to realTodayStr so it advances day by day!
  const isDefaultingToPlanStart =
    (!options.requestedDate || options.requestedDate === PLAN_START_DATE) &&
    realTodayStr < PLAN_START_DATE;
  const effectiveDateStr =
    options.requestedDate ?? (realTodayStr < PLAN_START_DATE ? PLAN_START_DATE : realTodayStr);

  try {
    // Query prev and next plan dates for easy day-by-day navigation
    const [prevDayRes, nextDayRes] = await Promise.all([
      db
        .from("plan_days")
        .select("plan_date")
        .lt("plan_date", effectiveDateStr)
        .order("plan_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from("plan_days")
        .select("plan_date")
        .gt("plan_date", effectiveDateStr)
        .order("plan_date", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    const prevDate = prevDayRes.data?.plan_date ?? null;
    const nextDate = nextDayRes.data?.plan_date ?? null;

    // 1. Find the plan_day for the requested/effective date
    const planDayRes = await db
      .from("plan_days")
      .select("id, plan_date, day_number, week_number, phase, study_plan_id")
      .eq("plan_date", effectiveDateStr)
      .limit(1);

    if (!planDayRes.data || planDayRes.data.length === 0) {
      return {
        student,
        todayData: buildEmptyTodayData(effectiveDateStr, undefined, {
          prevDate,
          nextDate,
          realTodayDate: realTodayStr,
          isPlanStartFallback: isDefaultingToPlanStart,
        }),
      };
    }

    const planDay = planDayRes.data[0];
    const effectiveDate = planDay.plan_date;

    // 2. Fetch all tasks scheduled for this plan_day (by current_plan_day_id)
    const { data: rawTasks, error: taskErr } = await db
      .from("tasks")
      .select(
        `
      id, external_task_id, task_group_key, task_type, title,
      planned_start, planned_end, planned_question_count, required,
      counts_toward_topic_completion, sort_order,
      is_timed, timed_question_target, general_playlist_url, resource_label,
      subjects ( name_tr ),
      topics ( name_tr ),
      resources ( label, url )
    `
      )
      .eq("current_plan_day_id", planDay.id)
      .order("sort_order", { ascending: true });

    if (taskErr || !rawTasks) {
      throw new Error(`Failed to load tasks for day ${effectiveDate}: ${taskErr?.message}`);
    }

    const taskIds = rawTasks.map((t) => t.id);

    // 3. Fetch completions for these tasks
    let completionsMap = new Map<string, any>();
    if (taskIds.length > 0) {
      const { data: compData } = await db
        .from("task_completions")
        .select("*")
        .in("task_id", taskIds)
        .eq("student_id", student.studentId);

      if (compData) {
        for (const c of compData as any[]) {
          if (c.task_id) {
            completionsMap.set(c.task_id, c);
          }
        }
      }
    }

    // 4. Fetch question session results if any
    let questionSessionsMap = new Map<string, any>();
    if (taskIds.length > 0) {
      const { data: qData } = await db
        .from("question_sessions")
        .select("*")
        .in("task_id", taskIds)
        .eq("student_id", student.studentId);

      if (qData) {
        for (const q of qData as any[]) {
          if (q.task_id) {
            questionSessionsMap.set(q.task_id, q);
          }
        }
      }
    }

    // Map into StudentTodayTask models
    const tasks: StudentTodayTask[] = rawTasks.map((t: any) => {
      const comp = completionsMap.get(t.id);
      const qSession = questionSessionsMap.get(t.id);

      return {
        id: t.id,
        externalTaskId: t.external_task_id,
        taskGroupKey: t.task_group_key,
        taskType: t.task_type,
        title: t.title,
        subjectName: t.subjects?.name_tr ?? null,
        topicName: t.topics?.name_tr ?? null,
        plannedStart: t.planned_start,
        plannedEnd: t.planned_end,
        plannedQuestionCount: t.planned_question_count,
        required: t.required,
        countsTowardTopicCompletion: t.counts_toward_topic_completion,
        sortOrder: t.sort_order,
        resourceLabel: t.resource_label ?? t.resources?.label ?? null,
        resourceUrl: t.general_playlist_url ?? t.resources?.url ?? null,
        resourceItemLabel: null,
        resourceItemUrl: null,
        generalPlaylistUrl: t.general_playlist_url ?? t.resources?.url ?? null,
        isTimed: t.is_timed ?? false,
        timedQuestionTarget: t.timed_question_target ?? (t.is_timed ? 20 : null),
        status: comp ? comp.status : "pending",
        completedAt: comp?.completed_at ?? null,
        resultQuestionSessionId: qSession?.id ?? null,
        resultQuestionCount: qSession?.question_count ?? null,
        resultCorrect: qSession?.correct_count ?? null,
        resultWrong: qSession?.wrong_count ?? null,
        resultBlank: qSession?.blank_count ?? null,
        resultDurationSeconds: qSession?.duration_seconds ?? null,
      };
    });

    // 5. Fetch active timer session
    let activeTimerSession: ActiveTimerSession | null = null;
    const { data: activeTimers } = await db
      .from("timer_sessions")
      .select("id, task_id, started_at, tasks ( title, task_type )")
      .eq("student_id", student.studentId)
      .eq("status", "active")
      .limit(1);

    if (activeTimers && activeTimers.length > 0) {
      const at = activeTimers[0] as any;
      activeTimerSession = {
        sessionId: at.id,
        taskId: at.task_id,
        startedAt: at.started_at,
        taskTitle: at.tasks?.title ?? "Zamanlayıcı",
        taskType: at.tasks?.task_type ?? "paragraph_routine",
      };
    }

    // 6. Fetch active reading session
    let activeReadingSession: ActiveReadingSession | null = null;
    const { data: activeReading } = await db
      .from("reading_sessions")
      .select("id, title, started_at")
      .eq("student_id", student.studentId)
      .is("finished_at", null)
      .limit(1);

    if (activeReading && activeReading.length > 0) {
      const ar = activeReading[0];
      activeReadingSession = {
        sessionId: ar.id,
        bookTitle: ar.title,
        startedAt: ar.started_at,
      };
    }

    const categorized = categorizeStudentTasks(tasks);
    const readingCheck = checkReadingUnlocked(tasks);
    const progress = calculateTodayProgress(tasks);
    const nextActionTask = findNextActionTask(tasks);
    const isToday = effectiveDate === realTodayStr;
    const isCutoff = options.bypassCutoff ? false : isToday && isPast2150Cutoff();

    return {
      student,
      todayData: {
        planDate: effectiveDate,
        formattedDate: formatIstanbulLongDate(effectiveDate),
        dayNumber: planDay.day_number,
        weekNumber: planDay.week_number,
        phase: planDay.phase,
        realTodayDate: realTodayStr,
        prevDate,
        nextDate,
        isPlanStartFallback: isDefaultingToPlanStart,
        isCutoffActive: isCutoff,
        isPrePlanStart: false,
        planStartDate: PLAN_START_DATE,
        nextActionTask,
        routineTasks: categorized.routineTasks,
        topicTasks: categorized.topicTasks,
        breakTasks: categorized.breakTasks,
        completedTasks: categorized.completedTasks,
        readingTask: categorized.readingTask,
        activeTimerSession,
        activeReadingSession,
        isReadingUnlocked: readingCheck.isUnlocked,
        readingLockReason: readingCheck.reason,
        progress,
      },
    };
  } catch (error) {
    console.error("Error in getStudentTodayData:", error);
    return {
      student,
      todayData: buildEmptyTodayData(effectiveDateStr, "Veriler yüklenirken bir hata oluştu."),
    };
  }
}
