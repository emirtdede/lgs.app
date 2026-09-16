import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Flame,
  Target,
  FileText,
  RotateCcw,
  Rocket,
  StickyNote,
  Calendar,
  Check,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdultMember, getAdultDashboardData } from "@/server/adult-service";
import { formatIstanbulLongDate } from "@/domain/time-utils";

export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  knowledge_gap: {
    label: "Bilgi Eksiği",
    color: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900",
  },
  calculation_error: {
    label: "İşlem Hatası",
    color: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900",
  },
  misread: {
    label: "Soruyu Yanlış Okuma",
    color: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900",
  },
  attention: {
    label: "Dikkatsizlik",
    color: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900",
  },
  strategy: {
    label: "Süre / Strateji",
    color: "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-900",
  },
  unknown: {
    label: "Diğer",
    color: "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
};

export default async function AdultDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const adult = await getCurrentAdultMember(supabase);

  if (!adult) {
    return null;
  }

  const data = await getAdultDashboardData(supabase, adult.familyId, adult.role);
  const studentName = data.students[0]?.displayName || "Yusuf";

  const planStartDate = "2026-10-01";
  const isBeforeStart = data.todayMetrics.planDate < planStartDate;
  let daysUntilStart = 0;
  if (isBeforeStart) {
    const todayMs = new Date(data.todayMetrics.planDate).getTime();
    const startMs = new Date(planStartDate).getTime();
    daysUntilStart = Math.max(0, Math.ceil((startMs - todayMs) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top Welcome Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {adult.familyName} — Veli Paneli
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              Öğrenci: {studentName}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            LGS 2027 çalışma süreci, 20 soruluk hız trendleri ve görev takibi özeti.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs self-start sm:self-auto flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{formatIstanbulLongDate(data.todayMetrics.planDate)}</span>
        </div>
      </div>

      {/* Plan Starts on Oct 1 Banner (Active before Oct 1, 2026) */}
      {isBeforeStart && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 border border-blue-200/80 dark:border-blue-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  LGS 2027 Çalışma Planı 1 Ekim 2026&apos;da Başlıyor
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                  {daysUntilStart} Gün Kaldı
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Resmi LGS müfredat takvimine göre 1. Gün çalışması 1 Ekim Perşembe günü aktif olacaktır.
              </p>
            </div>
          </div>

          <Link
            href="/takvim"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800 shadow-2xs shrink-0 transition-colors"
          >
            <span>1. Gün Programını İncele (1 Ekim)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* KPI 1: Bugünkü Tamamlama */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Bugünkü Tamamlama</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                %{data.todayMetrics.completionPercentage}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({data.todayMetrics.completedTasks}/{data.todayMetrics.totalTasks} Görev)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              {isBeforeStart ? "Plan hazırlık dönemi" : "Bugünün zorunlu dersleri"}
            </span>
          </div>
        </div>

        {/* KPI 2: Tamamlanmayı Bekleyenler */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Geciken Görevler</span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                data.todayMetrics.overdueTasksCount > 0
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {data.todayMetrics.overdueTasksCount > 0 ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
          </div>
          <div>
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
              <span className="text-xs text-slate-400 font-medium">görev bekliyor</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              {data.todayMetrics.overdueTasksCount > 0
                ? "Ertelenmesi gereken görev var"
                : "Plan takvimi güncel"}
            </span>
          </div>
        </div>

        {/* KPI 3: 30 Günlük Tutarlılık */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>30 Günlük Tutarlılık</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                %{data.consistency30d}
              </span>
              <span className="text-xs text-slate-400 font-medium">uygun gün oranı</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">Düzenli çalışma skoru</span>
          </div>
        </div>

        {/* KPI 4: Toplam Çözülen Soru */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Toplam Soru</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {data.totalQuestionsSolved}
              </span>
              <span className="text-xs text-slate-400 font-medium">çözülen soru</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">Standart ve konu soruları</span>
          </div>
        </div>
      </div>

      {/* Benchmark 20 & Overdue Workload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Benchmark 20 Averages */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                20 Soruluk Rutin Hız ve Doğruluk
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                İleri sayımlı standart ölçüm blokları ortalaması
              </p>
            </div>
            <Link
              href="/analiz"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Detaylı Analiz</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {/* Math */}
            <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  Matematik Rutin (İlk 20 Soru)
                </span>
                <span className="font-semibold text-blue-700 dark:text-blue-300">
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

            {/* Paragraph */}
            <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                  Paragraf Rutin (İlk 20 Soru)
                </span>
                <span className="font-semibold text-indigo-700 dark:text-indigo-300">
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
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ertelenmeyi Bekleyen Görevler ({data.overdueTasks.length})
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Gününde tamamlanmayan ve plan yönetimi gereken işler
                </p>
              </div>
              <Link
                href="/admin/plan"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>Plan Yönetimi</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {data.overdueTasks.map((ot) => (
                <div
                  key={ot.id}
                  className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {ot.title}
                    </div>
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                      Tarih: {ot.currentDate} {ot.subjectName && `• ${ot.subjectName}`}
                    </div>
                  </div>
                  {adult.role !== "viewer" && (
                    <Link
                      href={`/admin/plan?taskId=${ot.id}`}
                      className="shrink-0 px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 font-semibold hover:bg-amber-100 transition-colors text-[11px]"
                    >
                      Ertele
                    </Link>
                  )}
                </div>
              ))}

              {data.overdueTasks.length === 0 && (
                <div className="py-10 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-80" />
                  <span>Geciken görev bulunmuyor. Plan takvimi güncel!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mistake Categories & Recent Audit Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Mistake Categories */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Yanlış Nedenleri Dağılımı
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Öğrencinin bildirdiği hata nedenleri
              </p>
            </div>
            <Link
              href="/admin/yanlislar"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Havuzu İncele</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {data.mistakeBreakdown.map((mb) => {
              const reasonInfo = REASON_LABELS[mb.reason] || {
                label: mb.reason.replace("_", " "),
                color: "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
              };

              return (
                <div
                  key={mb.reason}
                  className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-md border text-[11px] ${reasonInfo.color}`}
                  >
                    {reasonInfo.label}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {mb.count} soru ({mb.openCount} açık)
                  </span>
                </div>
              );
            })}

            {data.mistakeBreakdown.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-500">
                Kayıtlı yanlış analiz verisi bulunmuyor.
              </div>
            )}
          </div>
        </div>

        {/* Audit Log (Plan Mutations) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Son Plan Değişiklikleri
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Takvimde yapılan erteleme ve düzenleme geçmişi
            </p>
          </div>

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
              <div className="py-8 text-center text-xs text-slate-500">
                Henüz plan erteleme veya iptal kaydı bulunmuyor.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yusuf'un Çalışma Notları & Eksikleri Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {studentName}&apos;un Çalışma Günlüğü, Eksikleri ve Gelecek Planları
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {data.studentNotes.length} Not
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {studentName}&apos;un planda geri kaldığı telafi konuları, ekstra zaman ayıracağı dersler ve çalışma hedefleri.
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
              {studentName} henüz bir çalışma notu veya telafi kaydı eklemedi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
