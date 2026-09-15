/**
 * Plan rescheduling and overdue task domain logic.
 *
 * Invariants:
 * - Missing work is not auto-copied to tomorrow.
 * - Original task date (plan_day_id) is immutable forever.
 * - Effective date (current_plan_day_id) may change only through audited owner/admin reschedule.
 * - Completed tasks cannot be rescheduled or cancelled.
 * - Active timers must be resolved/cancelled before reschedule or cancel.
 * - Student cannot mutate schedule dates.
 * - Re-evaluate destination-day workload and warn if unusually heavy, but never silently move additional tasks.
 */

export interface RescheduleTaskInput {
  taskId: string;
  originalPlanDate: string;
  currentPlanDate: string;
  targetPlanDate: string;
  taskStatus: "pending" | "in_progress" | "completed" | "cancelled" | "overdue";
  hasActiveTimer: boolean;
  reason: string;
}

export interface DayWorkload {
  planDate: string;
  totalTasks: number;
  requiredAcademicTasks: number;
  estimatedQuestions: number;
}

export interface RescheduleValidationResult {
  allowed: boolean;
  errorCode?: string;
  errorMessage?: string;
  destinationWarning?: string;
}

const HEAVY_WORKLOAD_QUESTION_THRESHOLD = 60;
const HEAVY_WORKLOAD_TASK_THRESHOLD = 6;

/**
 * Determines whether a task is overdue given today's date in Europe/Istanbul.
 */
export function isTaskOverdue(
  currentPlanDate: string,
  todayDate: string,
  status: "pending" | "in_progress" | "completed" | "cancelled" | "overdue"
): boolean {
  if (status === "completed" || status === "cancelled") {
    return false;
  }
  // If task effective date is strictly before today
  return currentPlanDate < todayDate;
}

/**
 * Validates whether a task can be rescheduled.
 */
export function validateReschedule(
  input: RescheduleTaskInput,
  destinationWorkload?: DayWorkload
): RescheduleValidationResult {
  const trimmedReason = input.reason.trim();
  if (trimmedReason.length === 0) {
    return {
      allowed: false,
      errorCode: "REASON_REQUIRED",
      errorMessage: "Erteleme gerekçesi belirtilmelidir.",
    };
  }

  if (input.taskStatus === "completed") {
    return {
      allowed: false,
      errorCode: "TASK_ALREADY_COMPLETED",
      errorMessage: "Tamamlanmış bir görev ertelenemez.",
    };
  }

  if (input.taskStatus === "cancelled") {
    return {
      allowed: false,
      errorCode: "TASK_CANCELLED",
      errorMessage: "İptal edilmiş bir görev ertelenemez.",
    };
  }

  if (input.hasActiveTimer) {
    return {
      allowed: false,
      errorCode: "ACTIVE_TIMER_EXISTS",
      errorMessage:
        "Aktif zamanlayıcısı bulunan bir görev ertelenemez. Önce zamanlayıcıyı durdurun veya iptal edin.",
    };
  }

  if (input.targetPlanDate === input.currentPlanDate) {
    return {
      allowed: false,
      errorCode: "SAME_DATE",
      errorMessage: "Hedef tarih mevcut tarihten farklı olmalıdır.",
    };
  }

  let destinationWarning: string | undefined;
  if (destinationWorkload) {
    if (
      destinationWorkload.requiredAcademicTasks >= HEAVY_WORKLOAD_TASK_THRESHOLD ||
      destinationWorkload.estimatedQuestions >= HEAVY_WORKLOAD_QUESTION_THRESHOLD
    ) {
      destinationWarning = `Dikkat: Hedef günde (${destinationWorkload.planDate}) zaten ${destinationWorkload.requiredAcademicTasks} zorunlu çalışma ve yaklaşık ${destinationWorkload.estimatedQuestions} soru planlanmış durumda.`;
    }
  }

  return {
    allowed: true,
    destinationWarning,
  };
}
