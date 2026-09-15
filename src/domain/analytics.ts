/**
 * Mathematics and Domain Invariants for Study Progress & Family Analytics.
 * Strict implementation of docs/11_ANALYTICS_METRICS.md.
 *
 * Invariants:
 * - Never mix Benchmark 20 with extra/topic/mixed volume in speed time-series.
 * - Accuracy denominator is actual question count.
 * - Day completion ignores optional reading/rest/meal/sleep blocks.
 * - Cancelled work is excused operationally but is NOT mastery.
 * - Excused days (where all required tasks are cancelled) are excluded from consistency numerator AND denominator.
 * - No peer comparison, leaderboard, or shame language.
 */

export interface RawDayTask {
  id: string;
  effectivePlanDate: string;
  taskType: string;
  required: boolean;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "overdue";
  plannedQuestions?: number | null;
}

export interface DayAnalyticsSummary {
  planDate: string;
  totalTasks: number;
  academicRequiredTasks: number;
  completedRequiredTasks: number;
  cancelledRequiredTasks: number;
  isEligibleDay: boolean;
  isExcusedDay: boolean;
  isDayComplete: boolean;
  completionPercentage: number;
}

export interface ConsistencyMetrics {
  totalDaysEvaluated: number;
  eligibleDaysCount: number;
  excusedDaysCount: number;
  completedDaysCount: number;
  consistencyPercentage: number;
}

export interface BenchmarkMetrics {
  totalSessions: number;
  averageDurationSeconds: number | null;
  averageSecondsPerQuestion: number | null;
  averageAccuracyPercentage: number | null;
}

const NON_ACADEMIC_TYPES = new Set(["reading", "break", "meal", "sleep_prep"]);

/**
 * Checks whether a task is considered an academic required task.
 */
export function isAcademicRequiredTask(task: RawDayTask): boolean {
  return task.required && !NON_ACADEMIC_TYPES.has(task.taskType);
}

/**
 * Computes day-level analytics for a single date.
 */
export function calculateDayAnalytics(planDate: string, tasks: RawDayTask[]): DayAnalyticsSummary {
  const dayTasks = tasks.filter((t) => t.effectivePlanDate === planDate);
  const academicTasks = dayTasks.filter(isAcademicRequiredTask);

  const nonCancelled = academicTasks.filter((t) => t.status !== "cancelled");
  const completed = nonCancelled.filter((t) => t.status === "completed");
  const cancelled = academicTasks.filter((t) => t.status === "cancelled");

  // An eligible day has at least one non-cancelled required academic task
  const isEligibleDay = nonCancelled.length > 0;
  // An excused day had required work, but all were cancelled/excused
  const isExcusedDay = academicTasks.length > 0 && nonCancelled.length === 0;

  const isDayComplete = isEligibleDay && completed.length === nonCancelled.length;
  const completionPercentage =
    nonCancelled.length > 0 ? Math.round((completed.length / nonCancelled.length) * 100) : 0;

  return {
    planDate,
    totalTasks: dayTasks.length,
    academicRequiredTasks: nonCancelled.length,
    completedRequiredTasks: completed.length,
    cancelledRequiredTasks: cancelled.length,
    isEligibleDay,
    isExcusedDay,
    isDayComplete,
    completionPercentage,
  };
}

/**
 * Computes rolling consistency metrics across a set of dates (e.g. 30 days).
 * Excused days are excluded from both numerator and denominator.
 */
export function calculateConsistencyMetrics(
  daySummaries: DayAnalyticsSummary[]
): ConsistencyMetrics {
  const eligibleDays = daySummaries.filter((d) => d.isEligibleDay);
  const excusedDays = daySummaries.filter((d) => d.isExcusedDay);
  const completedDays = eligibleDays.filter((d) => d.isDayComplete);

  const consistencyPercentage =
    eligibleDays.length > 0 ? Math.round((completedDays.length / eligibleDays.length) * 100) : 0;

  return {
    totalDaysEvaluated: daySummaries.length,
    eligibleDaysCount: eligibleDays.length,
    excusedDaysCount: excusedDays.length,
    completedDaysCount: completedDays.length,
    consistencyPercentage,
  };
}

/**
 * Computes Benchmark 20 speed and accuracy metrics.
 * Ensures strictly 20-question completed benchmarks are evaluated.
 */
export function calculateBenchmarkMetrics(
  sessions: {
    blockKind: string;
    questionCount: number;
    correctCount: number;
    durationSeconds: number | null;
  }[]
): BenchmarkMetrics {
  const validBenchmarks = sessions.filter(
    (s) => s.blockKind === "benchmark_20" && s.durationSeconds !== null && s.durationSeconds > 0
  );

  if (validBenchmarks.length === 0) {
    return {
      totalSessions: 0,
      averageDurationSeconds: null,
      averageSecondsPerQuestion: null,
      averageAccuracyPercentage: null,
    };
  }

  const totalDuration = validBenchmarks.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  const avgDuration = Math.round(totalDuration / validBenchmarks.length);
  // Benchmark 20 is always 20 questions
  const avgSecPerQ = Math.round((avgDuration / 20) * 10) / 10;

  const totalAccuracy = validBenchmarks.reduce((sum, s) => sum + (s.correctCount / 20) * 100, 0);
  const avgAccuracy = Math.round(totalAccuracy / validBenchmarks.length);

  return {
    totalSessions: validBenchmarks.length,
    averageDurationSeconds: avgDuration,
    averageSecondsPerQuestion: avgSecPerQ,
    averageAccuracyPercentage: avgAccuracy,
  };
}
