"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatDuration, calculateElapsedSeconds } from "@/domain/time-utils";

interface BenchmarkTimerProps {
  sessionId: string;
  startedAt: string;
  taskTitle: string;
  onFinish: (sessionId: string, elapsedSeconds: number) => void;
  onCancel: (sessionId: string) => Promise<void>;
  onClose: () => void;
}

export function BenchmarkTimer({
  sessionId,
  startedAt,
  taskTitle,
  onFinish,
  onCancel,
  onClose,
}: BenchmarkTimerProps) {
  const [elapsed, setElapsed] = useState<number>(() => calculateElapsedSeconds(startedAt));
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  // Tick interval deriving elapsed time from server-persisted startedAt
  useEffect(() => {
    // Initial compute
    setElapsed(calculateElapsedSeconds(startedAt));

    const interval = setInterval(() => {
      setElapsed(calculateElapsedSeconds(startedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  const handleCancel = useCallback(async () => {
    setIsCancelling(true);
    try {
      await onCancel(sessionId);
      onClose();
    } finally {
      setIsCancelling(false);
    }
  }, [sessionId, onCancel, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="timer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 text-center">
        {/* Header & Task Title */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 mb-3">
          20 Soru • Hız & Doğruluk Ölçümü
        </span>
        <h2
          id="timer-modal-title"
          className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-2"
        >
          {taskTitle}
        </h2>

        {/* Calm Count-Up Display with Soft Pulse Ring & Glassmorphism */}
        <div className="relative my-8 py-8 px-4 bg-gradient-to-b from-blue-50/50 to-indigo-50/30 dark:from-slate-800/60 dark:to-slate-900/60 rounded-3xl border border-blue-100/80 dark:border-blue-900/40 shadow-inner overflow-hidden">
          {/* Soft ambient glowing ring */}
          <div className="absolute inset-0 bg-radial from-blue-400/10 via-transparent to-transparent pointer-events-none animate-pulse" />

          <span className="relative text-xs uppercase tracking-widest font-semibold text-blue-600 dark:text-blue-400 block mb-2">
            İleri Sayım
          </span>
          <div
            aria-live="polite"
            className="relative text-5xl md:text-6xl font-mono font-bold tracking-tight text-slate-900 dark:text-white"
          >
            {formatDuration(elapsed)}
          </div>
          <p className="relative text-xs text-slate-500 dark:text-slate-400 mt-3 max-w-xs mx-auto leading-relaxed">
            Doğallığınızı koruyarak odaklanın. Zamanlayıcı sadece kendi hızınızı gözlemlemeniz
            içindir; geri sayım veya hedef süre baskısı yoktur.
          </p>
        </div>

        {/* Action Buttons */}
        {cancelConfirm ? (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl mb-2">
            <p className="text-xs font-medium text-rose-800 dark:text-rose-300 mb-3">
              Bu ölçümü iptal etmek istediğinize emin misiniz? (Ölçüm kaydedilmeyecektir.)
            </p>
            <div className="flex gap-2 justify-center">
              <button
                disabled={isCancelling}
                onClick={handleCancel}
                className="min-h-[44px] px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                {isCancelling ? "İptal Ediliyor..." : "Evet, İptal Et"}
              </button>
              <button
                disabled={isCancelling}
                onClick={() => setCancelConfirm(false)}
                className="min-h-[44px] px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none"
              >
                Vazgeç
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onFinish(sessionId, elapsed)}
              className="flex-1 min-h-[48px] px-6 py-3 rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              Testi Bitir (20 Soru)
            </button>

            <button
              type="button"
              onClick={() => setCancelConfirm(true)}
              className="min-h-[48px] px-4 py-3 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none"
            >
              Ölçümü İptal Et
            </button>
          </div>
        )}

        {/* Refresh Resilience Hint */}
        <div className="mt-4 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 text-emerald-500 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Sayfayı yenileseniz bile süreniz kaldığı yerden devam eder.
        </div>
      </div>
    </div>
  );
}
