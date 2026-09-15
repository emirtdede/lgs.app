import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/env";
import { getCurrentStudent } from "@/server/student-service";
import {
  calculateTopicProgress,
  calculateSubjectProgress,
  type TopicMilestoneTask,
  type TopicProgressSummary,
} from "@/domain/topic-progress";
import {
  ProgressClientView,
  type BenchmarkSessionItem,
} from "@/components/student/ProgressClientView";

export const dynamic = "force-dynamic";

export default async function StudentProgressPage() {
  const supabase = env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createServerSupabaseClient();
  const student = await getCurrentStudent(supabase);
  const studentId = student?.studentId ?? "student-local-1";

  // 1. Fetch Benchmark 20 sessions across the ENTIRE duration (no 30-day limit!)
  const { data: rawBenchmarkSessions } = await supabase
    .from("question_sessions")
    .select(
      "id, plan_date, routine, block_kind, question_count, correct_count, wrong_count, blank_count, duration_seconds"
    )
    .eq("student_id", studentId)
    .eq("block_kind", "benchmark_20")
    .order("plan_date", { ascending: false });

  const benchmarkSessions: BenchmarkSessionItem[] =
    (rawBenchmarkSessions as BenchmarkSessionItem[]) || [];

  // 2. Fetch total question volume and breakdown across all sessions
  const { data: allSessions } = await supabase
    .from("question_sessions")
    .select(
      `
      question_count,
      correct_count,
      wrong_count,
      blank_count,
      routine,
      tasks (
        subject_id
      )
    `
    )
    .eq("student_id", studentId);

  const totalQuestionsSolved = (allSessions || []).reduce(
    (sum, s) => sum + (s.question_count || 0),
    0
  );

  // 3. Fetch subjects, topics, and completion milestone tasks for curriculum progress
  const { data: subjectsData } = await supabase.from("subjects").select("id, name_tr").order("id");

  const { data: topicsData } = await supabase
    .from("topics")
    .select("id, name_tr, subject_id")
    .order("sort_order");

  const { data: milestoneTasksData } = await supabase
    .from("tasks")
    .select(
      "id, topic_id, required, counts_toward_topic_completion, task_completions!tasks_id_fkey(status)"
    )
    .eq("counts_toward_topic_completion", true);

  // Map into domain TopicMilestoneTask
  const milestoneTasks: TopicMilestoneTask[] = (milestoneTasksData || []).map((t: any) => ({
    id: t.id,
    topicId: t.topic_id,
    required: t.required,
    countsTowardTopicCompletion: t.counts_toward_topic_completion,
    status: t.task_completions?.[0]?.status ?? "pending",
  }));

  // Calculate topic summaries
  const topicSummaries: TopicProgressSummary[] = ((topicsData as any[]) || []).map((top: any) => {
    const subj = ((subjectsData as any[]) || []).find((s: any) => s.id === top.subject_id);
    return calculateTopicProgress(
      String(top.id),
      String(top.name_tr ?? (top as any).title ?? "Konu"),
      Number(top.subject_id ?? 0),
      String(subj?.name_tr ?? "Ders"),
      milestoneTasks
    );
  });

  // Calculate subject summaries
  const subjectSummaries = ((subjectsData as any[]) || []).map((subj: any) =>
    calculateSubjectProgress(Number(subj.id), String(subj.name_tr ?? "Ders"), topicSummaries)
  );

  // Calculate subject question breakdown
  const subjectQuestionStats = ((subjectsData as any[]) || []).map((subj: any) => {
    let count = 0;
    let correct = 0;
    let wrong = 0;
    let blank = 0;

    for (const s of (allSessions as any[]) || []) {
      const sSubjId = s.tasks?.subject_id;
      const isThisSubject =
        sSubjId === subj.id ||
        (!sSubjId && subj.name_tr?.includes("Matematik") && s.routine === "math") ||
        (!sSubjId && subj.name_tr?.includes("Türkçe") && s.routine === "paragraph");

      if (isThisSubject) {
        count += s.question_count || 0;
        correct += s.correct_count || 0;
        wrong += s.wrong_count || 0;
        blank += s.blank_count || 0;
      }
    }

    const accuracy = count > 0 ? Math.round((correct / count) * 100) : 0;

    return {
      id: subj.id,
      name: subj.name_tr,
      count,
      correct,
      wrong,
      blank,
      accuracy,
    };
  });

  const totalTopics = topicSummaries.length;
  const completedTopics = topicSummaries.filter((t) => t.isComplete).length;
  const overallCurriculumPct =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Calculate benchmark averages
  const mathBenchmarks = benchmarkSessions.filter((s) => s.routine === "math");
  const paragraphBenchmarks = benchmarkSessions.filter((s) => s.routine === "paragraph");

  const avgMathSec =
    mathBenchmarks.length > 0
      ? Math.round(
          mathBenchmarks.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) /
            mathBenchmarks.length
        )
      : null;

  const avgParagraphSec =
    paragraphBenchmarks.length > 0
      ? Math.round(
          paragraphBenchmarks.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) /
            paragraphBenchmarks.length
        )
      : null;

  return (
    <ProgressClientView
      totalQuestionsSolved={totalQuestionsSolved}
      overallCurriculumPct={overallCurriculumPct}
      completedTopics={completedTopics}
      totalTopics={totalTopics}
      avgMathSec={avgMathSec}
      avgParagraphSec={avgParagraphSec}
      subjectQuestionStats={subjectQuestionStats}
      subjectSummaries={subjectSummaries}
      benchmarkSessions={benchmarkSessions}
    />
  );
}
