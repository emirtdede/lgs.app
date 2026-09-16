import React from "react";
import {
  Calculator,
  BookOpen,
  Atom,
  Landmark,
  Compass,
  Globe,
  TrendingUp,
  Clock,
  CheckCircle2,
  BarChart3,
  Award,
} from "lucide-react";
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
import { formatIstanbulLongDate } from "@/domain/time-utils";

export const dynamic = "force-dynamic";

const SUBJECT_CONFIGS: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    barColor: string;
  }
> = {
  matematik: {
    icon: Calculator,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900",
    barColor: "bg-blue-600",
  },
  türkçe: {
    icon: BookOpen,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900",
    barColor: "bg-indigo-600",
  },
  "fen bilimleri": {
    icon: Atom,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900",
    barColor: "bg-emerald-600",
  },
  "inkılap tarihi": {
    icon: Landmark,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900",
    barColor: "bg-rose-600",
  },
  "t.c. inkılap tarihi ve atatürkçülük": {
    icon: Landmark,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900",
    barColor: "bg-rose-600",
  },
  "din kültürü": {
    icon: Compass,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-900",
    barColor: "bg-teal-600",
  },
  "din kültürü ve ahlak bilgisi": {
    icon: Compass,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-900",
    barColor: "bg-teal-600",
  },
  ingilizce: {
    icon: Globe,
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-900",
    barColor: "bg-sky-600",
  },
};

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
    .limit(100);

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
    .eq("counts_toward_topic_completion", true)
    .limit(10000);

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

  const allSubjectSummaries = ((subjectsData as any[]) || []).map((subj: any) =>
    calculateSubjectProgress(Number(subj.id), String(subj.name_tr ?? "Ders"), topicSummaries)
  );

  // Filter out subjects that have 0 topics (e.g. "Genel", "Deneme" or administrative categories)
  const coreSubjectSummaries = allSubjectSummaries.filter((s) => s.totalTopics > 0);

  // Calculate overall benchmark metrics if sessions exist
  const sessions = benchmarkSessions || [];
  const totalBenchmarkQuestions = sessions.reduce((acc, s: any) => acc + (s.question_count || 0), 0);
  const totalBenchmarkCorrect = sessions.reduce((acc, s: any) => acc + (s.correct_count || 0), 0);
  const overallAccuracy =
    totalBenchmarkQuestions > 0
      ? Math.round((totalBenchmarkCorrect / totalBenchmarkQuestions) * 100)
      : null;

  const validDurationSessions = sessions.filter((s: any) => s.duration_seconds && s.duration_seconds > 0);
  const avgDurationSeconds =
    validDurationSessions.length > 0
      ? Math.round(
          validDurationSessions.reduce((acc: number, s: any) => acc + s.duration_seconds, 0) /
            validDurationSessions.length
        )
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Gelişim ve Analiz
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          20 soruluk standart ölçümlerle zaman içindeki hız ve doğruluk gelişimi ile 6 ana LGS dersi müfredat takibi.
        </p>
      </div>

      {/* Curriculum Mastery Grid */}
      <div className="mb-8 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ders Bazında Müfredat Hakimiyeti
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              13 Nisan 2027 konu bitiş hedefine göre tamamlanan akademik konular
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
            {coreSubjectSummaries.length} Ana Ders
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {coreSubjectSummaries.map((subj) => {
            const key = subj.subjectName.toLowerCase().trim();
            const config =
              SUBJECT_CONFIGS[key] || {
                icon: BookOpen,
                color: "text-blue-600 dark:text-blue-400",
                bgColor: "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900",
                barColor: "bg-blue-600",
              };
            const Icon = config.icon;

            return (
              <div
                key={subj.subjectId}
                className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center border ${config.bgColor} ${config.color}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        {subj.subjectName}
                      </span>
                    </div>

                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      %{subj.completionPercentage}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
                      style={{ width: `${subj.completionPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/40">
                  <span>Tamamlanan:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {subj.completedTopics} / {subj.totalTopics} Konu
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 20 Question Standard Benchmark Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                20 Soruluk Standart Ölçüm Geçmişi
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hız ve doğruluğun sağlıklı izlenebilmesi için tüm ölçümler standart 20 soruluk ileri sayımlı bloklardan oluşur.
            </p>
          </div>

          {/* Quick Stats Summary */}
          {sessions.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Ort. %{overallAccuracy ?? "—"} Doğruluk
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Ort. {avgDurationSeconds ? `${Math.floor(avgDurationSeconds / 60)} dk ${avgDurationSeconds % 60} sn` : "—"}
              </span>
            </div>
          )}
        </div>

        {/* Mobile Card List (Visible on screens < md) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {sessions.map((s: any) => {
            const accuracy = Math.round((s.correct_count / 20) * 100);
            const secPerQ = s.duration_seconds ? (s.duration_seconds / 20).toFixed(1) : "—";
            const isMath = s.routine === "math";

            return (
              <div key={s.id} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-bold text-xs px-2 py-0.5 rounded-md ${
                      isMath
                        ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                        : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                    }`}
                  >
                    {isMath ? "Matematik" : "Paragraf"} • 20 Soru
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {formatIstanbulLongDate(s.plan_date)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    {s.correct_count} Doğru • {s.wrong_count} Yanlış • {s.blank_count} Boş
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                    %{accuracy}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-50 dark:border-slate-800/60 text-slate-500 font-mono">
                  <span>
                    Süre:{" "}
                    {s.duration_seconds
                      ? `${Math.floor(s.duration_seconds / 60)} dk ${s.duration_seconds % 60} sn`
                      : "—"}
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {secPerQ} sn / soru
                  </span>
                </div>
              </div>
            );
          })}

          {sessions.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <Clock className="w-6 h-6 text-slate-400 opacity-60" />
              <span>Henüz tamamlanmış 20 soruluk ölçüm oturumu bulunmuyor.</span>
              <span className="text-[11px] text-slate-400">
                1 Ekim&apos;den itibaren yapılan günlük ölçümler burada listelenecektir.
              </span>
            </div>
          )}
        </div>

        {/* Desktop Table (Visible on md and up) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">Rutin Türü</th>
                <th className="py-3 px-4">Doğruluk</th>
                <th className="py-3 px-4">Net Dağılımı</th>
                <th className="py-3 px-4">Toplam Süre</th>
                <th className="py-3 px-4 text-right">Soru Başına Süre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {sessions.map((s: any) => {
                const accuracy = Math.round((s.correct_count / 20) * 100);
                const secPerQ = s.duration_seconds ? (s.duration_seconds / 20).toFixed(1) : "—";
                const isMath = s.routine === "math";

                return (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {formatIstanbulLongDate(s.plan_date)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                          isMath
                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                            : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                        }`}
                      >
                        {isMath ? "Matematik" : "Paragraf"} • 20 Soru
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
                    <td className="py-3 px-4 font-mono font-medium">
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

              {sessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Clock className="w-6 h-6 text-slate-400 opacity-60" />
                      <span className="font-medium text-slate-600 dark:text-slate-400">
                        Henüz tamamlanmış 20 soruluk ölçüm oturumu bulunmuyor.
                      </span>
                      <span className="text-[11px] text-slate-400">
                        1 Ekim&apos;den itibaren yapılan günlük ölçümler burada listelenecektir.
                      </span>
                    </div>
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
