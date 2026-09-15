"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface TodayHeaderProps {
  studentName: string;
  formattedDate: string;
  totalRequired: number;
  completedRequired: number;
  percent: number;
  planDate?: string;
  realTodayDate?: string;
  dayNumber?: number | null;
  phase?: string | null;
  prevDate?: string | null;
  nextDate?: string | null;
  isPlanStartFallback?: boolean;
  onNavigateDate?: (date: string | null) => void;
}

export function TodayHeader({
  studentName,
  formattedDate,
  totalRequired,
  completedRequired,
  percent,
  planDate,
  realTodayDate,
  dayNumber,
  phase,
  prevDate,
  nextDate,
  isPlanStartFallback,
  onNavigateDate,
}: TodayHeaderProps) {
  const datePickerRef = useRef<HTMLInputElement>(null);

  const isNavigatedAway = Boolean(
    planDate && realTodayDate && planDate !== realTodayDate && !isPlanStartFallback
  );

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:py-3.5">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs flex-shrink-0 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/icon-192.png"
                alt="Uygulama Logosu"
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Merhaba, {studentName}
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {formattedDate}
              </p>
            </div>
          </div>
          <div className="text-right">
            {totalRequired > 0 ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                %{percent} Tamamlandı
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Hazırlık Dönemi
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar or Status Note */}
        {totalRequired > 0 ? (
          <div className="mt-3">
            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
              <span>Günün Hedefleri</span>
              <span>
                {completedRequired} / {totalRequired} görev
              </span>
            </div>
            <div
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Günlük hedef tamamlama oranı"
            >
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
            <span>Bugün için henüz planlanmış ders görevi yok.</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              1 Ekim Başlangıcı
            </span>
          </div>
        )}

        {/* Minimal Apple-style Day Navigation Bar */}
        {onNavigateDate && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-1">
            {/* Previous Day Button */}
            <button
              type="button"
              onClick={() => prevDate && onNavigateDate(prevDate)}
              disabled={!prevDate}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90 disabled:opacity-20 disabled:pointer-events-none"
              aria-label="Önceki Gün"
              title={prevDate ? `Önceki Gün (${prevDate})` : "Daha önceki gün yok"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Center: Single-line Minimal Day & Date Indicator */}
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={() => datePickerRef.current?.showPicker?.()}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 transition-colors"
                title="Tarih seçmek için tıkla"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{dayNumber ? `${dayNumber}. Gün` : formattedDate}</span>

                {isPlanStartFallback ? (
                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 shrink-0">
                    • 1 Ekim (Önizleme)
                  </span>
                ) : !isNavigatedAway ? (
                  <span className="hidden xs:inline text-[11px] font-normal text-slate-400 dark:text-slate-500 shrink-0">
                    • Bugün
                  </span>
                ) : null}
              </button>

              {isNavigatedAway && (
                <button
                  type="button"
                  onClick={() => onNavigateDate(null)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shrink-0"
                  title={`Bugüne dön (${realTodayDate})`}
                >
                  Bugüne Dön
                </button>
              )}

              {phase && !isPlanStartFallback && (
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium shrink-0">
                  {phase}
                </span>
              )}

              <input
                ref={datePickerRef}
                type="date"
                value={planDate ?? ""}
                min="2026-10-01"
                max="2027-06-13"
                onChange={(e) => e.target.value && onNavigateDate(e.target.value)}
                className="sr-only"
                aria-label="Tarih seç"
              />
            </div>

            {/* Next Day Button */}
            <button
              type="button"
              onClick={() => nextDate && onNavigateDate(nextDate)}
              disabled={!nextDate}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90 disabled:opacity-20 disabled:pointer-events-none"
              aria-label="Sonraki Gün"
              title={nextDate ? `Sonraki Gün (${nextDate})` : "Daha sonraki gün yok"}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
