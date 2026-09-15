"use client";

import React, { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { formatDuration, calculateElapsedSeconds } from "@/domain/time-utils";
import type { StudentTodayTask, ActiveReadingSession } from "@/domain/student-today";

interface ReadingBlockProps {
  readingTask: StudentTodayTask | null;
  isUnlocked: boolean;
  lockReason?: string;
  activeReadingSession: ActiveReadingSession | null;
  onStartReading: (title?: string) => Promise<void>;
  onFinishReading: (sessionId: string, pagesRead?: number, notes?: string) => Promise<void>;
}

export function ReadingBlock({
  readingTask,
  isUnlocked,
  lockReason,
  activeReadingSession,
  onStartReading,
  onFinishReading,
}: ReadingBlockProps) {
  const [bookTitle, setBookTitle] = useState("");
  const [pagesRead, setPagesRead] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Timer tick if reading session is active
  useEffect(() => {
    if (!activeReadingSession) return;
    setElapsed(calculateElapsedSeconds(activeReadingSession.startedAt));

    const interval = setInterval(() => {
      setElapsed(calculateElapsedSeconds(activeReadingSession.startedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeReadingSession]);

  const handleStart = async () => {
    setIsSubmitting(true);
    try {
      await onStartReading(bookTitle || undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    if (!activeReadingSession) return;
    setIsSubmitting(true);
    try {
      await onFinishReading(
        activeReadingSession.sessionId,
        pagesRead || undefined,
        notes || undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        !isUnlocked
          ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
          : "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-xs"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {readingTask?.title ?? "Serbest Kitap Okuma"}
          </h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          Opsiyonel
        </span>
      </div>

      {!isUnlocked ? (
        /* Locked State */
        <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
          <svg
            className="w-5 h-5 text-slate-400 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="leading-relaxed">
            {lockReason ??
              "Günün tüm ders hedefleri tamamlandığında serbest kitap okuma açılacaktır."}
          </p>
        </div>
      ) : activeReadingSession ? (
        /* Active Reading Session */
        <div className="mt-3 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 text-center">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
              Okuma Oturumu Devam Ediyor
            </span>
            {activeReadingSession.bookTitle && (
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                «{activeReadingSession.bookTitle}»
              </p>
            )}
            <div className="text-3xl font-mono font-bold text-slate-900 dark:text-slate-100">
              {formatDuration(elapsed)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="reading-pages"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Okunan Sayfa Sayısı (Opsiyonel)
              </label>
              <input
                id="reading-pages"
                type="number"
                min="0"
                value={pagesRead || ""}
                placeholder="Örn: 25"
                onChange={(e) => setPagesRead(Math.max(0, parseInt(e.target.value || "0", 10)))}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
              />
            </div>
            <div>
              <label
                htmlFor="reading-notes"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Kısa Not (Opsiyonel)
              </label>
              <input
                id="reading-notes"
                type="text"
                value={notes}
                placeholder="Örn: Bölüm 4 bitti"
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          <button
            onClick={handleFinish}
            disabled={isSubmitting}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {isSubmitting ? "Kaydediliyor..." : "Okumayı Tamamla"}
          </button>
        </div>
      ) : (
        /* Unlocked & Ready to Start */
        <div className="mt-3 space-y-3">
          <p className="text-xs text-emerald-800 dark:text-emerald-300">
            Tebrikler, bugünün tüm ders hedeflerini tamamladınız! Şimdi dilediğiniz kitabı serbestçe
            okuyabilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Kitap adı (opsiyonel)"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              className="flex-1 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
            />
            <button
              onClick={handleStart}
              disabled={isSubmitting}
              className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {isSubmitting ? "Başlatılıyor..." : "Okumayı Başlat"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
