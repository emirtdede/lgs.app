"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Navigation, Rocket, Flag } from "lucide-react";
import { formatIstanbulLongDate } from "@/domain/time-utils";

export interface AdultCalendarDay {
  id: string;
  plan_date: string;
  day_number: number;
  week_number: number;
  phase: string;
}

export interface AdultCalendarTask {
  id: string;
  current_plan_day_id: string;
  title: string;
  task_type: string;
  required: boolean;
  subject_name?: string;
  status: string;
}

interface AdultCalendarClientViewProps {
  days: AdultCalendarDay[];
  tasks: AdultCalendarTask[];
  adultRole: string;
  todayDate: string;
}

type PhaseFilter = "all" | "phase1" | "phase2" | "phase3";

export function AdultCalendarClientView({
  days,
  tasks,
  adultRole,
  todayDate,
}: AdultCalendarClientViewProps) {
  const [activeFilter, setActiveFilter] = useState<PhaseFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const tasksByDay = useMemo(() => {
    const map = new Map<string, AdultCalendarTask[]>();
    for (const t of tasks) {
      const list = map.get(t.current_plan_day_id) || [];
      list.push(t);
      map.set(t.current_plan_day_id, list);
    }
    return map;
  }, [tasks]);

  const filteredDays = useMemo(() => {
    return days.filter((d) => {
      // Phase filter
      if (activeFilter === "phase1" && d.day_number > 90) return false;
      if (activeFilter === "phase2" && (d.day_number <= 90 || d.day_number > 195)) return false;
      if (activeFilter === "phase3" && d.day_number <= 195) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesDate = d.plan_date.toLowerCase().includes(q);
        const matchesDay = `gün ${d.day_number}`.includes(q) || `${d.day_number}` === q;
        const matchesWeek = `hafta ${d.week_number}`.includes(q);
        const matchesPhase = d.phase.toLowerCase().includes(q);
        const matchesLongDate = formatIstanbulLongDate(d.plan_date).toLowerCase().includes(q);

        // Also search in day's tasks
        const dayTasks = tasksByDay.get(d.id) || [];
        const matchesTask = dayTasks.some(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            (t.subject_name?.toLowerCase().includes(q) ?? false)
        );

        return (
          matchesDate || matchesDay || matchesWeek || matchesPhase || matchesLongDate || matchesTask
        );
      }

      return true;
    });
  }, [days, activeFilter, searchQuery, tasksByDay]);

  const scrollToDate = (dateStr: string) => {
    if (dateStr >= "2027-04-14") {
      if (activeFilter !== "all" && activeFilter !== "phase3") setActiveFilter("all");
    } else if (dateStr > "2027-01-01") {
      if (activeFilter !== "all" && activeFilter !== "phase2") setActiveFilter("all");
    } else {
      if (activeFilter !== "all" && activeFilter !== "phase1") setActiveFilter("all");
    }

    setTimeout(() => {
      const el = document.getElementById(`calendar-day-${dateStr}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-blue-500");
        setTimeout(() => el.classList.remove("ring-2", "ring-blue-500"), 2000);
      }
    }, 100);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Çalışma Takvimi</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            LGS 2027 plan günleri, haftalık fazlar ve planlanmış görev dağılımı (256 Gün • 2.947 Görev).
          </p>
        </div>

        {/* Quick Jump Buttons (Responsive 3-Column on Mobile) */}
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
          <button
            type="button"
            onClick={() => scrollToDate(todayDate)}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 min-h-[44px] transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Bugüne Git ({todayDate})</span>
            <span className="sm:hidden">Bugün</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToDate("2026-10-01")}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 min-h-[44px] transition-colors"
          >
            <Rocket className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
            <span className="hidden sm:inline">1 Ekim Başlangıcına Git</span>
            <span className="sm:hidden">1 Ekim</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToDate("2027-04-13")}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 min-h-[44px] transition-colors"
          >
            <Flag className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span className="hidden sm:inline">13 Nisan Konu Bitişine Git</span>
            <span className="sm:hidden">13 Nisan</span>
          </button>
        </div>

        {/* Phase Filter Tabs (2x2 grid on mobile, row on desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all min-h-[44px] text-center ${
              activeFilter === "all"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Tüm Günler ({days.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("phase1")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all min-h-[44px] text-center ${
              activeFilter === "phase1"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <span className="hidden sm:inline">1. Dönem: Temel Kurma (1-90)</span>
            <span className="sm:hidden">1. Dönem (1-90)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("phase2")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all min-h-[44px] text-center ${
              activeFilter === "phase2"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <span className="hidden sm:inline">2. Dönem: Pekiştirme (91-195)</span>
            <span className="sm:hidden">2. Dönem (91-195)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("phase3")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all min-h-[44px] text-center ${
              activeFilter === "phase3"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <span className="hidden sm:inline">Deneme Dönemi: 60 Deneme (196-256)</span>
            <span className="sm:hidden">60 Deneme (196-256)</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tarih, gün, konu veya ders ara..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      {/* Calendar List */}
      <div className="space-y-4">
        {filteredDays.map((day) => {
          const dayTasks = tasksByDay.get(day.id) || [];
          const isToday = day.plan_date === todayDate;

          return (
            <div
              key={day.id}
              id={`calendar-day-${day.plan_date}`}
              className={`p-4 rounded-2xl border transition-all ${
                isToday
                  ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 shadow-xs"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {formatIstanbulLongDate(day.plan_date)}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      Bugün
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500">
                    (Hafta {day.week_number} • Gün {day.day_number})
                  </span>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 self-start sm:self-auto">
                  {day.phase}
                </span>
              </div>

              {/* Tasks in day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {dayTasks.map((t) => {
                  const isCompleted = t.status === "completed";
                  const isCancelled = t.status === "cancelled";
                  const s = (t.subject_name || "").toLowerCase();
                  const kind = (t.task_type || "").toLowerCase();

                  // Subject-specific accents
                  let cardStyle = "border-l-2 border-l-slate-300 dark:border-l-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300";
                  let badgeStyle = "bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400";

                  if (s.includes("matematik")) {
                    cardStyle = "border-l-4 border-l-blue-500 bg-blue-50/40 dark:bg-blue-950/20 text-slate-800 dark:text-slate-200";
                    badgeStyle = "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300";
                  } else if (s.includes("türkçe")) {
                    cardStyle = "border-l-4 border-l-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-slate-800 dark:text-slate-200";
                    badgeStyle = "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300";
                  } else if (s.includes("fen")) {
                    cardStyle = "border-l-4 border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200";
                    badgeStyle = "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300";
                  } else if (s.includes("inkılap") || s.includes("tarih")) {
                    cardStyle = "border-l-4 border-l-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-slate-800 dark:text-slate-200";
                    badgeStyle = "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300";
                  } else if (s.includes("din")) {
                    cardStyle = "border-l-4 border-l-teal-500 bg-teal-50/40 dark:bg-teal-950/20 text-slate-800 dark:text-slate-200";
                    badgeStyle = "bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300";
                  } else if (s.includes("ingilizce")) {
                    cardStyle = "border-l-4 border-l-sky-500 bg-sky-50/40 dark:bg-sky-950/20 text-slate-800 dark:text-slate-200";
                    badgeStyle = "bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300";
                  } else if (kind === "reading") {
                    cardStyle = "border-l-4 border-l-violet-500 bg-violet-50/40 dark:bg-violet-950/20 text-slate-800 dark:text-slate-200";
                    badgeStyle = "bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300";
                  }

                  if (isCompleted) {
                    cardStyle = "border-l-4 border-l-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200";
                  } else if (isCancelled) {
                    cardStyle = "border-l-2 border-l-slate-300 bg-slate-50 dark:bg-slate-900/50 text-slate-400 line-through";
                  }

                  return (
                    <div
                      key={t.id}
                      className={`p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs flex items-center justify-between gap-2 shadow-2xs ${cardStyle}`}
                    >
                      <div className="truncate flex-1">
                        <div className="font-semibold truncate">{t.title}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {t.subject_name && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${badgeStyle}`}>
                              {t.subject_name}
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              ✓ Tamamlandı
                            </span>
                          )}
                        </div>
                      </div>

                      {adultRole !== "viewer" && !isCompleted && !isCancelled && (
                        <Link
                          href={`/admin/plan?taskId=${t.id}`}
                          className="shrink-0 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline min-h-[44px] flex items-center"
                        >
                          Yönet
                        </Link>
                      )}
                    </div>
                  );
                })}

                {dayTasks.length === 0 && (
                  <p className="text-[11px] text-slate-400 py-1">Bu gün için görev bulunmuyor.</p>
                )}
              </div>
            </div>
          );
        })}

        {filteredDays.length === 0 && (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            Arama kriterlerine uygun plan günü bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
