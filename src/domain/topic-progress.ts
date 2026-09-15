/**
 * Topic progress domain logic.
 *
 * Invariants:
 * - Watching a video never completes a topic by itself.
 * - counts_toward_topic_completion is configured only on explicit topic milestones.
 * - A topic becomes complete only when ALL required milestone tasks for that topic are completed.
 * - Cancelled/excused milestone tasks do not constitute mastery and cannot complete the topic.
 * - Generic mixed practice, daily routine, MEB weekly validation and deneme work do not become mastery prerequisites by chronology alone.
 */

export interface TopicMilestoneTask {
  id: string;
  topicId: string;
  required: boolean;
  countsTowardTopicCompletion: boolean;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "overdue";
}

export interface TopicProgressSummary {
  topicId: string;
  topicTitle: string;
  subjectId: number;
  subjectName: string;
  totalMilestones: number;
  completedMilestones: number;
  isComplete: boolean;
  completionPercentage: number;
}

export interface SubjectProgressSummary {
  subjectId: number;
  subjectName: string;
  totalTopics: number;
  completedTopics: number;
  completionPercentage: number;
}

/**
 * Computes topic completion state for a single topic given its tasks.
 */
export function calculateTopicProgress(
  topicId: string,
  topicTitle: string,
  subjectId: number,
  subjectName: string,
  tasks: TopicMilestoneTask[]
): TopicProgressSummary {
  // Filter for explicit milestone tasks that count toward completion
  const milestoneTasks = tasks.filter(
    (t) => t.topicId === topicId && t.countsTowardTopicCompletion
  );

  if (milestoneTasks.length === 0) {
    return {
      topicId,
      topicTitle,
      subjectId,
      subjectName,
      totalMilestones: 0,
      completedMilestones: 0,
      isComplete: false,
      completionPercentage: 0,
    };
  }

  const completedMilestones = milestoneTasks.filter((t) => t.status === "completed").length;
  // A topic is complete ONLY when ALL milestone tasks are completed (cancelled does NOT count)
  const isComplete = completedMilestones === milestoneTasks.length;
  const completionPercentage = Math.round((completedMilestones / milestoneTasks.length) * 100);

  return {
    topicId,
    topicTitle,
    subjectId,
    subjectName,
    totalMilestones: milestoneTasks.length,
    completedMilestones,
    isComplete,
    completionPercentage,
  };
}

/**
 * Computes subject-level progress aggregated from individual topic summaries.
 */
export function calculateSubjectProgress(
  subjectId: number,
  subjectName: string,
  topicSummaries: TopicProgressSummary[]
): SubjectProgressSummary {
  const subjectTopics = topicSummaries.filter((t) => t.subjectId === subjectId);

  if (subjectTopics.length === 0) {
    return {
      subjectId,
      subjectName,
      totalTopics: 0,
      completedTopics: 0,
      completionPercentage: 0,
    };
  }

  const completedTopics = subjectTopics.filter((t) => t.isComplete).length;
  const completionPercentage = Math.round((completedTopics / subjectTopics.length) * 100);

  return {
    subjectId,
    subjectName,
    totalTopics: subjectTopics.length,
    completedTopics,
    completionPercentage,
  };
}
