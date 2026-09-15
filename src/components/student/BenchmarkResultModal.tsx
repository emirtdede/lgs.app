"use client";

import React, { useState } from "react";
import { formatDuration } from "@/domain/time-utils";
import { validateBenchmarkResult, calculateBenchmarkMetrics } from "@/domain/benchmark";

interface BenchmarkResultModalProps {
  sessionId: string;
  durationSeconds: number;
  taskTitle: string;
  onSubmit: (correct: number, wrong: number, blank: number) => Promise<void>;
  onClose: () => void;
}

export function BenchmarkResultModal({
  durationSeconds,
  taskTitle,
  onSubmit,
  onClose,
}: BenchmarkResultModalProps) {
  const [correct, setCorrect] = useState<number>(20);
  const [wrong, setWrong] = useState<number>(0);
  const [blank, setBlank] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validation = validateBenchmarkResult({ correct, wrong, blank });
  const total = correct + wrong + blank;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isValid) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit(correct, wrong, blank);
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Kayıt sırasında bir hata oluştu.");
      setIsSubmitting(false);
    }
  };

  // Preview metrics if valid
  let metricsPreview = null;
  if (validation.isValid) {
    try {
      metricsPreview = calculateBenchmarkMetrics(durationSeconds, { correct, wrong, blank });
    } catch {
      metricsPreview = null;
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="benchmark-result-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
            Sonuç Girişi
          </span>
          <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
            Süre: {formatDuration(durationSeconds)}
          </span>
        </div>

        <h2
          id="benchmark-result-title"
          className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1"
        >
          {taskTitle}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Hız ve gelişim grafiğiniz için lütfen 20 sorunun doğru, yanlış ve boş sayılarını girin.
        </p>

        {errorMessage && (
          <div
            role="alert"
            className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-900"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Doğru */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-900">
              <label
                htmlFor="input-correct"
                className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1"
              >
                Doğru
              </label>
              <input
                id="input-correct"
                type="number"
                min="0"
                max="20"
                value={correct}
                onChange={(e) => setCorrect(Math.max(0, parseInt(e.target.value || "0", 10)))}
                className="w-full text-center text-xl font-bold bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
              />
            </div>

            {/* Yanlış */}
            <div className="bg-rose-50/70 dark:bg-rose-950/30 p-3 rounded-2xl border border-rose-200 dark:border-rose-900">
              <label
                htmlFor="input-wrong"
                className="block text-xs font-bold text-rose-800 dark:text-rose-300 mb-1"
              >
                Yanlış
              </label>
              <input
                id="input-wrong"
                type="number"
                min="0"
                max="20"
                value={wrong}
                onChange={(e) => setWrong(Math.max(0, parseInt(e.target.value || "0", 10)))}
                className="w-full text-center text-xl font-bold bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-xl py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none min-h-[44px]"
              />
            </div>

            {/* Boş */}
            <div className="bg-slate-100 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label
                htmlFor="input-blank"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                Boş
              </label>
              <input
                id="input-blank"
                type="number"
                min="0"
                max="20"
                value={blank}
                onChange={(e) => setBlank(Math.max(0, parseInt(e.target.value || "0", 10)))}
                className="w-full text-center text-xl font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl py-2 focus:ring-2 focus:ring-slate-500 focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* Live Validation Bar */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              Toplam: {total} / 20 Soru
            </span>
            {validation.isValid ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Tam 20 Soru (Geçerli)
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {validation.remaining > 0
                  ? `${validation.remaining} soru daha girilmeli`
                  : `${Math.abs(validation.remaining)} soru fazla girildi`}
              </span>
            )}
          </div>

          {/* Metrics summary preview */}
          {metricsPreview && (
            <div className="grid grid-cols-2 gap-2 text-center text-xs p-2.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Soru Başına Süre</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {metricsPreview.secondsPerQuestion} sn
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Başarı Oranı</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  %{metricsPreview.accuracyPct}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={!validation.isValid || isSubmitting}
              className={`flex-1 min-h-[48px] px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                validation.isValid && !isSubmitting
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "Kaydediliyor..." : "Ölçümü Kaydet"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="min-h-[48px] px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
