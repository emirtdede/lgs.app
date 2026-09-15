import React from "react";
import Link from "next/link";
import { FileText, RotateCcw, Clock, Rocket, StickyNote, Calendar, Check } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdultMember, getAdultDashboardData } from "@/server/adult-service";

export const dynamic = "force-dynamic";

export default async function AdultDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const adult = await getCurrentAdultMember(supabase);

  if (!adult) {
    return null; // Handled by layout
  }

  const data = await getAdultDashboardData(supabase, adult.familyId, adult.role);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top Welcome Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {adult.familyName} — Veli Paneli
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              Veli Paneli
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            LGS 2027 çalışma süreci, 20 soruluk hız trendleri ve tamamlanmayı bekleyen görevler
            özeti.
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl font-medium self-start sm:self-auto">
          Bugün: {data.todayMetrics.planDate}
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Bugünkü Tamamlama</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              %{data.todayMetrics.completionPercentage}
            </span>
            <span className="text-xs text-slate-400">
              ({data.todayMetrics.completedTasks}/{data.todayMetrics.totalTasks} Görev)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">
            Tamamlanmayı Bekleyenler
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold ${
                data.todayMetrics.overdueTasksCount > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {data.todayMetrics.overdueTasksCount}
            </span>
            <span className="text-xs text-slate-400">görev bekliyor</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">
            30 Günlük Tutarlılık
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              %{data.consistency30d}
            </span>
            <span className="text-xs text-slate-400">uygun gün oranı</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Toplam Çözülen Soru</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {data.totalQuestionsSolved}
            </span>
            <span className="text-xs text-slate-400">soru</span>
          </div>
        </div>
      </div>

      {/* Benchmark 20 & Overdue Workload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Benchmark 20 Averages */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              20 Soruluk Rutin Hız ve Doğruluk Ortalamaları
            </h2>
            <Link
              href="/analiz"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Detaylı Analiz →
            </Link>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Matematik Rutin
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {data.benchmarkAverages.mathAvgAccuracy
                    ? `%{data.benchmarkAverages.mathAvgAccuracy} Doğruluk`
                    : "—"}
                </span>
              </div>
              <div className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-300 mt-1">
                {data.benchmarkAverages.mathAvgSeconds
                  ? `${Math.floor(data.benchmarkAverages.mathAvgSeconds / 60)} dk ${
                      data.benchmarkAverages.mathAvgSeconds % 60
                    } sn (20 soru)`
                  : "Henüz veri yok"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">Paragraf Rutin</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {data.benchmarkAverages.paragraphAvgAccuracy
                    ? `%{data.benchmarkAverages.paragraphAvgAccuracy} Doğruluk`
                    : "—"}
                </span>
              </div>
              <div className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-300 mt-1">
                {data.benchmarkAverages.paragraphAvgSeconds
                  ? `${Math.floor(data.benchmarkAverages.paragraphAvgSeconds / 60)} dk ${
                      data.benchmarkAverages.paragraphAvgSeconds % 60
                    } sn (20 soru)`
                  : "Henüz veri yok"}
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Tasks List */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ertelenmeyi Bekleyen Görevler ({data.overdueTasks.length})
            </h2>
            <Link
              href="/admin/plan"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Plan Yönetimi →
            </Link>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {data.overdueTasks.map((ot) => (
              <div
                key={ot.id}
                className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{ot.title}</div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                    Tarih: {ot.currentDate} {ot.subjectName && `• ${ot.subjectName}`}
                  </div>
                </div>
                {adult.role !== "viewer" && (
                  <Link
                    href={`/admin/plan?taskId=${ot.id}`}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 font-semibold hover:bg-amber-100 transition-colors"
                  >
                    Ertele
                  </Link>
                )}
              </div>
            ))}

            {data.overdueTasks.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-500">
                Geciken görev bulunmuyor. Plan takvimi güncel!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mistake Categories & Recent Audit Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mistake Categories */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Yanlış Nedenleri Dağılımı
            </h2>
            <Link
              href="/admin/yanlislar"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Havuzu İncele →
            </Link>
          </div>

          <div className="space-y-2">
            {data.mistakeBreakdown.map((mb) => (
              <div
                key={mb.reason}
                className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                  {mb.reason.replace("_", " ")}
                </span>
                <span className="text-slate-500">
                  {mb.count} soru ({mb.openCount} açık)
                </span>
              </div>
            ))}

            {data.mistakeBreakdown.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-500">
                Kayıtlı yanlış analiz verisi bulunmuyor.
              </div>
            )}
          </div>
        </div>

        {/* Audit Log (Plan Mutations) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Son Plan Değişiklikleri
          </h2>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {data.recentMutations.map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between text-slate-500 text-[11px] mb-0.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {m.mutationType === "TASK_RESCHEDULED"
                      ? "Plan Ertelendi"
                      : m.mutationType === "TASK_CANCELLED"
                        ? "Görev İptal Edildi"
                        : m.mutationType}
                  </span>
                  <span>{new Date(m.createdAt).toLocaleDateString("tr-TR")}</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200">{m.reason}</p>
                {m.fromDate && m.toDate && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    {m.fromDate} → {m.toDate}
                  </p>
                )}
              </div>
            ))}

            {data.recentMutations.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-500">
                Henüz plan erteleme veya iptal kaydı bulunmuyor.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yusuf'un Çalışma Notları & Eksikleri Section */}
      <div className="mt-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Yusuf&apos;un Çalışma Günlüğü, Eksikleri ve Gelecek Planları
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {data.studentNotes.length} Not
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Yusuf&apos;un planda geri kaldığı telafi konuları, ekstra zaman ayıracağı dersler ve
              çalışma hedefleri.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
          {data.studentNotes.map((note) => {
            const categoryLabels: Record<
              string,
              { label: string; icon: React.ComponentType<{ className?: string }>; badge: string }
            > = {
              telafi: {
                label: "Eksikler & Telafi",
                icon: RotateCcw,
                badge:
                  "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
              },
              extra_time: {
                label: "Ekstra Süre Ayrılacak",
                icon: Clock,
                badge:
                  "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
              },
              future_plan: {
                label: "Gelecek Planı",
                icon: Rocket,
                badge:
                  "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
              },
              general: {
                label: "Genel Not",
                icon: StickyNote,
                badge:
                  "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
              },
            };
            const cat = categoryLabels[note.category] || categoryLabels.general;
            const CatIcon = cat.icon;

            return (
              <div
                key={note.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between text-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${cat.badge}`}
                    >
                      <CatIcon className="w-3 h-3 shrink-0" />
                      <span>{cat.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(note.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>

                  <h3
                    className={`font-bold text-slate-900 dark:text-slate-100 text-xs mb-1 ${
                      note.isResolved ? "line-through text-slate-500" : ""
                    }`}
                  >
                    {note.title}
                  </h3>

                  <p className="text-slate-600 dark:text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-700/50 text-[11px]">
                  {note.targetDate ? (
                    <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>Hedef: {note.targetDate}</span>
                    </span>
                  ) : (
                    <span />
                  )}

                  {note.isResolved ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3 shrink-0" />
                      <span>Telafi Edildi</span>
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>Beklemede</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {data.studentNotes.length === 0 && (
            <div className="col-span-2 py-8 text-center text-xs text-slate-500">
              Yusuf henüz bir çalışma notu veya telafi kaydı eklemedi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
