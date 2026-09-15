"use client";

import React, { useState } from "react";
import type { StudentTodayTask } from "@/domain/student-today";

interface QuestionResultModalProps {
  task: StudentTodayTask;
  onSubmit: (taskId: string, correct: number, wrong: number, blank: number) => Promise<void>;
  onClose: () => void;
}

export function QuestionResultModal({ task, onSubmit, onClose }: QuestionResultModalProps) {
  const targetCount = task.plannedQuestionCount ?? 10;
  const [correct, setCorrect] = useState<number>(targetCount);
  const [wrong, setWrong] = useState<number>(0);
  const [blank, setBlank] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const total = correct + wrong + blank;
  const isValid = total === targetCount && correct >= 0 && wrong >= 0 && blank >= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit(task.id, correct, wrong, blank);
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Kayıt sırasında bir hata oluştu.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-result-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {task.subjectName ?? "Soru Çözümü"}
          </span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            Hedef: {targetCount} Soru
          </span>
        </div>

        <h2
          id="question-result-title"
          className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1"
        >
          {task.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Çözdüğünüz soruların Doğru, Yanlış ve Boş sayılarını girin.
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
                htmlFor="qr-correct"
                className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1"
              >
                Doğru
              </label>
              <input
                id="qr-correct"
                type="number"
                min="0"
                max={targetCount}
                value={correct}
                onChange={(e) => setCorrect(Math.max(0, parseInt(e.target.value || "0", 10)))}
                className="w-full text-center text-xl font-bold bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
              />
            </div>

            {/* Yanlış */}
            <div className="bg-rose-50/70 dark:bg-rose-950/30 p-3 rounded-2xl border border-rose-200 dark:border-rose-900">
              <label
                htmlFor="qr-wrong"
                className="block text-xs font-bold text-rose-800 dark:text-rose-300 mb-1"
              >
                Yanlış
              </label>
              <input
                id="qr-wrong"
                type="number"
                min="0"
                max={targetCount}
                value={wrong}
                onChange={(e) => setWrong(Math.max(0, parseInt(e.target.value || "0", 10)))}
                className="w-full text-center text-xl font-bold bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-xl py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none min-h-[44px]"
              />
            </div>

            {/* Boş */}
            <div className="bg-slate-100 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label
                htmlFor="qr-blank"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                Boş
              </label>
              <input
                id="qr-blank"
                type="number"
                min="0"
                max={targetCount}
                value={blank}
                onChange={(e) => setBlank(Math.max(0, parseInt(e.target.value || "0", 10)))}
                className="w-full text-center text-xl font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl py-2 focus:ring-2 focus:ring-slate-500 focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* Validation Status */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              Toplam: {total} / {targetCount} Soru
            </span>
            {isValid ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Geçerli
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {total < targetCount
                  ? `${targetCount - total} soru daha girilmeli`
                  : `${total - targetCount} soru fazla girildi`}
              </span>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`flex-1 min-h-[48px] px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                isValid && !isSubmitting
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "Kaydediliyor..." : "Sonucu Kaydet"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="min-h-[48px] px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none"
            >
              Vazgeç
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
