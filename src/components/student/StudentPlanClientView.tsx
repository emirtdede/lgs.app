"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  RotateCcw,
  MapPin,
  Target,
  FileText,
  Check,
  CalendarRange,
} from "lucide-react";
import { formatIstanbulLongDate } from "@/domain/time-utils";

export interface PlanDayItem {
  id: string;
  plan_date: string;
  day_number: number;
  week_number: number;
  phase: string;
}

interface StudentPlanClientViewProps {
  days: PlanDayItem[];
}

type PhaseFilter = "all" | "phase1" | "phase2" | "phase3";

const STORAGE_KEY = "lgs_plan_preferences_v1";

const PHASE_LABELS: Record<PhaseFilter, string> = {
  all: "Tüm Günler (256 Gün)",
  phase1: "1. Dönem: Temel Kurma (1-90)",
  phase2: "2. Dönem: Pekiştirme (91-195)",
  phase3: "Deneme Dönemi: 60 Deneme (196-256)",
};

const PHASE_SHORT_LABELS: Record<PhaseFilter, string> = {
  all: "Tüm Dönemler",
  phase1: "1. Dönem",
  phase2: "2. Dönem",
  phase3: "Denemeler",
};

const DATE_PRESETS = [
  { label: "1. Ay (Ekim)", start: "2026-10-01", end: "2026-10-31" },
  { label: "2. Ay (Kasım)", start: "2026-11-01", end: "2026-11-30" },
  { label: "3. Ay (Aralık)", start: "2026-12-01", end: "2026-12-31" },
  { label: "Ocak 2027", start: "2027-01-01", end: "2027-01-31" },
  { label: "1. Dönem (1-90)", start: "2026-10-01", end: "2026-12-29" },
  { label: "Denemeler (60 Deneme)", start: "2027-04-14", end: "2027-06-12" },
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

export function StudentPlanClientView({ days }: StudentPlanClientViewProps) {
  const [activeFilter, setActiveFilter] = useState<PhaseFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPhaseMenuOpen, setIsPhaseMenuOpen] = useState(false);
  const [isDatePanelOpen, setIsDatePanelOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore user preferences on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.phase && ["all", "phase1", "phase2", "phase3"].includes(parsed.phase)) {
          setActiveFilter(parsed.phase);
        }
        if (typeof parsed.startDate === "string") setStartDate(parsed.startDate);
        if (typeof parsed.endDate === "string") setEndDate(parsed.endDate);
        if (typeof parsed.search === "string") setSearchQuery(parsed.search);
      }
    } catch {
      // ignore JSON parse error
    }
    setIsHydrated(true);
  }, []);

  // Save user preferences on change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          phase: activeFilter,
          startDate,
          endDate,
          search: searchQuery,
        })
      );
    } catch {
      // ignore storage quota error
    }
  }, [isHydrated, activeFilter, startDate, endDate, searchQuery]);

  const resetDateRange = () => {
    setStartDate("");
    setEndDate("");
  };

  const resetAllFilters = () => {
    setActiveFilter("all");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const filteredDays = useMemo(() => {
    return days.filter((d) => {
      // Phase filtering
      if (activeFilter === "phase1" && d.day_number > 90) return false;
      if (activeFilter === "phase2" && (d.day_number <= 90 || d.day_number > 195)) return false;
      if (activeFilter === "phase3" && d.day_number <= 195) return false;

      // Date range filtering
      if (startDate && d.plan_date < startDate) return false;
      if (endDate && d.plan_date > endDate) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesDate = d.plan_date.toLowerCase().includes(q);
        const matchesDay = `gün ${d.day_number}`.includes(q) || `${d.day_number}` === q;
        const matchesWeek = `hafta ${d.week_number}`.includes(q);
        const matchesPhase = d.phase.toLowerCase().includes(q);
        const matchesLongDate = formatIstanbulLongDate(d.plan_date).toLowerCase().includes(q);
        return matchesDate || matchesDay || matchesWeek || matchesPhase || matchesLongDate;
      }

      return true;
    });
  }, [days, activeFilter, startDate, endDate, searchQuery]);

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
    activeFilter !== "all" || startDate || endDate || searchQuery.trim()
  );

  const scrollToDate = (dateStr: string) => {
    // If filtered out, auto-expand filters so target day is visible
    if (dateStr >= "2027-04-14") {
      if (activeFilter !== "all" && activeFilter !== "phase3") setActiveFilter("all");
    } else if (dateStr > "2027-01-01") {
      if (activeFilter !== "all" && activeFilter !== "phase2") setActiveFilter("all");
    } else {
      if (activeFilter !== "all" && activeFilter !== "phase1") setActiveFilter("all");
    }

    if ((startDate && dateStr < startDate) || (endDate && dateStr > endDate)) {
      setStartDate("");
      setEndDate("");
    }

    setTimeout(() => {
      const el = document.getElementById(`plan-day-${dateStr}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-blue-500");
        setTimeout(() => el.classList.remove("ring-2", "ring-blue-500"), 2000);
      }
    }, 100);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 1. APPLE MINIMALIST HEADER */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate whitespace-nowrap">
            Çalışma Takvimi
          </h1>
          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal truncate whitespace-nowrap hidden xs:inline">
            • 256 Gün • 60 Deneme
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
          {filteredDays.length === days.length
            ? `${days.length} Gün`
            : `${filteredDays.length} / ${days.length} Gün`}
        </span>
      </div>

      {/* 2. DYNAMIC & RESPONSIVE MILESTONES QUICK JUMP BAR (NEVER OVERFLOWS) */}
      <div className="grid grid-cols-3 gap-1.5 mb-3 w-full">
        <button
          type="button"
          onClick={() => scrollToDate("2026-10-01")}
          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors font-semibold text-[11px] min-w-0"
          title="1 Ekim 2026 Başlangıç"
        >
          <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
          <span className="truncate">1 Eki<span className="hidden sm:inline"> Başlangıç</span></span>
        </button>
        <button
          type="button"
          onClick={() => scrollToDate("2027-04-13")}
          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors font-semibold text-[11px] min-w-0"
          title="13 Nisan 2027 Konu Bitiş"
        >
          <Target className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="truncate">13 Nis<span className="hidden sm:inline"> Bitiş</span></span>
        </button>
        <button
          type="button"
          onClick={() => scrollToDate("2027-04-14")}
          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors font-semibold text-[11px] min-w-0"
          title="14 Nisan 2027 Denemeler"
        >
          <FileText className="w-3 h-3 text-emerald-500 shrink-0" />
          <span className="truncate">14 Nis<span className="hidden sm:inline"> Deneme</span></span>
        </button>
      </div>

      {/* 3. UNIFIED SEARCH & FILTER CONTROLS */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 w-full">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tarih veya gün ara..."
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
            setIsPhaseMenuOpen(false);
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

        {/* TEK DÖNEM FİLTRE BUTONU */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsPhaseMenuOpen(!isPhaseMenuOpen);
              setIsDatePanelOpen(false);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              activeFilter === "all"
                ? "bg-slate-100 dark:bg-slate-800/80 border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                : "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-xs"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{PHASE_SHORT_LABELS[activeFilter]}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isPhaseMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsPhaseMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-60 sm:w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Dönem Filtresi
                </div>

                {(["all", "phase1", "phase2", "phase3"] as PhaseFilter[]).map((pKey) => {
                  const isSelected = activeFilter === pKey;
                  return (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => {
                        setActiveFilter(pKey);
                        setIsPhaseMenuOpen(false);
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
                        <span>{PHASE_LABELS[pKey]}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. EXPANDABLE DATE RANGE FILTER PANEL */}
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

      {/* 5. ACTIVE FILTER BAR (WITH INSTANT RESET) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 mb-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {filteredDays.length} Gün listeleniyor
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

            {activeFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px]">
                <span>{PHASE_SHORT_LABELS[activeFilter]}</span>
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className="hover:text-black dark:hover:text-white"
                  title="Dönem filtresini kaldır"
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

      {/* 6. PLAN DAY CARDS */}
      <div className="space-y-2.5">
        {filteredDays.map((d) => {
          const isMockPeriod = d.plan_date >= "2027-04-14" && d.plan_date <= "2027-06-12";
          const isExamDay = d.plan_date === "2027-06-13";
          const isDeadlineDay = d.plan_date === "2027-04-13";

          return (
            <Link
              key={d.id}
              id={`plan-day-${d.plan_date}`}
              href={`/today?date=${d.plan_date}`}
              className={`block p-4 rounded-2xl border transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isExamDay
                  ? "bg-purple-50/80 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800"
                  : isDeadlineDay
                    ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
                    : isMockPeriod
                      ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      Hafta {d.week_number} • Gün {d.day_number}
                    </span>
                    {isDeadlineDay && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                        Konu Bitirme Hedefi
                      </span>
                    )}
                    {isMockPeriod && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        Deneme {d.day_number - 195}/60
                      </span>
                    )}
                    {isExamDay && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                        Geçici Sınav Günü
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {formatIstanbulLongDate(d.plan_date)}
                  </h2>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {d.phase}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        {filteredDays.length === 0 && (
          <div className="py-12 px-4 text-center bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Arama kriterlerinize uygun çalışma günü bulunamadı.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Farklı bir tarih aralığı veya arama terimi deneyebilirsin.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
