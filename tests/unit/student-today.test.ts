import { describe, it, expect } from "vitest";
import {
  checkReadingUnlocked,
  calculateTodayProgress,
  findNextActionTask,
  categorizeStudentTasks,
  type StudentTodayTask,
} from "@/domain/student-today";

describe("Domain: Student Today Workflows", () => {
  const sampleTasks: StudentTodayTask[] = [
    {
      id: "task-1",
      externalTaskId: "1:benchmark",
      taskGroupKey: "1",
      taskType: "daily_paragraph_benchmark",
      title: "Paragraf Rutini (20 Soru)",
      subjectName: "Türkçe",
      topicName: null,
      plannedStart: "16:00",
      plannedEnd: "16:40",
      plannedQuestionCount: 20,
      required: true,
      countsTowardTopicCompletion: false,
      sortOrder: 1,
      resourceLabel: "Kronometre Paragraf",
      resourceUrl: null,
      resourceItemLabel: null,
      resourceItemUrl: null,
      status: "pending",
      completedAt: null,
    },
    {
      id: "task-2",
      externalTaskId: "2:video",
      taskGroupKey: "2",
      taskType: "topic_video",
      title: "Çarpanlar ve Katlar Konu Anlatımı",
      subjectName: "Matematik",
      topicName: "Çarpanlar ve Katlar",
      plannedStart: "17:00",
      plannedEnd: "17:40",
      plannedQuestionCount: null,
      required: true,
      countsTowardTopicCompletion: false,
      sortOrder: 2,
      resourceLabel: "Partikül Matematik",
      resourceUrl: "https://youtube.com",
      resourceItemLabel: "Video 1",
      resourceItemUrl: "https://youtube.com/watch?v=1",
      status: "pending",
      completedAt: null,
    },
    {
      id: "task-3",
      externalTaskId: "3:break",
      taskGroupKey: "3",
      taskType: "break",
      title: "Mola",
      subjectName: null,
      topicName: null,
      plannedStart: "17:40",
      plannedEnd: "18:00",
      plannedQuestionCount: null,
      required: false,
      countsTowardTopicCompletion: false,
      sortOrder: 3,
      resourceLabel: null,
      resourceUrl: null,
      resourceItemLabel: null,
      resourceItemUrl: null,
      status: "pending",
      completedAt: null,
    },
    {
      id: "task-4",
      externalTaskId: "4:reading",
      taskGroupKey: "4",
      taskType: "reading",
      title: "Kitap Okuma",
      subjectName: null,
      topicName: null,
      plannedStart: "21:00",
      plannedEnd: "21:30",
      plannedQuestionCount: null,
      required: false,
      countsTowardTopicCompletion: false,
      sortOrder: 4,
      resourceLabel: null,
      resourceUrl: null,
      resourceItemLabel: null,
      resourceItemUrl: null,
      status: "pending",
      completedAt: null,
    },
  ];

  it("keeps reading locked until all required tasks are completed or cancelled", () => {
    // Both task-1 and task-2 are pending -> locked
    const check1 = checkReadingUnlocked(sampleTasks);
    expect(check1.isUnlocked).toBe(false);
    expect(check1.uncompletedCount).toBe(2);
    expect(check1.reason).toContain("2 görev kaldı");

    // Complete task-1 only -> still locked
    const partialTasks: StudentTodayTask[] = [
      { ...sampleTasks[0], status: "completed" },
      sampleTasks[1],
      sampleTasks[2],
      sampleTasks[3],
    ];
    const check2 = checkReadingUnlocked(partialTasks);
    expect(check2.isUnlocked).toBe(false);
    expect(check2.uncompletedCount).toBe(1);

    // Cancel task-2 (excused by admin) -> now all required are resolved -> unlocked!
    const resolvedTasks: StudentTodayTask[] = [
      { ...sampleTasks[0], status: "completed" },
      { ...sampleTasks[1], status: "cancelled" },
      sampleTasks[2],
      sampleTasks[3],
    ];
    const check3 = checkReadingUnlocked(resolvedTasks);
    expect(check3.isUnlocked).toBe(true);
    expect(check3.uncompletedCount).toBe(0);
  });

  it("calculates daily progress accurately without including break or reading in required count", () => {
    // 2 required tasks: task-1 and task-2
    const progress0 = calculateTodayProgress(sampleTasks);
    expect(progress0.totalRequired).toBe(2);
    expect(progress0.completedRequired).toBe(0);
    expect(progress0.percent).toBe(0);

    const partialTasks: StudentTodayTask[] = [
      { ...sampleTasks[0], status: "completed" },
      sampleTasks[1],
      sampleTasks[2],
      sampleTasks[3],
    ];
    const progress50 = calculateTodayProgress(partialTasks);
    expect(progress50.completedRequired).toBe(1);
    expect(progress50.percent).toBe(50);
  });

  it("identifies next actionable task prioritizing required academic tasks", () => {
    const next1 = findNextActionTask(sampleTasks);
    expect(next1?.id).toBe("task-1");

    const nextAfterTask1 = findNextActionTask([
      { ...sampleTasks[0], status: "completed" },
      sampleTasks[1],
      sampleTasks[2],
      sampleTasks[3],
    ]);
    expect(nextAfterTask1?.id).toBe("task-2");
  });

  it("categorizes tasks into appropriate sections for student presentation", () => {
    const categories = categorizeStudentTasks(sampleTasks);
    expect(categories.routineTasks.length).toBe(1);
    expect(categories.routineTasks[0].id).toBe("task-1");
    expect(categories.topicTasks.length).toBe(1);
    expect(categories.topicTasks[0].id).toBe("task-2");
    expect(categories.breakTasks.length).toBe(1);
    expect(categories.breakTasks[0].id).toBe("task-3");
    expect(categories.readingTask?.id).toBe("task-4");
  });
});
