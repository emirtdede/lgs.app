"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { formatDuration, calculateElapsedSeconds } from "@/domain/time-utils";
import { Play, Pause, RotateCcw, Clock, PenLine, X, AlertCircle } from "lucide-react";

export interface BenchmarkTimerProps {
  taskId?: string;
  sessionId?: string | null;
  startedAt?: string | null;
  initialSessionId?: string | null;
  initialStartedAt?: string | null;
  taskTitle: string;
  onStartServerTimer?: (taskId: string) => Promise<{ sessionId: string; startedAt: string } | null>;
  onFinish: (sessionId: string, elapsedSeconds: number) => void;
  onCancel: (sessionId: string) => Promise<void>;
  onClose: () => void;
}

type TimerMode = "stopwatch" | "manual";
type TimerStatus = "idle" | "running" | "paused";

export function BenchmarkTimer({
  taskId = "",
  sessionId: propSessionId,
  startedAt: propStartedAt,
  initialSessionId,
  initialStartedAt,
  taskTitle,
  onStartServerTimer,
  onFinish,
  onCancel,
  onClose,
}: BenchmarkTimerProps) {
  // Determine if session was already active on mount (e.g. after page refresh)
  const initialActiveSession = propSessionId || initialSessionId || null;
  const initialActiveStart = propStartedAt || initialStartedAt || null;

  const [activeTab, setActiveTab] = useState<TimerMode>("stopwatch");
  const [timerStatus, setTimerStatus] = useState<TimerStatus>(() =>
    initialActiveStart ? "running" : "idle"
  );
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialActiveSession);

  // Time calculation state
  // If mounted with an existing startedAt, calculate initial elapsed seconds
  const initialElapsed = initialActiveStart ? calculateElapsedSeconds(initialActiveStart) : 0;
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(initialElapsed);
  const [elapsed, setElapsed] = useState<number>(initialElapsed);

  // Segment timestamp for currently active running block
  const segmentStartTimeRef = useRef<number | null>(
    initialActiveStart ? Date.now() - initialElapsed * 1000 : null
  );

  // Loading & confirmation states
  const [isStarting, setIsStarting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Manual time input states (default 20 min 0 sec)
  const [manualMinutes, setManualMinutes] = useState<number>(20);
  const [manualSeconds, setManualSeconds] = useState<number>(0);

  // Tick interval for running state
  useEffect(() => {
    if (timerStatus !== "running") return;

    if (!segmentStartTimeRef.current) {
      segmentStartTimeRef.current = Date.now();
    }

    const interval = setInterval(() => {
      if (segmentStartTimeRef.current) {
        const currentSegmentSec = Math.floor((Date.now() - segmentStartTimeRef.current) / 1000);
        setElapsed(accumulatedSeconds + Math.max(0, currentSegmentSec));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [timerStatus, accumulatedSeconds]);

  // 1. Start timer (from idle state)
  const handleStartTimer = async () => {
    setIsStarting(true);
    try {
      let activeId = currentSessionId;
      if (!activeId && onStartServerTimer && taskId) {
        const res = await onStartServerTimer(taskId);
        if (res) {
          activeId = res.sessionId;
          setCurrentSessionId(res.sessionId);
        }
      }
      if (!activeId) {
        activeId = "local-" + Date.now();
        setCurrentSessionId(activeId);
      }

      segmentStartTimeRef.current = Date.now();
      setTimerStatus("running");
    } finally {
      setIsStarting(false);
    }
  };

  // 2. Pause timer
  const handlePauseTimer = () => {
    if (timerStatus !== "running") return;
    const currentSegmentSec = segmentStartTimeRef.current
      ? Math.floor((Date.now() - segmentStartTimeRef.current) / 1000)
      : 0;
    const newTotal = accumulatedSeconds + Math.max(0, currentSegmentSec);
    setAccumulatedSeconds(newTotal);
    setElapsed(newTotal);
    segmentStartTimeRef.current = null;
    setTimerStatus("paused");
  };

  // 3. Resume timer
  const handleResumeTimer = () => {
    if (timerStatus !== "paused") return;
    segmentStartTimeRef.current = Date.now();
    setTimerStatus("running");
  };

  // 4. Reset timer
  const handleResetTimer = async () => {
    // If running with significant time, ask confirm
    if (!showResetConfirm && elapsed > 10) {
      setShowResetConfirm(true);
      return;
    }

    setIsCancelling(true);
    try {
      if (currentSessionId && !currentSessionId.startsWith("local-") && !currentSessionId.startsWith("manual-")) {
        await onCancel(currentSessionId);
      }
    } catch {
      // non-fatal
    } finally {
      setIsCancelling(false);
      setShowResetConfirm(false);
      setTimerStatus("idle");
      setAccumulatedSeconds(0);
      setElapsed(0);
      segmentStartTimeRef.current = null;
      setCurrentSessionId(null);
    }
  };

  // 5. Finish stopwatch measurement
  const handleFinishStopwatch = () => {
    const finalDuration = Math.max(1, elapsed);
    const sid = currentSessionId || "local-" + Date.now();
    onFinish(sid, finalDuration);
  };

  // 6. Finish manual duration entry
  const handleFinishManual = () => {
    const totalSec = Math.max(1, manualMinutes * 60 + manualSeconds);
    const sid = "manual-" + (taskId || Date.now().toString());
    // If there was an active server timer running, cancel it so it doesn't stay open
    if (currentSessionId && !currentSessionId.startsWith("local-") && !currentSessionId.startsWith("manual-")) {
      onCancel(currentSessionId).catch(() => {});
    }
    onFinish(sid, totalSec);
  };

  // 7. Safe close handler
  const handleSafeClose = async () => {
    if (timerStatus === "running" || timerStatus === "paused") {
      if (!showExitConfirm) {
        setShowExitConfirm(true);
        return;
      }
      if (currentSessionId && !currentSessionId.startsWith("local-") && !currentSessionId.startsWith("manual-")) {
        await onCancel(currentSessionId).catch(() => {});
      }
    }
    onClose();
  };

  const manualTotalSeconds = manualMinutes * 60 + manualSeconds;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="timer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 text-center relative overflow-hidden">
        {/* Close Button in top-right */}
        <button
          type="button"
          onClick={handleSafeClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Task Badge & Title */}
        <div className="pr-8 text-left sm:text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 mb-2">
            20 Soru • Hız & Doğruluk Ölçümü
          </span>
          <h2
            id="timer-modal-title"
            className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-2"
          >
            {taskTitle}
          </h2>
        </div>

        {/* Mode Selector Tabs (Kronometre vs Manuel Giriş) */}
        <div className="mt-5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex items-center gap-1 border border-slate-200/80 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveTab("stopwatch")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[40px] ${
              activeTab === "stopwatch"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Kronometre</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[40px] ${
              activeTab === "manual"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>Süreyi Manuel Gir</span>
          </button>
        </div>

        {/* TAB 1: STOPWATCH MODE */}
        {activeTab === "stopwatch" && (
          <div className="mt-5">
            {/* Timer Dial Display Box */}
            <div className="relative py-7 px-4 bg-gradient-to-b from-blue-50/50 to-indigo-50/30 dark:from-slate-800/60 dark:to-slate-900/60 rounded-3xl border border-blue-100/80 dark:border-blue-900/40 shadow-inner overflow-hidden mb-6">
              {/* Soft ambient glowing ring when running */}
              {timerStatus === "running" && (
                <div className="absolute inset-0 bg-radial from-blue-400/10 via-transparent to-transparent pointer-events-none animate-pulse" />
              )}

              {/* Status Header Badge inside Dial */}
              <div className="mb-2">
                {timerStatus === "idle" && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Başlamaya Hazır
                  </span>
                )}
                {timerStatus === "running" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    İleri Sayım
                  </span>
                )}
                {timerStatus === "paused" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <Pause className="w-3 h-3 text-amber-600" />
                    Duraklatıldı
                  </span>
                )}
              </div>

              {/* Digits Display */}
              <div
                aria-live="polite"
                className="relative text-5xl sm:text-6xl font-mono font-bold tracking-tight text-slate-900 dark:text-white my-1"
              >
                {formatDuration(elapsed)}
              </div>

              {/* Guidance helper text */}
              <p className="relative text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                {timerStatus === "idle" &&
                  "Kitabını ve kalemini hazırla. Teste başlamaya hazır olduğunda Başlat butonuna bas."}
                {timerStatus === "running" &&
                  "Doğallığınızı koruyarak odaklanın. Hedef süre veya geri sayım baskısı yoktur."}
                {timerStatus === "paused" &&
                  "Süre donduruldu. Dinlenip hazır olduğunda Devam Et butonuna basabilirsin."}
              </p>
            </div>

            {/* Confirmation Dialogs */}
            {showResetConfirm && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl mb-4 text-left">
                <p className="text-xs font-medium text-amber-900 dark:text-amber-200 mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  Sayacı sıfırlamak istediğinize emin misiniz? (Ölçülen süre sıfırlanacaktır.)
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    disabled={isCancelling}
                    onClick={() => setShowResetConfirm(false)}
                    className="min-h-[40px] px-3.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl"
                  >
                    Vazgeç
                  </button>
                  <button
                    disabled={isCancelling}
                    onClick={handleResetTimer}
                    className="min-h-[40px] px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl"
                  >
                    {isCancelling ? "Sıfırlanıyor..." : "Evet, Sıfırla"}
                  </button>
                </div>
              </div>
            )}

            {showExitConfirm && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl mb-4 text-left">
                <p className="text-xs font-medium text-rose-900 dark:text-rose-200 mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  Zamanlayıcıdan çıkmak istediğinize emin misiniz? Devam eden ölçüm iptal edilir.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowExitConfirm(false)}
                    className="min-h-[40px] px-3.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl"
                  >
                    Kal ve Devam Et
                  </button>
                  <button
                    onClick={async () => {
                      if (currentSessionId && !currentSessionId.startsWith("local-") && !currentSessionId.startsWith("manual-")) {
                        await onCancel(currentSessionId).catch(() => {});
                      }
                      onClose();
                    }}
                    className="min-h-[40px] px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
                  >
                    Çık ve İptal Et
                  </button>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS BASED ON STATE */}
            {timerStatus === "idle" && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleStartTimer}
                  disabled={isStarting}
                  className="flex-1 min-h-[48px] px-6 py-3 rounded-2xl text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{isStarting ? "Başlatılıyor..." : "Zamanlayıcıyı Başlat"}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[48px] px-5 py-3 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                >
                  Vazgeç
                </button>
              </div>
            )}

            {timerStatus === "running" && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  {/* Pause Button */}
                  <button
                    type="button"
                    onClick={handlePauseTimer}
                    className="flex-1 min-h-[48px] px-4 py-2.5 rounded-2xl text-sm font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Duraklat</span>
                  </button>

                  {/* Reset Button */}
                  <button
                    type="button"
                    onClick={handleResetTimer}
                    className="min-h-[48px] px-4 py-2.5 rounded-2xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Sıfırla</span>
                  </button>
                </div>

                {/* Primary Finish Button */}
                <button
                  type="button"
                  onClick={handleFinishStopwatch}
                  className="w-full min-h-[50px] px-6 py-3 rounded-2xl text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <span>Testi Bitir (20 Soru)</span>
                </button>
              </div>
            )}

            {timerStatus === "paused" && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  {/* Resume Button */}
                  <button
                    type="button"
                    onClick={handleResumeTimer}
                    className="flex-1 min-h-[48px] px-4 py-2.5 rounded-2xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Devam Et</span>
                  </button>

                  {/* Reset Button */}
                  <button
                    type="button"
                    onClick={handleResetTimer}
                    className="min-h-[48px] px-4 py-2.5 rounded-2xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Sıfırla</span>
                  </button>
                </div>

                {/* Primary Finish Button */}
                <button
                  type="button"
                  onClick={handleFinishStopwatch}
                  className="w-full min-h-[50px] px-6 py-3 rounded-2xl text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <span>Testi Bitir (20 Soru)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANUAL TIME ENTRY MODE */}
        {activeTab === "manual" && (
          <div className="mt-5 text-left">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 mb-5">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Farklı bir telefon, masa saati veya kol saati kronometresi kullandıysanız, 20 soruyu
                tamamlama sürenizi dakika ve saniye olarak girin:
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Dakika */}
                <div>
                  <label
                    htmlFor="manual-min"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Dakika
                  </label>
                  <div className="relative">
                    <input
                      id="manual-min"
                      type="number"
                      min="0"
                      max="180"
                      value={manualMinutes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value || "0", 10);
                        setManualMinutes(Math.max(0, Math.min(180, isNaN(val) ? 0 : val)));
                      }}
                      className="w-full text-center text-2xl font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[48px]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                      dk
                    </span>
                  </div>
                </div>

                {/* Saniye */}
                <div>
                  <label
                    htmlFor="manual-sec"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Saniye
                  </label>
                  <div className="relative">
                    <input
                      id="manual-sec"
                      type="number"
                      min="0"
                      max="59"
                      value={manualSeconds}
                      onChange={(e) => {
                        const val = parseInt(e.target.value || "0", 10);
                        setManualSeconds(Math.max(0, Math.min(59, isNaN(val) ? 0 : val)));
                      }}
                      className="w-full text-center text-2xl font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[48px]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                      sn
                    </span>
                  </div>
                </div>
              </div>

              {/* Total summary */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Toplam Ölçülen Süre:
                </span>
                <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                  {formatDuration(manualTotalSeconds)} ({manualMinutes} dk {manualSeconds} sn)
                </span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleFinishManual}
                disabled={manualTotalSeconds <= 0}
                className={`flex-1 min-h-[50px] px-6 py-3 rounded-2xl text-base font-bold shadow-md transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  manualTotalSeconds > 0
                    ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span>Testi Bitir ve Sonucu Gir</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[50px] px-4 py-3 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}

        {/* Refresh Resilience Hint */}
        <div className="mt-5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
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
