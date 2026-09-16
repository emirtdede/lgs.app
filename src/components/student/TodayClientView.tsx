"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Award, Calendar } from "lucide-react";
import { TodayHeader } from "./TodayHeader";
import { CutoffBanner } from "./CutoffBanner";
import { TaskCard } from "./TaskCard";
import { BenchmarkTimer } from "./BenchmarkTimer";
import { BenchmarkResultModal } from "./BenchmarkResultModal";
import { QuestionResultModal } from "./QuestionResultModal";
import { ReadingBlock } from "./ReadingBlock";
import {
  calculateTodayProgress,
  checkReadingUnlocked,
  type StudentTodayData,
  type StudentTodayTask,
} from "@/domain/student-today";
import type { AuthenticatedStudentInfo } from "@/server/student-service";
import { getDailyMotivationQuote } from "@/domain/motivation-quotes";
import {
  startBenchmarkAction,
  cancelBenchmarkAction,
  finishBenchmark20Action,
  recordQuestionTaskResultAction,
  completeNonQuestionTaskAction,
  uncompleteTaskAction,
  startReadingAction,
  finishReadingAction,
} from "@/application/student-actions";

interface TodayClientViewProps {
  student: AuthenticatedStudentInfo;
  initialData: StudentTodayData;
}

export function TodayClientView({ student, initialData }: TodayClientViewProps) {
  const router = useRouter();
  const [data, setData] = useState<StudentTodayData>(initialData);
  const dailyQuote = getDailyMotivationQuote({ dateStr: data.planDate });

  // Active Timer Modal State
  const [activeTimer, setActiveTimer] = useState<{
    taskId: string;
    sessionId?: string | null;
    startedAt?: string | null;
    taskTitle: string;
  } | null>(() => {
    if (initialData.activeTimerSession) {
      return {
        taskId: initialData.activeTimerSession.taskId,
        sessionId: initialData.activeTimerSession.sessionId,
        startedAt: initialData.activeTimerSession.startedAt,
        taskTitle: initialData.activeTimerSession.taskTitle,
      };
    }
    return null;
  });

  // Benchmark Result Entry Modal State
  const [benchmarkResultTarget, setBenchmarkResultTarget] = useState<{
    sessionId: string;
    durationSeconds: number;
    taskTitle: string;
    taskId?: string;
  } | null>(null);

  // Non-benchmark Question Result Modal State
  const [questionResultTarget, setQuestionResultTarget] = useState<StudentTodayTask | null>(null);

  // Completed Section Accordion
  const [showCompleted, setShowCompleted] = useState(false);

  // Feedback toast message
  const [feedback, setFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  // 1. Open Benchmark modal (starts in 'idle' mode, doesn't auto-tick until student clicks 'Başlat')
  const handleStartBenchmark = (task: StudentTodayTask) => {
    setActiveTimer({
      taskId: task.id,
      sessionId: null,
      startedAt: null,
      taskTitle: task.title,
    });
  };

  // 2. Start server timer when student clicks 'Başlat' inside modal
  const handleStartServerTimer = async (taskId: string) => {
    const res = await startBenchmarkAction(taskId);
    if (!res.success || !res.data) {
      showToast(res.errorMessage ?? "Zamanlayıcı başlatılamadı.");
      return null;
    }
    return {
      sessionId: res.data.sessionId,
      startedAt: res.data.startedAt,
    };
  };

  // 3. Resume already active timer
  const handleResumeBenchmark = (task: StudentTodayTask) => {
    if (data.activeTimerSession) {
      setActiveTimer({
        taskId: data.activeTimerSession.taskId,
        sessionId: data.activeTimerSession.sessionId,
        startedAt: data.activeTimerSession.startedAt,
        taskTitle: data.activeTimerSession.taskTitle,
      });
    }
  };

  // 4. Finish Benchmark Timer -> opens result form
  const handleFinishTimer = (sessionId: string, elapsedSeconds: number) => {
    const title = activeTimer?.taskTitle ?? "20 Soru Hız ve Doğruluk Ölçümü";
    const currentTaskId = activeTimer?.taskId;
    setActiveTimer(null);
    setBenchmarkResultTarget({
      sessionId,
      durationSeconds: elapsedSeconds,
      taskTitle: title,
      taskId: currentTaskId,
    });
  };

  // 5. Cancel Benchmark Timer
  const handleCancelTimer = async (sessionId: string) => {
    if (sessionId && !sessionId.startsWith("local-") && !sessionId.startsWith("manual-")) {
      await cancelBenchmarkAction(sessionId);
    }
    setActiveTimer(null);
    showToast("Ölçüm iptal edildi.");
    router.refresh();
  };

  // 6. Submit Benchmark 20 Result
  const handleSubmitBenchmarkResult = async (correct: number, wrong: number, blank: number) => {
    if (!benchmarkResultTarget) return;

    const res = await finishBenchmark20Action(
      benchmarkResultTarget.sessionId,
      correct,
      wrong,
      blank,
      benchmarkResultTarget.durationSeconds,
      benchmarkResultTarget.taskId
    );

    if (!res.success) {
      throw new Error(res.errorMessage ?? "Kayıt tamamlanamadı.");
    }

    setBenchmarkResultTarget(null);
    showToast("20 soruluk ölçüm kaydedildi.");
    router.refresh();
  };

  // 6. Submit Non-benchmark Question Task Result
  const handleSubmitQuestionResult = async (
    taskId: string,
    correct: number,
    wrong: number,
    blank: number
  ) => {
    const res = await recordQuestionTaskResultAction(taskId, correct, wrong, blank);
    if (!res.success) {
      throw new Error(res.errorMessage ?? "Kayıt tamamlanamadı.");
    }

    setQuestionResultTarget(null);
    showToast("Soru çözümü kaydedildi.");
    router.refresh();
  };

  // 7. Complete Non-question Task (Video / Review)
  const handleCompleteNonQuestion = async (task: StudentTodayTask) => {
    // Optimistic UI update
    setData((prev) => {
      const completedTask = { ...task, status: "completed" as const };
      const completedTasks = [completedTask, ...prev.completedTasks];
      const remainingTopic = prev.topicTasks.filter((t) => t.id !== task.id);
      const remainingRoutine = prev.routineTasks.filter((t) => t.id !== task.id);
      const allTasks = [...completedTasks, ...remainingTopic, ...remainingRoutine];
      const newProgress = calculateTodayProgress(allTasks);
      const readingCheck = checkReadingUnlocked(allTasks);
      return {
        ...prev,
        topicTasks: remainingTopic,
        routineTasks: remainingRoutine,
        completedTasks,
        progress: newProgress,
        isReadingUnlocked: readingCheck.isUnlocked,
        readingLockReason: readingCheck.reason,
      };
    });

    const res = await completeNonQuestionTaskAction(task.id);
    if (!res.success) {
      showToast(res.errorMessage ?? "Tamamlama kaydedilemedi.");
      router.refresh();
      return;
    }

    showToast("Görev tamamlandı.");
    router.refresh();
  };

  // 7b. Uncomplete Task (Geri Al)
  const handleUncompleteTask = async (task: StudentTodayTask) => {
    // Optimistic UI update
    setData((prev) => {
      const remainingCompleted = prev.completedTasks.filter((t) => t.id !== task.id);
      const uncompletedTask = { ...task, status: "pending" as const };
      const isRoutine =
        task.taskType === "paragraph_routine" || task.taskType === "daily_math_benchmark";
      const routineTasks = isRoutine ? [...prev.routineTasks, uncompletedTask] : prev.routineTasks;
      const topicTasks = !isRoutine ? [...prev.topicTasks, uncompletedTask] : prev.topicTasks;
      const allTasks = [...remainingCompleted, ...routineTasks, ...topicTasks];
      const newProgress = calculateTodayProgress(allTasks);
      const readingCheck = checkReadingUnlocked(allTasks);
      return {
        ...prev,
        completedTasks: remainingCompleted,
        routineTasks,
        topicTasks,
        progress: newProgress,
        isReadingUnlocked: readingCheck.isUnlocked,
        readingLockReason: readingCheck.reason,
      };
    });

    const res = await uncompleteTaskAction(task.id);
    if (!res.success) {
      showToast(res.errorMessage ?? "Geri alma işlemi tamamlanamadı.");
      router.refresh();
      return;
    }

    showToast("Görev tekrar açıldı.");
    router.refresh();
  };

  // 8. Reading actions
  const handleStartReading = async (title?: string) => {
    const res = await startReadingAction(title);
    if (!res.success) {
      showToast(res.errorMessage ?? "Okuma başlatılamadı.");
      return;
    }
    router.refresh();
  };

  const handleFinishReading = async (sessionId: string, pagesRead?: number, notes?: string) => {
    const res = await finishReadingAction(sessionId, pagesRead, notes);
    if (!res.success) {
      showToast(res.errorMessage ?? "Okuma kaydedilemedi.");
      return;
    }
    showToast("Okuma oturumu kaydedildi.");
    router.refresh();
  };

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleNavigateDate = (date: string | null) => {
    if (date) {
      router.push(`/today?date=${date}`);
    } else {
      router.push("/today");
    }
  };

  return (
    <div className="pb-12">
      {/* Toast Notification */}
      {feedback && (
        <div
          role="status"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-lg text-xs font-semibold animate-in fade-in slide-in-from-top-2"
        >
          {feedback}
        </div>
      )}

      {/* Header */}
      <TodayHeader
        studentName={student.displayName}
        formattedDate={data.formattedDate}
        totalRequired={data.progress.totalRequired}
        completedRequired={data.progress.completedRequired}
        percent={data.progress.percent}
        planDate={data.planDate}
        realTodayDate={data.realTodayDate}
        dayNumber={data.dayNumber}
        phase={data.phase}
        prevDate={data.prevDate}
        nextDate={data.nextDate}
        isPlanStartFallback={data.isPlanStartFallback}
        onNavigateDate={handleNavigateDate}
      />

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {/* 21:50 Cutoff Banner */}
        {data.isCutoffActive && <CutoffBanner planDate={data.planDate} />}

        {/* Günlük İlham & Motivasyon Kartı (270 Günlük Özel Sözler) */}
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-slate-800/80 dark:via-indigo-950/30 dark:to-slate-800/80 border border-blue-100 dark:border-indigo-900/40 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
              <span className="font-bold not-italic text-blue-700 dark:text-blue-400 mr-1.5">
                Günün İlhamı:
              </span>
              &ldquo;{dailyQuote}&rdquo;
            </div>
          </div>
        </div>

        {/* 100% Tamamlanma Kutlama Kartı */}
        {data.progress.percent === 100 && data.progress.totalRequired > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-5 text-center shadow-xs animate-in fade-in zoom-in-95 duration-300">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
              Harikasın Yusuf! Bugünkü tüm hedeflerini tamamladın.
            </h3>
            <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 mt-1 max-w-md mx-auto">
              Düzenli çalışman ve azmin seni hedefine adım adım yaklaştırıyor. Şimdi zihnini
              dinlendirebilir veya keyifle kitap okuyabilirsin!
            </p>
          </div>
        )}

        {/* Pre-plan Start State (Section 13) */}
        {data.isPrePlanStart && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-6 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Plan 1 Ekim 2026 tarihinde başlıyor.
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
                LGS 2027 Çalışma Planı 1 Ekim 2026 Perşembe günü başlayacaktır. Başlangıç gününü ve
                tüm çalışma programını aşağıdaki butonlardan inceleyebilirsiniz.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="/today?date=2026-10-01"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              >
                1 Ekim 2026 Görevlerini İncele
              </a>
              <a
                href="/plan"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-sm transition-colors"
              >
                Çalışma Takvimini Aç
              </a>
            </div>
          </div>
        )}

        {/* Empty state when no tasks scheduled */}
        {!data.isPrePlanStart &&
          data.routineTasks.length === 0 &&
          data.topicTasks.length === 0 &&
          data.completedTasks.length === 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {data.prePlanMessage ?? "Bu tarih için planlanmış ders görevi bulunamadı."}
            </div>
          )}

        {/* Section 1: Günlük Rutin (Paragraf & Matematik) */}
        {data.routineTasks.length > 0 && (
          <section aria-labelledby="section-routine">
            <h2
              id="section-routine"
              className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-2"
            >
              Günlük Rutin
            </h2>
            <div className="space-y-3">
              {data.routineTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  isCutoffActive={data.isCutoffActive}
                  activeTimerSession={data.activeTimerSession}
                  onStartBenchmark={handleStartBenchmark}
                  onResumeBenchmark={handleResumeBenchmark}
                  onOpenQuestionResult={(task) => setQuestionResultTarget(task)}
                  onCompleteNonQuestion={handleCompleteNonQuestion}
                  onUncompleteTask={handleUncompleteTask}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Konu Görevleri */}
        {data.topicTasks.length > 0 && (
          <section aria-labelledby="section-topic">
            <h2
              id="section-topic"
              className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-2"
            >
              Konu Görevleri
            </h2>
            <div className="space-y-3">
              {data.topicTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  isCutoffActive={data.isCutoffActive}
                  activeTimerSession={data.activeTimerSession}
                  onStartBenchmark={handleStartBenchmark}
                  onResumeBenchmark={handleResumeBenchmark}
                  onOpenQuestionResult={(task) => setQuestionResultTarget(task)}
                  onCompleteNonQuestion={handleCompleteNonQuestion}
                  onUncompleteTask={handleUncompleteTask}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Kitap Okuma (Locked until required tasks completed) */}
        <section aria-labelledby="section-reading">
          <ReadingBlock
            readingTask={data.readingTask}
            isUnlocked={data.isReadingUnlocked}
            lockReason={data.readingLockReason}
            activeReadingSession={data.activeReadingSession}
            onStartReading={handleStartReading}
            onFinishReading={handleFinishReading}
          />
        </section>

        {/* Section 4: Tamamlananlar Accordion */}
        {data.completedTasks.length > 0 && (
          <section aria-labelledby="section-completed" className="pt-2">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
            >
              <span>Tamamlanan Görevler ({data.completedTasks.length})</span>
              <svg
                className={`w-4 h-4 transition-transform ${showCompleted ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showCompleted && (
              <div className="mt-3 space-y-2.5 animate-in fade-in duration-150">
                {data.completedTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    isCutoffActive={data.isCutoffActive}
                    activeTimerSession={data.activeTimerSession}
                    onStartBenchmark={handleStartBenchmark}
                    onResumeBenchmark={handleResumeBenchmark}
                    onOpenQuestionResult={() => {}}
                    onCompleteNonQuestion={() => {}}
                    onUncompleteTask={handleUncompleteTask}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Modals */}
      {activeTimer && (
        <BenchmarkTimer
          taskId={activeTimer.taskId}
          sessionId={activeTimer.sessionId}
          startedAt={activeTimer.startedAt}
          taskTitle={activeTimer.taskTitle}
          onStartServerTimer={handleStartServerTimer}
          onFinish={handleFinishTimer}
          onCancel={handleCancelTimer}
          onClose={() => setActiveTimer(null)}
        />
      )}

      {benchmarkResultTarget && (
        <BenchmarkResultModal
          sessionId={benchmarkResultTarget.sessionId}
          durationSeconds={benchmarkResultTarget.durationSeconds}
          taskTitle={benchmarkResultTarget.taskTitle}
          onSubmit={handleSubmitBenchmarkResult}
          onClose={() => setBenchmarkResultTarget(null)}
        />
      )}

      {questionResultTarget && (
        <QuestionResultModal
          task={questionResultTarget}
          onSubmit={handleSubmitQuestionResult}
          onClose={() => setQuestionResultTarget(null)}
        />
      )}
    </div>
  );
}
