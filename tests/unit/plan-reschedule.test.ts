import { describe, it, expect } from "vitest";
import {
  isTaskOverdue,
  validateReschedule,
  type RescheduleTaskInput,
} from "@/domain/plan-reschedule";

describe("Plan Rescheduling & Overdue Invariants", () => {
  it("flags past unfinished tasks as overdue based on Europe/Istanbul date", () => {
    // 2026-10-01 task checked on 2026-10-02
    expect(isTaskOverdue("2026-10-01", "2026-10-02", "pending")).toBe(true);
    expect(isTaskOverdue("2026-10-01", "2026-10-02", "in_progress")).toBe(true);

    // Completed or cancelled tasks are NOT overdue
    expect(isTaskOverdue("2026-10-01", "2026-10-02", "completed")).toBe(false);
    expect(isTaskOverdue("2026-10-01", "2026-10-02", "cancelled")).toBe(false);

    // Same-day or future tasks are not overdue
    expect(isTaskOverdue("2026-10-02", "2026-10-02", "pending")).toBe(false);
    expect(isTaskOverdue("2026-10-05", "2026-10-02", "pending")).toBe(false);
  });

  it("rejects rescheduling without a reason", () => {
    const input: RescheduleTaskInput = {
      taskId: "task-1",
      originalPlanDate: "2026-10-01",
      currentPlanDate: "2026-10-01",
      targetPlanDate: "2026-10-03",
      taskStatus: "pending",
      hasActiveTimer: false,
      reason: "   ",
    };

    const res = validateReschedule(input);
    expect(res.allowed).toBe(false);
    expect(res.errorCode).toBe("REASON_REQUIRED");
  });

  it("rejects rescheduling a completed task", () => {
    const input: RescheduleTaskInput = {
      taskId: "task-1",
      originalPlanDate: "2026-10-01",
      currentPlanDate: "2026-10-01",
      targetPlanDate: "2026-10-03",
      taskStatus: "completed",
      hasActiveTimer: false,
      reason: "Zaman kalmadı",
    };

    const res = validateReschedule(input);
    expect(res.allowed).toBe(false);
    expect(res.errorCode).toBe("TASK_ALREADY_COMPLETED");
  });

  it("rejects rescheduling a task with an active timer", () => {
    const input: RescheduleTaskInput = {
      taskId: "task-1",
      originalPlanDate: "2026-10-01",
      currentPlanDate: "2026-10-01",
      targetPlanDate: "2026-10-03",
      taskStatus: "in_progress",
      hasActiveTimer: true,
      reason: "Zaman kalmadı",
    };

    const res = validateReschedule(input);
    expect(res.allowed).toBe(false);
    expect(res.errorCode).toBe("ACTIVE_TIMER_EXISTS");
  });

  it("warns if destination day has unusually heavy workload but allows rescheduling", () => {
    const input: RescheduleTaskInput = {
      taskId: "task-1",
      originalPlanDate: "2026-10-01",
      currentPlanDate: "2026-10-01",
      targetPlanDate: "2026-10-03",
      taskStatus: "pending",
      hasActiveTimer: false,
      reason: "Hastalık sebebiyle",
    };

    const heavyDay = {
      planDate: "2026-10-03",
      totalTasks: 8,
      requiredAcademicTasks: 7,
      estimatedQuestions: 80,
    };

    const res = validateReschedule(input, heavyDay);
    expect(res.allowed).toBe(true);
    expect(res.destinationWarning).toBeDefined();
    expect(res.destinationWarning).toContain("Dikkat");
  });
});
