import { describe, it, expect } from "vitest";
import {
  isAcademicRequiredTask,
  calculateDayAnalytics,
  calculateConsistencyMetrics,
  calculateBenchmarkMetrics,
  type RawDayTask,
  type DayAnalyticsSummary,
} from "@/domain/analytics";

describe("Domain Analytics & Mathematical Invariants", () => {
  it("excludes optional reading, meals, and breaks from academic required tasks", () => {
    expect(
      isAcademicRequiredTask({
        id: "1",
        effectivePlanDate: "2026-10-01",
        taskType: "daily_math_benchmark",
        required: true,
        status: "pending",
      })
    ).toBe(true);

    expect(
      isAcademicRequiredTask({
        id: "2",
        effectivePlanDate: "2026-10-01",
        taskType: "reading",
        required: false,
        status: "pending",
      })
    ).toBe(false);

    expect(
      isAcademicRequiredTask({
        id: "3",
        effectivePlanDate: "2026-10-01",
        taskType: "meal",
        required: false,
        status: "pending",
      })
    ).toBe(false);
  });

  it("calculates day analytics correctly: completion percentage and eligible state", () => {
    const tasks: RawDayTask[] = [
      {
        id: "t1",
        effectivePlanDate: "2026-10-01",
        taskType: "daily_math_benchmark",
        required: true,
        status: "completed",
      },
      {
        id: "t2",
        effectivePlanDate: "2026-10-01",
        taskType: "daily_paragraph_benchmark",
        required: true,
        status: "pending",
      },
      {
        id: "t3",
        effectivePlanDate: "2026-10-01",
        taskType: "reading",
        required: false,
        status: "completed", // Reading must not affect academic percentage
      },
    ];

    const res = calculateDayAnalytics("2026-10-01", tasks);
    expect(res.academicRequiredTasks).toBe(2);
    expect(res.completedRequiredTasks).toBe(1);
    expect(res.completionPercentage).toBe(50);
    expect(res.isDayComplete).toBe(false);
    expect(res.isEligibleDay).toBe(true);
    expect(res.isExcusedDay).toBe(false);
  });

  it("identifies an excused day when all required academic tasks were cancelled", () => {
    const tasks: RawDayTask[] = [
      {
        id: "t1",
        effectivePlanDate: "2026-10-01",
        taskType: "daily_math_benchmark",
        required: true,
        status: "cancelled",
      },
      {
        id: "t2",
        effectivePlanDate: "2026-10-01",
        taskType: "daily_paragraph_benchmark",
        required: true,
        status: "cancelled",
      },
    ];

    const res = calculateDayAnalytics("2026-10-01", tasks);
    expect(res.academicRequiredTasks).toBe(0);
    expect(res.isEligibleDay).toBe(false);
    expect(res.isExcusedDay).toBe(true);
    expect(res.isDayComplete).toBe(false);
  });

  it("excludes excused days from consistency numerator and denominator", () => {
    const daySummaries: DayAnalyticsSummary[] = [
      {
        planDate: "2026-10-01",
        totalTasks: 2,
        academicRequiredTasks: 2,
        completedRequiredTasks: 2,
        cancelledRequiredTasks: 0,
        isEligibleDay: true,
        isExcusedDay: false,
        isDayComplete: true,
        completionPercentage: 100,
      },
      {
        planDate: "2026-10-02",
        totalTasks: 2,
        academicRequiredTasks: 0,
        completedRequiredTasks: 0,
        cancelledRequiredTasks: 2,
        isEligibleDay: false,
        isExcusedDay: true, // Excused day: excluded!
        isDayComplete: false,
        completionPercentage: 0,
      },
      {
        planDate: "2026-10-03",
        totalTasks: 2,
        academicRequiredTasks: 2,
        completedRequiredTasks: 1,
        cancelledRequiredTasks: 0,
        isEligibleDay: true,
        isExcusedDay: false,
        isDayComplete: false,
        completionPercentage: 50,
      },
    ];

    const consistency = calculateConsistencyMetrics(daySummaries);
    expect(consistency.totalDaysEvaluated).toBe(3);
    expect(consistency.eligibleDaysCount).toBe(2); // Day 1 and Day 3 only
    expect(consistency.excusedDaysCount).toBe(1);
    expect(consistency.completedDaysCount).toBe(1); // Day 1 only
    // 1 completed / 2 eligible = 50%
    expect(consistency.consistencyPercentage).toBe(50);
  });

  it("calculates Benchmark 20 metrics strictly from benchmark_20 sessions", () => {
    const sessions = [
      {
        blockKind: "benchmark_20",
        questionCount: 20,
        correctCount: 18,
        durationSeconds: 1200, // 20 mins -> 60 sec/question
      },
      {
        blockKind: "benchmark_20",
        questionCount: 20,
        correctCount: 16,
        durationSeconds: 1000, // 50 sec/question
      },
      {
        blockKind: "extra", // Must be excluded from benchmark averages
        questionCount: 10,
        correctCount: 9,
        durationSeconds: 300,
      },
    ];

    const metrics = calculateBenchmarkMetrics(sessions);
    expect(metrics.totalSessions).toBe(2);
    expect(metrics.averageDurationSeconds).toBe(1100);
    expect(metrics.averageSecondsPerQuestion).toBe(55); // (1100 / 20)
    expect(metrics.averageAccuracyPercentage).toBe(85); // (90% + 80%) / 2
  });
});
