import { SupabaseClient } from "@supabase/supabase-js";
import { Database, FamilyRole } from "@/lib/supabase/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/env";
import { getTodayDateIstanbul } from "@/domain/time-utils";
import {
  calculateDayAnalytics,
  calculateConsistencyMetrics,
  calculateBenchmarkMetrics,
  type RawDayTask,
  type DayAnalyticsSummary,
} from "@/domain/analytics";

export interface AdultUserContext {
  authUserId: string;
  email: string;
  familyId: string;
  familyName: string;
  role: FamilyRole;
}

export interface AdultDashboardData {
  family: {
    id: string;
    name: string;
    role: FamilyRole;
  };
  students: {
    id: string;
    displayName: string;
  }[];
  todayMetrics: {
    planDate: string;
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
    overdueTasksCount: number;
  };
  consistency30d: number;
  totalQuestionsSolved: number;
  benchmarkAverages: {
    mathAvgSeconds: number | null;
    mathAvgAccuracy: number | null;
    paragraphAvgSeconds: number | null;
    paragraphAvgAccuracy: number | null;
  };
  overdueTasks: {
    id: string;
    title: string;
    taskType: string;
    originalDate: string;
    currentDate: string;
    subjectName: string | null;
  }[];
  mistakeBreakdown: {
    reason: string;
    count: number;
    openCount: number;
  }[];
  recentMutations: {
    id: string;
    mutationType: string;
    fromDate: string | null;
    toDate: string | null;
    reason: string;
    createdAt: string;
  }[];
  studentNotes: {
    id: string;
    category: string;
    title: string;
    content: string;
    targetDate: string | null;
    isResolved: boolean;
    createdAt: string;
  }[];
}

export const DEFAULT_ADULT: AdultUserContext = {
  authUserId: "adult-local-1",
  email: "aile@lgs2027.local",
  familyId: "family-local-1",
  familyName: "LGS 2027 Ailesi",
  role: "viewer", // Strictly viewer mode as requested: "aile girişi sadece görüntüler"
};

export function buildDefaultAdultDashboardData(
  familyId: string = "family-local-1",
  role: FamilyRole = "viewer"
): AdultDashboardData {
  const todayDate = getTodayDateIstanbul();

  return {
    family: {
      id: familyId,
      name: "LGS 2027 Ailesi",
      role,
    },
    students: [
      {
        id: "student-local-1",
        displayName: "Yusuf",
      },
    ],
    todayMetrics: {
      planDate: todayDate,
      totalTasks: 0,
      completedTasks: 0,
      completionPercentage: 0,
      overdueTasksCount: 0,
    },
    consistency30d: 0,
    totalQuestionsSolved: 0,
    benchmarkAverages: {
      mathAvgSeconds: null,
      mathAvgAccuracy: null,
      paragraphAvgSeconds: null,
      paragraphAvgAccuracy: null,
    },
    overdueTasks: [],
    mistakeBreakdown: [],
    recentMutations: [],
    studentNotes: [],
  };
}

/**
 * Loads current adult user session (or default viewer session in direct-access mode).
 */
export async function getCurrentAdultMember(
  supabase: SupabaseClient<Database>
): Promise<AdultUserContext> {
  const db = env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && !user.is_anonymous) {
      const { data: memberData } = await db
        .from("family_members")
        .select("family_id, role, families(name)")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (memberData) {
        return {
          authUserId: user.id,
          email: user.email || "",
          familyId: memberData.family_id,
          familyName: (memberData.families as any)?.name || "Aile",
          role: "viewer", // Enforce read-only viewer mode for family access
        };
      }
    }

    // Direct-access fallback: find the primary family
    const { data: famData } = await db.from("families").select("id, name").limit(1);
    if (famData && famData.length > 0) {
      return {
        authUserId: "adult-local-1",
        email: "aile@lgs2027.local",
        familyId: famData[0].id,
        familyName: famData[0].name,
        role: "viewer",
      };
    }
  } catch {
    // Graceful fallback to default viewer
  }

  return DEFAULT_ADULT;
}

/**
 * Gathers complete dashboard analytics for the adult view.
 */
