import { describe, it, expect } from "vitest";
import {
  calculateTopicProgress,
  calculateSubjectProgress,
  type TopicMilestoneTask,
  type TopicProgressSummary,
} from "@/domain/topic-progress";

describe("Topic Progress Domain Logic", () => {
  it("does not complete a topic if only video is watched (requires all milestone tasks)", () => {
    const tasks: TopicMilestoneTask[] = [
      {
        id: "t1",
        topicId: "topic-1",
        required: true,
        countsTowardTopicCompletion: true,
        status: "completed", // e.g. video watched
      },
      {
        id: "t2",
        topicId: "topic-1",
        required: true,
        countsTowardTopicCompletion: true,
        status: "pending", // e.g. practice questions pending
      },
    ];

    const progress = calculateTopicProgress(
      "topic-1",
      "Çarpanlar ve Katlar",
      1,
      "Matematik",
      tasks
    );

    expect(progress.totalMilestones).toBe(2);
    expect(progress.completedMilestones).toBe(1);
    expect(progress.isComplete).toBe(false);
    expect(progress.completionPercentage).toBe(50);
  });

  it("completes topic when ALL milestone tasks are completed", () => {
    const tasks: TopicMilestoneTask[] = [
      {
        id: "t1",
        topicId: "topic-1",
        required: true,
        countsTowardTopicCompletion: true,
        status: "completed",
      },
      {
        id: "t2",
        topicId: "topic-1",
        required: true,
        countsTowardTopicCompletion: true,
        status: "completed",
      },
    ];

    const progress = calculateTopicProgress(
      "topic-1",
      "Çarpanlar ve Katlar",
      1,
      "Matematik",
      tasks
    );

    expect(progress.totalMilestones).toBe(2);
    expect(progress.completedMilestones).toBe(2);
    expect(progress.isComplete).toBe(true);
    expect(progress.completionPercentage).toBe(100);
  });

  it("does NOT count cancelled milestone tasks as completed/mastery", () => {
    const tasks: TopicMilestoneTask[] = [
      {
        id: "t1",
        topicId: "topic-1",
        required: true,
        countsTowardTopicCompletion: true,
        status: "completed",
      },
      {
        id: "t2",
        topicId: "topic-1",
        required: true,
        countsTowardTopicCompletion: true,
        status: "cancelled", // Excused task cannot satisfy mastery
      },
    ];

    const progress = calculateTopicProgress(
      "topic-1",
      "Çarpanlar ve Katlar",
      1,
      "Matematik",
      tasks
    );

    expect(progress.totalMilestones).toBe(2);
    expect(progress.completedMilestones).toBe(1);
    expect(progress.isComplete).toBe(false);
    expect(progress.completionPercentage).toBe(50);
  });

  it("calculates subject-level progress aggregated across topics", () => {
    const topicSummaries: TopicProgressSummary[] = [
      {
        topicId: "top-1",
        topicTitle: "Çarpanlar ve Katlar",
        subjectId: 1,
        subjectName: "Matematik",
        totalMilestones: 2,
        completedMilestones: 2,
        isComplete: true,
        completionPercentage: 100,
      },
      {
        topicId: "top-2",
        topicTitle: "Üslü İfadeler",
        subjectId: 1,
        subjectName: "Matematik",
        totalMilestones: 3,
        completedMilestones: 1,
        isComplete: false,
        completionPercentage: 33,
      },
    ];

    const subjectProgress = calculateSubjectProgress(1, "Matematik", topicSummaries);
    expect(subjectProgress.totalTopics).toBe(2);
    expect(subjectProgress.completedTopics).toBe(1);
    expect(subjectProgress.completionPercentage).toBe(50);
  });
});
