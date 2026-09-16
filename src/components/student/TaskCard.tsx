"use client";

import React from "react";
import type { StudentTodayTask, ActiveTimerSession } from "@/domain/student-today";

interface TaskCardProps {
  task: StudentTodayTask;
  isCutoffActive: boolean;
  activeTimerSession: ActiveTimerSession | null;
  onStartBenchmark: (task: StudentTodayTask) => void;
  onResumeBenchmark: (task: StudentTodayTask) => void;
  onOpenQuestionResult: (task: StudentTodayTask) => void;
  onCompleteNonQuestion: (task: StudentTodayTask) => void;
  onUncompleteTask?: (task: StudentTodayTask) => void;
  isPrimaryNext?: boolean;
}

export function TaskCard({
  task,
  isCutoffActive,
  activeTimerSession,
  onStartBenchmark,
  onResumeBenchmark,
  onOpenQuestionResult,
  onCompleteNonQuestion,
  onUncompleteTask,
  isPrimaryNext = false,
}: TaskCardProps) {
  const isTimed =
    task.isTimed ||
    task.taskType === "paragraph_routine" ||
    task.taskType === "daily_math_benchmark" ||
    task.taskType === "daily_paragraph_benchmark" ||
    (task.taskType === "topic_questions" && task.subjectName === "Matematik");

  const isVideoTask = task.taskType === "topic_video" || task.taskType === "extra_science_video";

  const isQuestionTask =
    isTimed ||
    task.taskType === "topic_questions" ||
    task.taskType === "extra_science_questions" ||
    task.taskType === "source_catchup" ||
    task.taskType === "mixed_questions" ||
    task.taskType === "meb_questions" ||
    task.taskType === "full_mock_verbal" ||
    task.taskType === "full_mock_numerical" ||
    task.taskType === "full_mock" ||
    task.taskType === "branch_mock";

  const isCompleted = task.status === "completed";
  const isCancelled = task.status === "cancelled";
  const isTimerActiveForThis = activeTimerSession?.taskId === task.id;
  const isAnyTimerActive = !!activeTimerSession;

  // Source badges
  const isMathBackup = task.subjectName === "Matematik" && task.resourceLabel?.includes("Yedek");
  const isMathMain = task.subjectName === "Matematik" && task.resourceLabel?.includes("Ana");
  const isScienceQuestion =
    task.subjectName === "Fen" &&
    (task.taskType === "extra_science_video" || task.resourceLabel?.includes("Soru"));
  const isScienceTopic = task.subjectName === "Fen" && task.taskType === "topic_video";

  return (
    <div
      className={`rounded-2xl border transition-all p-4 ${
        isCompleted
          ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-80"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          {task.subjectName && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {task.subjectName}
            </span>
          )}

          {isMathMain && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50">
              Ana Kaynak
            </span>
          )}
          {isMathBackup && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300/50">
              Yedek Kaynak
            </span>
          )}
          {isScienceTopic && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-300/50">
              Konu Anlatım
            </span>
          )}
          {isScienceQuestion && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-300/50">
              Soru Çözümü
            </span>
          )}

          {isTimed && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-300/50">
              İlk 20 Soru (Hız Ölçümü)
            </span>
          )}

          {task.plannedStart && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {task.plannedStart.slice(0, 5)}{" "}
              {task.plannedEnd ? `- ${task.plannedEnd.slice(0, 5)}` : ""}
            </span>
          )}
        </div>

        {/* Question count badge */}
        <div className="text-right shrink-0">
          {task.plannedQuestionCount !== null && task.plannedQuestionCount > 0 && (
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {task.plannedQuestionCount} Soru
            </span>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
        {task.title}
      </h3>

      {/* Topic or Resource details */}
      {(task.topicName || task.resourceLabel) && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          {task.topicName && (
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {task.topicName}
            </span>
          )}
          {task.resourceLabel && <span> • {task.resourceLabel}</span>}
        </p>
      )}

      {/* Authoritative Playlist Link */}
      {task.generalPlaylistUrl && (
        <div className="mt-3">
          <a
            href={task.generalPlaylistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors min-h-[36px]"
          >
            <svg className="w-4 h-4 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
            Oynatma Listesini Aç
          </a>
        </div>
      )}

      {/* Card Action footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
        {isCompleted ? (
          <div className="w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Tamamlandı</span>
              {task.resultCorrect !== null && task.resultCorrect !== undefined && (
                <span className="text-slate-500 dark:text-slate-400 font-normal">
                  ({task.resultCorrect} Doğru, {task.resultWrong} Yanlış, {task.resultBlank} Boş
                  {task.resultDurationSeconds
                    ? ` • ${Math.round(task.resultDurationSeconds / 60)} dk`
                    : ""}
                  )
                </span>
              )}
            </div>
            {onUncompleteTask && (
              <button
                type="button"
                onClick={() => onUncompleteTask(task)}
                title="Görevi tekrar aç (tamamlanmadı yap)"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 transition-colors focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[36px] flex items-center gap-1.5 shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a5 5 0 015 5v2m0 0l-4-4m4 4l4-4"
                  />
                </svg>
                <span>Geri Al</span>
              </button>
            )}
          </div>
        ) : isCancelled ? (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Muaf / İptal Edildi
          </span>
        ) : isTimed ? (
          /* Timed First-20 Task Actions (Math Same-Topic & Paragraph Routine) */
          isTimerActiveForThis ? (
            <button
              onClick={() => onResumeBenchmark(task)}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-amber-500 focus:outline-none whitespace-nowrap"
            >
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
              <span>Zamanlayıcıyı Görüntüle</span>
            </button>
          ) : isAnyTimerActive ? (
            <button
              disabled
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed whitespace-nowrap"
            >
              Başka Zamanlayıcı Açık
            </button>
          ) : (
            <button
              onClick={() => onStartBenchmark(task)}
              className="w-full sm:w-auto min-h-[44px] px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none bg-blue-600 hover:bg-blue-700 whitespace-nowrap cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>İleri Sayımı Başlat (20 Soru)</span>
            </button>
          )
        ) : isVideoTask ? (
          /* Video Topic Task Actions */
          <button
            type="button"
            onClick={() => onCompleteNonQuestion(task)}
            className="w-full sm:w-auto min-h-[44px] px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer whitespace-nowrap"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Videoyu İzledim</span>
          </button>
        ) : isQuestionTask ? (
          /* Untimed Question Task Actions */
          <button
            onClick={() => onOpenQuestionResult(task)}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none whitespace-nowrap"
          >
            <span>Sonuç Gir ({task.plannedQuestionCount ?? 0} Soru)</span>
          </button>
        ) : (
          /* Other Non-question Tasks (Review, Analysis, Sleep, Break) */
          <button
            onClick={() => onCompleteNonQuestion(task)}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-sm flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-slate-500 focus:outline-none whitespace-nowrap"
          >
            <span>Tamamlandı Olarak İşaretle</span>
          </button>
        )}
      </div>
    </div>
  );
}