export async function getAdultDashboardData(
  supabase: SupabaseClient<Database>,
  familyId: string,
  role: FamilyRole = "viewer"
): Promise<AdultDashboardData> {
  const db = env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
  const todayDate = getTodayDateIstanbul();

  try {
    // 1. Fetch students for family
    const { data: studentsData } = await db
      .from("students")
      .select("id, display_name")
      .eq("family_id", familyId)
      .eq("active", true);

    const students = (studentsData || []).map((s: any) => ({
      id: s.id,
      displayName: s.display_name,
    }));

    if (students.length === 0) {
      return buildDefaultAdultDashboardData(familyId, role);
    }

    const studentIds = students.map((s) => s.id);

    // 2. Fetch all plan tasks effective around today or past 30 days
    const { data: rawTasksData } = await db
      .from("tasks")
      .select(
        `id, plan_day_id, current_plan_day_id, task_type, title, required,
       subjects(name_tr),
       plan_days!tasks_plan_day_id_fkey(plan_date),
       effective_day:plan_days!tasks_current_plan_day_id_fkey(plan_date),
       task_completions(status)`
      )
      .order("sort_order", { ascending: true });

    const allRawTasks: RawDayTask[] = [];
    const overdueTasksList: AdultDashboardData["overdueTasks"] = [];

    for (const t of (rawTasksData as any[]) || []) {
      const originalDate = t.plan_days?.plan_date ?? "";
      const effectiveDate = t.effective_day?.plan_date ?? originalDate;
      const status = t.task_completions?.[0]?.status ?? "pending";

      allRawTasks.push({
        id: t.id,
        effectivePlanDate: effectiveDate,
        taskType: t.task_type,
        required: t.required,
        status,
      });

      // Detect overdue tasks: non-completed, non-cancelled, effectiveDate < todayDate
      if (
        t.required &&
        status !== "completed" &&
        status !== "cancelled" &&
        effectiveDate < todayDate
      ) {
        overdueTasksList.push({
          id: t.id,
          title: t.title,
          taskType: t.task_type,
          originalDate,
          currentDate: effectiveDate,
          subjectName: t.subjects?.name_tr ?? null,
        });
      }
    }

    // 3. Compute today metrics
    const todayAnalytics = calculateDayAnalytics(todayDate, allRawTasks);

    // 4. Compute 30-day consistency
    // Get unique plan dates in the last 30 days
    const uniqueDates = Array.from(new Set(allRawTasks.map((t) => t.effectivePlanDate))).sort();
    const daySummaries: DayAnalyticsSummary[] = uniqueDates.map((date) =>
      calculateDayAnalytics(date, allRawTasks)
    );
    const consistency = calculateConsistencyMetrics(daySummaries);

    // 5. Fetch question sessions
    const { data: qSessionsData } = await db
      .from("question_sessions")
      .select("routine, block_kind, question_count, correct_count, duration_seconds");

    const qSessions = (qSessionsData as any[]) || [];
    const totalQuestionsSolved = qSessions.reduce((sum, s) => sum + (s.question_count || 0), 0);

    const mathBenchmarks = calculateBenchmarkMetrics(
      qSessions
        .filter((s) => s.routine === "math")
        .map((s) => ({
          blockKind: s.block_kind,
          questionCount: s.question_count,
          correctCount: s.correct_count,
          durationSeconds: s.duration_seconds,
        }))
    );

    const paragraphBenchmarks = calculateBenchmarkMetrics(
      qSessions
        .filter((s) => s.routine === "paragraph")
        .map((s) => ({
          blockKind: s.block_kind,
          questionCount: s.question_count,
          correctCount: s.correct_count,
          durationSeconds: s.duration_seconds,
        }))
    );

    // 6. Fetch mistakes breakdown
    const { data: mistakesData } = await db.from("mistakes").select("reason, status");

    const mistakeCountMap = new Map<string, { total: number; open: number }>();
    for (const m of (mistakesData as any[]) || []) {
      const entry = mistakeCountMap.get(m.reason) || { total: 0, open: 0 };
      entry.total += 1;
      if (m.status === "open") {
        entry.open += 1;
      }
      mistakeCountMap.set(m.reason, entry);
    }

    const mistakeBreakdown = Array.from(mistakeCountMap.entries()).map(([reason, counts]) => ({
      reason,
      count: counts.total,
      openCount: counts.open,
    }));

    // 7. Fetch recent plan mutations
    const { data: mutationsData } = await db
      .from("plan_mutations")
      .select("id, mutation_type, from_date, to_date, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const recentMutations = (mutationsData as any[]) || [];

    // 8. Fetch Yusuf's study notes and gaps
    const { data: notesData } = await db
      .from("student_notes")
      .select("id, category, title, content, target_date, is_resolved, created_at")
      .order("created_at", { ascending: false });

    const studentNotes = (notesData || []).map((n: any) => ({
      id: n.id,
      category: n.category,
      title: n.title,
      content: n.content,
      targetDate: n.target_date ?? null,
      isResolved: Boolean(n.is_resolved),
      createdAt: n.created_at,
    }));

    return {
      family: {
        id: familyId,
        name: "Aile",
        role,
      },
      students,
      todayMetrics: {
        planDate: todayDate,
        totalTasks: todayAnalytics.academicRequiredTasks,
        completedTasks: todayAnalytics.completedRequiredTasks,
        completionPercentage: todayAnalytics.completionPercentage,
        overdueTasksCount: overdueTasksList.length,
      },
      consistency30d: consistency.consistencyPercentage,
      totalQuestionsSolved,
      benchmarkAverages: {
        mathAvgSeconds: mathBenchmarks.averageDurationSeconds,
        mathAvgAccuracy: mathBenchmarks.averageAccuracyPercentage,
        paragraphAvgSeconds: paragraphBenchmarks.averageDurationSeconds,
        paragraphAvgAccuracy: paragraphBenchmarks.averageAccuracyPercentage,
      },
      overdueTasks: overdueTasksList,
      mistakeBreakdown,
      recentMutations,
      studentNotes,
    };
  } catch {
    return buildDefaultAdultDashboardData(familyId, role);
  }
}
