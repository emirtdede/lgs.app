"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Calculator,
  BookOpen,
  Search,
  Calendar,
  CalendarRange,
  SlidersHorizontal,
  ChevronDown,
  X,
  RotateCcw,
  Check,
  TrendingUp,
  Zap,
} from "lucide-react";
import { formatIstanbulLongDate } from "@/domain/time-utils";
import type { SubjectProgressSummary } from "@/domain/topic-progress";

export interface BenchmarkSessionItem {
  id: string;
  plan_date: string;
  routine: string;
  block_kind: string;
  question_count: number;
  correct_count: number;
  wrong_count: number;
  blank_count: number;
  duration_seconds: number | null;
}

export interface SubjectQuestionStatItem {
  id: number;
  name: string;
  count: number;
  correct: number;
  wrong: number;
  blank: number;
  accuracy: number;
}

export interface ProgressClientViewProps {
  totalQuestionsSolved: number;
  overallCurriculumPct: number;
  completedTopics: number;
  totalTopics: number;
  avgMathSec: number | null;
  avgParagraphSec: number | null;
  subjectQuestionStats: SubjectQuestionStatItem[];
  subjectSummaries: SubjectProgressSummary[];
  benchmarkSessions: BenchmarkSessionItem[];
}

export interface SpeedProgressResult {
  hasEnoughData: boolean;
  totalSessions: number;
  baselineSeconds: number | null;
  currentSeconds: number | null;
  diffSeconds: number | null; // positive = faster (baseline - current)
  percentChange: number | null;
  baselineAccuracy: number | null;
  currentAccuracy: number | null;
  accuracyDiff: number | null;
  secondsPerQuestionBaseline: number | null;
  secondsPerQuestionCurrent: number | null;
}

const STORAGE_KEY = "lgs_progress_preferences_v1";

const DATE_PRESETS = [
  { label: "Tüm Süreç", start: "", end: "" },
  { label: "1. Ay (Ekim)", start: "2026-10-01", end: "2026-10-31" },
  { label: "2. Ay (Kasım)", start: "2026-11-01", end: "2026-11-30" },
  { label: "3. Ay (Aralık)", start: "2026-12-01", end: "2026-12-31" },
  { label: "Ocak 2027", start: "2027-01-01", end: "2027-01-31" },
  { label: "1. Dönem (1-90)", start: "2026-10-01", end: "2026-12-29" },
  { label: "Denemeler (60 Deneme)", start: "2027-04-14", end: "2027-06-12" },
];

const ROUTINE_OPTIONS = [
  { id: "all", label: "Tüm Rutinler", fullLabel: "Tüm Rutinler (Matematik & Paragraf)" },
  { id: "math", label: "Matematik", fullLabel: "Matematik (20 Soru)" },
  { id: "paragraph", label: "Paragraf", fullLabel: "Türkçe / Paragraf (20 Soru)" },
];

function formatShortDateTr(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const month = parseInt(parts[1], 10);
  const months = [
    "Oca",
    "Şub",
    "Mar",
    "Nis",
    "May",
    "Haz",
    "Tem",
    "Ağu",
    "Eyl",
    "Eki",
    "Kas",
    "Ara",
  ];
  return `${day} ${months[month - 1] || ""}`;
}

