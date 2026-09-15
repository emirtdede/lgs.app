/**
 * Student Today Domain Logic and View Model builders.
 * Canonical: docs/09_UI_UX_SPEC.md & docs/05_DOMAIN_MODEL_AND_INVARIANTS.md
 */

import type { TaskType, TaskStatus } from "@/lib/supabase/types";

export interface StudentTodayTask {
  id: string;
  externalTaskId: string;
  taskGroupKey: string;
  taskType: TaskType;
  title: string;
  subjectName: string | null;
  topicName: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  plannedQuestionCount: number | null;
  required: boolean;
  countsTowardTopicCompletion: boolean;
  sortOrder: number;
  resourceLabel: string | null;
  resourceUrl: string | null;
  resourceItemLabel: string | null;
  resourceItemUrl: string | null;
  generalPlaylistUrl?: string | null;
  isTimed?: boolean;
  timedQuestionTarget?: number | null;
  status: TaskStatus;
  completedAt: string | null;
  resultQuestionSessionId?: string | null;
  resultQuestionCount?: number | null;
  resultCorrect?: number | null;
  resultWrong?: number | null;
  resultBlank?: number | null;
  resultDurationSeconds?: number | null;
}

export interface ActiveTimerSession {
  sessionId: string;
  taskId: string;
  startedAt: string;
  taskTitle: string;
  taskType: TaskType;
}

export interface ActiveReadingSession {
  sessionId: string;
  bookTitle: string | null;
  startedAt: string;
}

export interface StudentTodayData {
  planDate: string;
  formattedDate: string;
  isCutoffActive: boolean; // Past 21:50
  isPrePlanStart?: boolean;
  planStartDate?: string;
  prePlanMessage?: string;
  dayNumber?: number | null;
  weekNumber?: number | null;
  phase?: string | null;
  realTodayDate?: string;
  prevDate?: string | null;
  nextDate?: string | null;
  isPlanStartFallback?: boolean;
  nextActionTask: StudentTodayTask | null;
  routineTasks: StudentTodayTask[];
  topicTasks: StudentTodayTask[];
  breakTasks: StudentTodayTask[];
  completedTasks: StudentTodayTask[];
  readingTask: StudentTodayTask | null;
  activeTimerSession: ActiveTimerSession | null;
  activeReadingSession: ActiveReadingSession | null;
  isReadingUnlocked: boolean;
  readingLockReason?: string;
  progress: {
    totalRequired: number;
    completedRequired: number;
    percent: number;
  };
}

/**
 * Evaluates whether reading is unlocked for the student today.
 * Invariant: Optional reading unlocks ONLY after all required effective tasks for the day
 * are resolved as completed or explicitly cancelled/excused.
 */
export function checkReadingUnlocked(tasks: StudentTodayTask[]): {
  isUnlocked: boolean;
  uncompletedCount: number;
  reason?: string;
} {
  const requiredTasks = tasks.filter((t) => t.required && t.taskType !== "reading");
  const unresolvedRequired = requiredTasks.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled"
  );

  if (unresolvedRequired.length === 0) {
    return {
      isUnlocked: true,
      uncompletedCount: 0,
    };
  }

  return {
    isUnlocked: false,
    uncompletedCount: unresolvedRequired.length,
    reason: `Günün zorunlu çalışma görevleri (${unresolvedRequired.length} görev kaldı) tamamlandığında kitap okuma açılacaktır.`,
  };
}

/**
 * Calculates student daily progress percentage.
 * Non-academic blocks (break, meal, sleep_prep) and optional reading do not count toward percentage.
 */
export function calculateTodayProgress(tasks: StudentTodayTask[]): {
  totalRequired: number;
  completedRequired: number;
  percent: number;
} {
  const requiredTasks = tasks.filter((t) => t.required && t.taskType !== "reading");
  const totalRequired = requiredTasks.length;
  if (totalRequired === 0) {
    return { totalRequired: 0, completedRequired: 0, percent: 100 };
  }

  const completedRequired = requiredTasks.filter(
    (t) => t.status === "completed" || t.status === "cancelled"
  ).length;
  const percent = Math.min(100, Math.round((completedRequired / totalRequired) * 100));

  return {
    totalRequired,
    completedRequired,
    percent,
  };
}

/**
 * Selects the next actionable task for the student.
 * Prefers first incomplete required routine or topic task in sortOrder.
 */
export function findNextActionTask(tasks: StudentTodayTask[]): StudentTodayTask | null {
  const actionable = tasks.filter(
    (t) => t.status === "pending" || t.status === "in_progress" || t.status === "overdue"
  );

  // First check required tasks (non-breaks)
  const nextRequired = actionable.find(
    (t) => t.required && !["break", "meal", "sleep_prep", "reading"].includes(t.taskType)
  );
  if (nextRequired) return nextRequired;

  // Otherwise any incomplete academic task
  const nextAcademic = actionable.find(
    (t) => !["break", "meal", "sleep_prep", "reading"].includes(t.taskType)
  );
  return nextAcademic ?? null;
}

export const NON_ACADEMIC_TYPES: Set<TaskType> = new Set([
  "break",
  "meal",
  "sleep_prep",
  "mock_break",
]);

const ROUTINE_TYPES: Set<TaskType> = new Set([
  "paragraph_routine",
  "daily_paragraph_benchmark",
  "daily_paragraph_extra",
  "daily_math_benchmark",
  "daily_math_extra",
]);

const BREAK_TYPES: Set<TaskType> = new Set(["break", "meal", "sleep_prep", "mock_break"]);

/**
 * Organizes tasks into student display groups.
 */
export function categorizeStudentTasks(tasks: StudentTodayTask[]): {
  routineTasks: StudentTodayTask[];
  topicTasks: StudentTodayTask[];
  breakTasks: StudentTodayTask[];
  completedTasks: StudentTodayTask[];
  readingTask: StudentTodayTask | null;
} {
  const sorted = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);

  const completedTasks: StudentTodayTask[] = [];
  const routineTasks: StudentTodayTask[] = [];
  const topicTasks: StudentTodayTask[] = [];
  const breakTasks: StudentTodayTask[] = [];
  let readingTask: StudentTodayTask | null = null;

  for (const t of sorted) {
    if (t.taskType === "reading") {
      readingTask = t;
      continue;
    }

    if (t.status === "completed" || t.status === "cancelled") {
      completedTasks.push(t);
      continue;
    }

    if (ROUTINE_TYPES.has(t.taskType)) {
      routineTasks.push(t);
    } else if (BREAK_TYPES.has(t.taskType)) {
      breakTasks.push(t);
    } else {
      topicTasks.push(t);
    }
  }

  return {
    routineTasks,
    topicTasks,
    breakTasks,
    completedTasks,
    readingTask,
  };
}
