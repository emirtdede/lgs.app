import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/env";
import { getCurrentAdultMember } from "@/server/adult-service";
import {
  calculateTopicProgress,
  calculateSubjectProgress,
  type TopicMilestoneTask,
  type TopicProgressSummary,
} from "@/domain/topic-progress";

export const dynamic = "force-dynamic";

export default async function AdultAnalyticsPage() {
  const supabase = env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createServerSupabaseClient();
  const adult = await getCurrentAdultMember(supabase);

  if (!adult) {
    return null;
  }

  // 1. Fetch Benchmark 20 sessions
  const { data: benchmarkSessions } = await supabase
    .from("question_sessions")
    .select(
      "id, plan_date, routine, block_kind, question_count, correct_count, wrong_count, blank_count, duration_seconds"
    )
    .eq("block_kind", "benchmark_20")
    .order("plan_date", { ascending: false })
    .limit(50);

  // 2. Fetch subject and topic milestone completion
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

  const milestoneTasks: TopicMilestoneTask[] = (milestoneTasksData || []).map((t: any) => ({
    id: t.id,
    topicId: t.topic_id,
    required: t.required,
    countsTowardTopicCompletion: t.counts_toward_topic_completion,
    status: t.task_completions?.[0]?.status ?? "pending",
  }));

  const topicSummaries: TopicProgressSummary[] = ((topicsData as any[]) || []).map((top: any) => {
    const subj = ((subjectsData as any[]) || []).find((s: any) => s.id === top.subject_id);
    return calculateTopicProgress(
      String(top.id),
      String(top.name_tr ?? "Konu"),
      Number(top.subject_id ?? 0),
      String(subj?.name_tr ?? "Ders"),
      milestoneTasks
    );
  });

  const subjectSummaries = ((subjectsData as any[]) || []).map((subj: any) =>
    calculateSubjectProgress(Number(subj.id), String(subj.name_tr ?? "Ders"), topicSummaries)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gelişim ve Analiz</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          20 soruluk standart ölçümlerle zaman içindeki hız ve doğruluk gelişimi ile müfredat
          tamamlama analizi.
        </p>
      </div>

      {/* Curriculum Mastery Grid */}
      <div className="mb-8 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Ders Bazında Müfredat Hakimiyeti
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectSummaries.map((subj) => (
            <div
              key={subj.subjectId}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {subj.subjectName}
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  %{subj.completionPercentage} ({subj.completedTopics}/{subj.totalTopics} Konu)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${subj.completionPercentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 20 Question Detailed Time Series Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              20 Soruluk Ölçüm Geçmişi
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hız ve doğruluğun sağlıklı izlenebilmesi için tüm ölçümler standart 20 soruluk
              bloklardan oluşur.
            </p>
          </div>
        </div>

        {/* Mobile Card List (Visible on screens < md) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {(benchmarkSessions || []).map((s: any) => {
            const accuracy = Math.round((s.correct_count / 20) * 100);
            const secPerQ = s.duration_seconds ? (s.duration_seconds / 20).toFixed(1) : "—";

            return (
              <div key={s.id} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                    {s.routine === "math" ? "Matematik" : "Paragraf"} • 20 Soru
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{s.plan_date}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300">
                    {s.correct_count} D • {s.wrong_count} Y • {s.blank_count} B
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                    %{accuracy}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-500 font-mono">
                    Toplam:{" "}
                    {s.duration_seconds
                      ? `${Math.floor(s.duration_seconds / 60)} dk ${s.duration_seconds % 60} sn`
                      : "—"}
                  </span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {secPerQ} sn / soru
                  </span>
                </div>
              </div>
            );
          })}

          {(!benchmarkSessions || benchmarkSessions.length === 0) && (
            <div className="p-6 text-center text-slate-500 text-xs">
              Henüz tamamlanmış 20 soruluk ölçüm oturumu bulunmuyor.
            </div>
          )}
        </div>

        {/* Desktop Table (Visible on md and up) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">Rutin</th>
                <th className="py-3 px-4">Doğruluk</th>
                <th className="py-3 px-4">Net Dağılımı</th>
                <th className="py-3 px-4">Toplam Süre</th>
                <th className="py-3 px-4 text-right">Soru Başına Süre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {(benchmarkSessions || []).map((s: any) => {
                const accuracy = Math.round((s.correct_count / 20) * 100);
                const secPerQ = s.duration_seconds ? (s.duration_seconds / 20).toFixed(1) : "—";

                return (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {s.plan_date}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {s.routine === "math" ? "Matematik" : "Paragraf"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                        %{accuracy}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {s.correct_count} D • {s.wrong_count} Y • {s.blank_count} B
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {s.duration_seconds
                        ? `${Math.floor(s.duration_seconds / 60)} dk ${s.duration_seconds % 60} sn`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {secPerQ} sn / soru
                    </td>
                  </tr>
                );
              })}

              {(!benchmarkSessions || benchmarkSessions.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Henüz tamamlanmış 20 soruluk ölçüm oturumu bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