function formatDurationTr(sec: number | null): string {
  if (sec === null || sec === undefined) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s} sn`;
  if (s === 0) return `${m} dk`;
  return `${m} dk ${s} sn`;
}

function computeSpeedProgress(sessions: BenchmarkSessionItem[]): SpeedProgressResult {
  const valid = sessions
    .filter((s) => typeof s.duration_seconds === "number" && s.duration_seconds > 0)
    .sort((a, b) => a.plan_date.localeCompare(b.plan_date));

  const n = valid.length;
  if (n === 0) {
    return {
      hasEnoughData: false,
      totalSessions: 0,
      baselineSeconds: null,
      currentSeconds: null,
      diffSeconds: null,
      percentChange: null,
      baselineAccuracy: null,
      currentAccuracy: null,
      accuracyDiff: null,
      secondsPerQuestionBaseline: null,
      secondsPerQuestionCurrent: null,
    };
  }

  if (n === 1) {
    const single = valid[0];
    const dur = single.duration_seconds!;
    const acc = Math.round((single.correct_count / 20) * 100);
    return {
      hasEnoughData: false,
      totalSessions: 1,
      baselineSeconds: dur,
      currentSeconds: dur,
      diffSeconds: 0,
      percentChange: 0,
      baselineAccuracy: acc,
      currentAccuracy: acc,
      accuracyDiff: 0,
      secondsPerQuestionBaseline: Math.round(dur / 20),
      secondsPerQuestionCurrent: Math.round(dur / 20),
    };
  }

  const windowSize = Math.min(3, Math.floor(n / 2) || 1);
  const earliest = valid.slice(0, windowSize);
  const latest = valid.slice(n - windowSize);

  const baselineSec = Math.round(
    earliest.reduce((sum, s) => sum + s.duration_seconds!, 0) / windowSize
  );
  const currentSec = Math.round(
    latest.reduce((sum, s) => sum + s.duration_seconds!, 0) / windowSize
  );

  const baselineAcc = Math.round(
    earliest.reduce((sum, s) => sum + (s.correct_count / 20) * 100, 0) / windowSize
  );
  const currentAcc = Math.round(
    latest.reduce((sum, s) => sum + (s.correct_count / 20) * 100, 0) / windowSize
  );

  const diffSec = baselineSec - currentSec; // positive means faster
  const percentChange = baselineSec > 0 ? Math.round((diffSec / baselineSec) * 100) : 0;
  const accuracyDiff = currentAcc - baselineAcc;

  return {
    hasEnoughData: true,
    totalSessions: n,
    baselineSeconds: baselineSec,
    currentSeconds: currentSec,
    diffSeconds: diffSec,
    percentChange,
    baselineAccuracy: baselineAcc,
    currentAccuracy: currentAcc,
    accuracyDiff,
    secondsPerQuestionBaseline: Math.round(baselineSec / 20),
    secondsPerQuestionCurrent: Math.round(currentSec / 20),
  };
}

function SpeedProgressionCard({
  title,
  icon,
  progress,
}: {
  title: string;
  routine: string;
  icon: React.ReactNode;
  progress: SpeedProgressResult;
}) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50">{icon}</div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <span className="text-[10px] text-slate-400">
              {progress.totalSessions > 0
                ? `${progress.totalSessions} Oturum Analizi`
                : "Başlangıç Takibi"}
            </span>
          </div>
        </div>

        {progress.hasEnoughData && progress.diffSeconds !== null && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              progress.diffSeconds > 0
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
            }`}
          >
            {progress.diffSeconds > 0 ? (
              <>
                <TrendingUp className="w-3 h-3" />
                <span>%{progress.percentChange} Hızlandı</span>
              </>
            ) : (
              <span>Dengeli Tempo</span>
            )}
          </span>
        )}
      </div>

      {!progress.hasEnoughData && progress.totalSessions === 0 && (
        <div className="py-4 px-2 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
          <Zap className="w-5 h-5 text-slate-400 mx-auto mb-1.5 opacity-60" />
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Henüz 20 soruluk ölçüm oturumu tamamlanmadı.
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
            1 Ekim&apos;den itibaren çözdüğün 20 soruluk bloklarla başlangıç ve günümüz hızın burada
            anlık hesaplanacaktır.
          </p>
        </div>
      )}

      {!progress.hasEnoughData && progress.totalSessions === 1 && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-500 font-medium">İlk Oturum Süresi:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {formatDurationTr(progress.baselineSeconds)} ({progress.secondsPerQuestionBaseline}{" "}
              sn/soru)
            </span>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            Hızlanma trendini karşılaştırmak için en az 2 oturum gereklidir.
          </p>
        </div>
      )}

      {progress.hasEnoughData && (
        <>
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 mb-3 text-center">
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Başlangıç</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                {formatDurationTr(progress.baselineSeconds)}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {progress.secondsPerQuestionBaseline} sn/soru
              </span>
            </div>

            <div className="border-x border-slate-200 dark:border-slate-700 px-1">
              <span className="text-[10px] text-slate-400 font-medium block">Günümüz</span>
              <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 block mt-0.5">
                {formatDurationTr(progress.currentSeconds)}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {progress.secondsPerQuestionCurrent} sn/soru
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Kazanılan Süre</span>
              <span
                className={`text-xs sm:text-sm font-bold block mt-0.5 ${
                  (progress.diffSeconds ?? 0) > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {(progress.diffSeconds ?? 0) > 0
                  ? `-${formatDurationTr(progress.diffSeconds)}`
                  : formatDurationTr(Math.abs(progress.diffSeconds ?? 0))}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {(progress.diffSeconds ?? 0) > 0 ? "hız kazancı" : "fark"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800 text-slate-500">
            <span>Doğruluk Değişimi:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              %{progress.baselineAccuracy} → %{progress.currentAccuracy}{" "}
              {progress.accuracyDiff !== null && progress.accuracyDiff !== 0 && (
                <span
                  className={
                    progress.accuracyDiff > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }
                >
                  ({progress.accuracyDiff > 0 ? "+" : ""}%{progress.accuracyDiff})
                </span>
              )}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export function ProgressClientView({
  totalQuestionsSolved,
  overallCurriculumPct,
  completedTopics,
  totalTopics,
  avgMathSec,
  avgParagraphSec,
  subjectQuestionStats,
  subjectSummaries,
  benchmarkSessions,
}: ProgressClientViewProps) {
  const [activeRoutine, setActiveRoutine] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isRoutineMenuOpen, setIsRoutineMenuOpen] = useState(false);
  const [isDatePanelOpen, setIsDatePanelOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore preferences on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.routine && ["all", "math", "paragraph"].includes(parsed.routine)) {
          setActiveRoutine(parsed.routine);
        }
        if (typeof parsed.startDate === "string") setStartDate(parsed.startDate);
        if (typeof parsed.endDate === "string") setEndDate(parsed.endDate);
        if (typeof parsed.search === "string") setSearchQuery(parsed.search);
      }
    } catch {
      // ignore
    }
    setIsHydrated(true);
  }, []);

  // Save preferences on change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          routine: activeRoutine,
          startDate,
          endDate,
          search: searchQuery,
        })
      );
    } catch {
      // ignore
    }
  }, [isHydrated, activeRoutine, startDate, endDate, searchQuery]);

  const resetDateRange = () => {
    setStartDate("");
    setEndDate("");
  };

  const resetAllFilters = () => {
    setActiveRoutine("all");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Compute speed progression from beginning to present for Math and Paragraph
  const mathBenchmarks = useMemo(
    () => benchmarkSessions.filter((s) => s.routine === "math"),
    [benchmarkSessions]
  );
  const paragraphBenchmarks = useMemo(
    () => benchmarkSessions.filter((s) => s.routine === "paragraph"),
    [benchmarkSessions]
  );

  const mathSpeedProgress = useMemo(() => computeSpeedProgress(mathBenchmarks), [mathBenchmarks]);
  const paragraphSpeedProgress = useMemo(
    () => computeSpeedProgress(paragraphBenchmarks),
    [paragraphBenchmarks]
  );

  // Filter 20-question session history
  const filteredSessions = useMemo(() => {
    return benchmarkSessions.filter((s) => {
      // Routine filter
      if (activeRoutine !== "all" && s.routine !== activeRoutine) return false;

      // Date range filter
      if (startDate && s.plan_date < startDate) return false;
      if (endDate && s.plan_date > endDate) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesDate = s.plan_date.toLowerCase().includes(q);
        const matchesRoutine =
          (s.routine === "math" && ("matematik".includes(q) || "mat".includes(q))) ||
          (s.routine === "paragraph" && ("türkçe".includes(q) || "paragraf".includes(q)));
        const accuracy = Math.round((s.correct_count / 20) * 100);
        const matchesAccuracy = `%${accuracy}`.includes(q) || `${accuracy}` === q;
        const matchesLongDate = formatIstanbulLongDate(s.plan_date).toLowerCase().includes(q);
        return matchesDate || matchesRoutine || matchesAccuracy || matchesLongDate;
      }

      return true;
    });
  }, [benchmarkSessions, activeRoutine, startDate, endDate, searchQuery]);

  const hasDateRange = Boolean(startDate || endDate);
  const dateRangeLabel = useMemo(() => {
    if (startDate && endDate) {
      return `${formatShortDateTr(startDate)} – ${formatShortDateTr(endDate)}`;
    }
    if (startDate) {
      return `${formatShortDateTr(startDate)}'den`;
    }
    if (endDate) {
      return `${formatShortDateTr(endDate)}'e`;
    }
    return "Tarih Aralığı";
  }, [startDate, endDate]);

  const hasActiveFilters = Boolean(
    activeRoutine !== "all" || startDate || endDate || searchQuery.trim()
  );

  const activeRoutineLabel =
    ROUTINE_OPTIONS.find((r) => r.id === activeRoutine)?.label ?? "Tüm Rutinler";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate whitespace-nowrap">
            Kendi Gelişimim
          </h1>
          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal truncate whitespace-nowrap hidden xs:inline">
            • Bireysel Hız & Net Takibi
          </span>
        </div>
      </div>

      {/* 2. TOP KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 block mb-1">Toplam Çözülen</span>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {totalQuestionsSolved}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">soru</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 block mb-1">Müfredat</span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
            %{overallCurriculumPct}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {completedTopics}/{totalTopics} konu
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 block mb-1">Matematik Hız</span>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {avgMathSec ? `${Math.floor(avgMathSec / 60)}d ${avgMathSec % 60}s` : "—"}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">20 soru ort.</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 block mb-1">Paragraf Hız</span>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {avgParagraphSec
              ? `${Math.floor(avgParagraphSec / 60)}d ${avgParagraphSec % 60}s`
              : "—"}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">20 soru ort.</span>
        </div>
      </div>

      {/* 3. BAŞLANGIÇTAN GÜNÜMÜZE HIZ GELİŞİMİ */}
      <div className="mb-8">
        <div className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Başlangıçtan Günümüze Hız Gelişimi
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            20 soruluk Matematik ve Paragraf rutinlerinde başlangıçtan günümüze süre kazanımı
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SpeedProgressionCard
            title="Matematik (20 Soru)"
            routine="math"
            icon={<Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            progress={mathSpeedProgress}
          />

          <SpeedProgressionCard
            title="Türkçe / Paragraf (20 Soru)"
            routine="paragraph"
            icon={<BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            progress={paragraphSpeedProgress}
          />
        </div>
      </div>

      {/* 4. DERS BAZLI SORU DAĞILIMI VE BAŞARI */}
      <div className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Ders Bazlı Soru Dağılımı ve Başarı
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {subjectQuestionStats.map((sq) => (
            <div
              key={sq.id}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
            >
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {sq.name}
              </h3>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {sq.count} <span className="text-[10px] font-normal text-slate-400">soru</span>
                </span>
                {sq.count > 0 && (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    %{sq.accuracy}
                  </span>
                )}
              </div>
              {sq.count > 0 ? (
                <p className="text-[10px] text-slate-400 mt-1">
                  {sq.correct} D • {sq.wrong} Y • {sq.blank} B
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">Henüz soru çözülmedi</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. DERS VE KONU HAKİMİYETİ */}
      <div className="mb-8 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Ders ve Konu Hakimiyeti
        </h2>
        <div className="space-y-3">
          {subjectSummaries.map((subj) => (
            <div key={subj.subjectId} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {subj.subjectName}
                </span>
                <span className="text-slate-500">
                  %{subj.completionPercentage} ({subj.completedTopics}/{subj.totalTopics} Konu)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${subj.completionPercentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. 20 SORULUK HIZ & DOĞRULUK GEÇMİŞİ (TÜM SÜREÇ + TARİH ARALIĞI & ARAMA) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              20 Soruluk Hız & Doğruluk Geçmişi
            </h2>
            <p className="text-[11px] text-slate-400">
              {filteredSessions.length === benchmarkSessions.length
                ? `Tüm Süreç • Toplam ${benchmarkSessions.length} Oturum`
                : `${filteredSessions.length} / ${benchmarkSessions.length} Oturum Listeleniyor`}
            </p>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Yalnızca 20 soruluk standart bloklar
          </span>
        </div>

        {/* Unified Search & Filter Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 w-full">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tarih veya rutin ara..."
              className="w-full pl-9 pr-7 py-2 bg-slate-100 dark:bg-slate-800/60 border border-transparent focus:border-blue-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tarih Aralığı Butonu */}
          <button
            type="button"
            onClick={() => {
              setIsDatePanelOpen(!isDatePanelOpen);
              setIsRoutineMenuOpen(false);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all border shrink-0 max-w-[140px] sm:max-w-none ${
              hasDateRange
                ? "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800/80 border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            title="Tarih Aralığı Filtresi"
          >
            <CalendarRange className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="hidden sm:inline truncate">{dateRangeLabel}</span>
            <span className="sm:hidden truncate">{hasDateRange ? dateRangeLabel : "Tarih"}</span>
            {hasDateRange && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  resetDateRange();
                }}
                className="hover:bg-blue-200/50 dark:hover:bg-blue-900/60 rounded-full p-0.5 shrink-0"
                title="Tarih aralığını sıfırla"
              >
                <X className="w-3 h-3" />
              </span>
            )}
          </button>

          {/* TEK RUTİN / DERS FİLTRE BUTONU */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsRoutineMenuOpen(!isRoutineMenuOpen);
                setIsDatePanelOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                activeRoutine === "all"
                  ? "bg-slate-100 dark:bg-slate-800/80 border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  : "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-xs"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{activeRoutineLabel}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isRoutineMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsRoutineMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-60 sm:w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    Rutin Filtresi
                  </div>

                  {ROUTINE_OPTIONS.map((opt) => {
                    const isSelected = activeRoutine === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setActiveRoutine(opt.id);
                          setIsRoutineMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{opt.fullLabel}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Expandable Date Range Filter Panel */}
        {isDatePanelOpen && (
          <div className="mb-3 p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Tarih Aralığı Seç</span>
              </span>
              {hasDateRange && (
                <button
                  type="button"
                  onClick={resetDateRange}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Tarihi Sıfırla</span>
                </button>
              )}
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Başlangıç Tarihi:
                </label>
                <input
                  type="date"
                  value={startDate}
                  min="2026-10-01"
                  max="2027-06-13"
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:[color-scheme:dark] [color-scheme:light]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Bitiş Tarihi:
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || "2026-10-01"}
                  max="2027-06-13"
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:[color-scheme:dark] [color-scheme:light]"
                />
              </div>
            </div>

            {/* Quick Date Presets */}
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                Hızlı Seçenekler
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DATE_PRESETS.map((preset) => {
                  const isActive = startDate === preset.start && endDate === preset.end;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setStartDate(preset.start);
                        setEndDate(preset.end);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white font-semibold shadow-xs"
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 mb-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {filteredSessions.length} Oturum listeleniyor
              </span>

              {hasDateRange && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-[11px]">
                  <span>📅 {dateRangeLabel}</span>
                  <button
                    type="button"
                    onClick={resetDateRange}
                    className="hover:text-blue-900 dark:hover:text-white"
                    title="Tarih filtresini kaldır"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {activeRoutine !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px]">
                  <span>{activeRoutineLabel}</span>
                  <button
                    type="button"
                    onClick={() => setActiveRoutine("all")}
                    className="hover:text-black dark:hover:text-white"
                    title="Rutin filtresini kaldır"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px]">
                  <span>&ldquo;{searchQuery}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="hover:text-black dark:hover:text-white"
                    title="Aramayı kaldır"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0 ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Tümünü Sıfırla</span>
            </button>
          </div>
        )}

        {/* Sessions List */}
        <div className="space-y-2.5">
          {filteredSessions.map((s) => {
            const accuracy = Math.round((s.correct_count / 20) * 100);
            const isMath = s.routine === "math";

            return (
              <div
                key={s.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span
                    className={`font-bold flex items-center gap-1.5 ${
                      isMath
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-indigo-600 dark:text-indigo-400"
                    }`}
                  >
                    {isMath ? (
                      <Calculator className="w-3.5 h-3.5" />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5" />
                    )}
                    <span>{isMath ? "Matematik" : "Türkçe Paragraf"} • 20 Soru</span>
                  </span>
                  <span className="text-slate-400 font-medium">
                    {formatIstanbulLongDate(s.plan_date)}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {s.correct_count} Doğru, {s.wrong_count} Yanlış, {s.blank_count} Boş
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold">
                      %{accuracy}
                    </span>
                  </div>

                  {s.duration_seconds && (
                    <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                      {Math.floor(s.duration_seconds / 60)} dk {s.duration_seconds % 60} sn
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredSessions.length === 0 && (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              {benchmarkSessions.length === 0 ? (
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Henüz tamamlanmış 20 soruluk hız ve doğruluk oturumu bulunmuyor.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    1 Ekim&apos;den itibaren günlük Matematik ve Paragraf 20 soru rutinlerini
                    tamamladıkça oturumların burada listelenecektir.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Arama kriterlerinize uygun oturum bulunamadı.
                  </p>
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all"
                  >
                    Filtreleri Sıfırla
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
