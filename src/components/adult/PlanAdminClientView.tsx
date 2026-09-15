"use client";

import React, { useState, useTransition } from "react";
import { rescheduleTaskAction, cancelPlanTaskAction } from "@/application/plan-actions";
import type { FamilyRole } from "@/lib/supabase/types";

export interface AdminTaskItem {
  id: string;
  title: string;
  taskType: string;
  originalDate: string;
  currentDate: string;
  subjectName: string | null;
  status: string;
  required: boolean;
}

const TASK_TYPE_LABELS: Record<string, string> = {
  video: "Konu Videosu",
  question: "Soru Çözümü",
  reading: "Serbest Okuma",
  mock_exam: "LGS Deneme Sınavı",
  revision: "Tekrar",
};

interface PlanAdminClientViewProps {
  tasks: AdminTaskItem[];
  availableDates: string[];
  role: FamilyRole;
  initialSelectedTaskId?: string;
}

export function PlanAdminClientView({
  tasks,
  availableDates,
  role,
  initialSelectedTaskId,
}: PlanAdminClientViewProps) {
  const [selectedTask, setSelectedTask] = useState<AdminTaskItem | null>(
    initialSelectedTaskId ? tasks.find((t) => t.id === initialSelectedTaskId) || null : null
  );
  const [modalMode, setModalMode] = useState<"reschedule" | "cancel" | null>(
    initialSelectedTaskId ? "reschedule" : null
  );

  const [targetDate, setTargetDate] = useState<string>(
    availableDates[0] || new Date().toISOString().slice(0, 10)
  );
  const [reason, setReason] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [isPending, startTransition] = useTransition();
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const subjects = Array.from(new Set(tasks.map((t) => t.subjectName).filter(Boolean)));

  const filteredTasks = tasks.filter((t) => {
    if (filterSubject !== "all" && t.subjectName !== filterSubject) return false;
    if (filterStatus === "pending" && t.status !== "pending") return false;
    if (filterStatus === "completed" && t.status !== "completed") return false;
    if (filterStatus === "cancelled" && t.status !== "cancelled") return false;
    return true;
  });

  const handleReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setFeedbackMsg(null);

    startTransition(async () => {
      const res = await rescheduleTaskAction(selectedTask.id, targetDate, reason);
      if (res.success) {
        setFeedbackMsg({
          type: "success",
          text: `Görev başarıyla ${res.data?.currentDate} tarihine ertelendi. ${
            res.data?.warning ? `(${res.data.warning})` : ""
          }`,
        });
        setModalMode(null);
        setReason("");
      } else {
        setFeedbackMsg({
          type: "error",
          text: res.errorMessage ?? "Erteleme işlemi tamamlanamadı.",
        });
      }
    });
  };

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setFeedbackMsg(null);

    startTransition(async () => {
      const res = await cancelPlanTaskAction(selectedTask.id, reason);
      if (res.success) {
        setFeedbackMsg({
          type: "success",
          text: "Görev gerekçesiyle birlikte iptal edildi.",
        });
        setModalMode(null);
        setReason("");
      } else {
        setFeedbackMsg({
          type: "error",
          text: res.errorMessage ?? "İptal işlemi tamamlanamadı.",
        });
      }
    });
  };

  const isViewer = role === "viewer";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Plan Yönetimi</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Eksik kalan veya ertelenmesi gereken görevleri yönetin. Asıl plan takvimi korunur ve
          yapılan ertelemeler geçmişte listelenir.
        </p>
      </div>

      {isViewer && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
          Görüntüleme modundasınız. Plan düzenleme ve erteleme işlemleri yalnızca Aile Yöneticisi
          tarafından yapılabilir.
        </div>
      )}

      {feedbackMsg && (
        <div
          className={`mb-4 p-3 rounded-xl text-xs border ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-800 dark:text-emerald-200"
              : "bg-red-50 dark:bg-red-950/30 border-red-200 text-red-800 dark:text-red-200"
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Ders:</span>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
          >
            <option value="all">Tüm Dersler</option>
            {subjects.map((s) => (
              <option key={s} value={s!}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Durum:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Bekliyor</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal Edildi</option>
          </select>
        </div>

        <div className="ml-auto text-xs text-slate-500 font-medium">
          {filteredTasks.length} görev listelendi
        </div>
      </div>

      {/* Tasks Table & Mobile Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Mobile Cards (Visible on screens < md) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredTasks.map((t) => {
            const isCompleted = t.status === "completed";
            const isCancelled = t.status === "cancelled";
            const isRescheduled = t.originalDate !== t.currentDate;
            const typeLabel = TASK_TYPE_LABELS[t.taskType] ?? t.taskType;

            return (
              <div key={t.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {t.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {t.subjectName && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {t.subjectName}
                        </span>
                      )}
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {typeLabel}
                      </span>
                    </div>
                  </div>
                  {isCompleted ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] shrink-0">
                      Tamamlandı
                    </span>
                  ) : isCancelled ? (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold text-[11px] shrink-0">
                      İptal Edildi
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold text-[11px] shrink-0">
                      Bekliyor
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-50 dark:border-slate-800/60">
                  <span>Asıl: {t.originalDate}</span>
                  <span>
                    Geçerli:{" "}
                    <strong
                      className={
                        isRescheduled
                          ? "text-amber-600 dark:text-amber-400 font-bold"
                          : "text-slate-700 dark:text-slate-300 font-medium"
                      }
                    >
                      {t.currentDate}
                    </strong>
                  </span>
                </div>

                {!isViewer && !isCompleted && !isCancelled && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTask(t);
                        setModalMode("reschedule");
                      }}
                      className="flex-1 py-2 text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl transition-colors min-h-[44px] flex items-center justify-center"
                    >
                      Ertele
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTask(t);
                        setModalMode("cancel");
                      }}
                      className="py-2 px-3 text-xs font-semibold text-slate-500 hover:text-red-600 rounded-xl transition-colors min-h-[44px] flex items-center justify-center border border-slate-200 dark:border-slate-800"
                    >
                      İptal Et
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="p-6 text-center text-slate-500 text-xs">
              Filtreye uygun görev bulunamadı.
            </div>
          )}
        </div>

        {/* Desktop Table (Visible on md and up) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Görev</th>
                <th className="py-3 px-4">Tür</th>
                <th className="py-3 px-4">Ders</th>
                <th className="py-3 px-4">Asıl Tarih</th>
                <th className="py-3 px-4">Geçerli Tarih</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredTasks.map((t) => {
                const isCompleted = t.status === "completed";
                const isCancelled = t.status === "cancelled";
                const isRescheduled = t.originalDate !== t.currentDate;
                const typeLabel = TASK_TYPE_LABELS[t.taskType] ?? t.taskType;

                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {t.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
                        {typeLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{t.subjectName || "—"}</td>
                    <td className="py-3 px-4 text-slate-500">{t.originalDate}</td>
                    <td className="py-3 px-4 font-medium">
                      <span
                        className={
                          isRescheduled ? "text-amber-600 dark:text-amber-400 font-bold" : ""
                        }
                      >
                        {t.currentDate}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isCompleted ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                          Tamamlandı
                        </span>
                      ) : isCancelled ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold text-[11px]">
                          İptal Edildi
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold text-[11px]">
                          Bekliyor
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {!isViewer && !isCompleted && !isCancelled && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedTask(t);
                              setModalMode("reschedule");
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg transition-colors min-h-[32px]"
                          >
                            Ertele
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTask(t);
                              setModalMode("cancel");
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-red-600 rounded-lg transition-colors min-h-[32px]"
                          >
                            İptal Et
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reschedule / Cancel Modal */}
      {modalMode && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              {modalMode === "reschedule" ? "Görevi Ertele" : "Görevi İptal Et / Muaf Tut"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Görev:{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedTask.title}
              </span>
            </p>

            <form
              onSubmit={modalMode === "reschedule" ? handleReschedule : handleCancel}
              className="space-y-4"
            >
              {modalMode === "reschedule" && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Hedef Tarih
                  </label>
                  <select
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  >
                    {availableDates.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  İşlem Gerekçesi (Zorunlu)
                </label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Erteleme veya iptal gerekçesini yazınız (örn: okul etkinliği, dinlenme)..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 min-h-[40px]"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isPending || !reason.trim()}
                  className={`px-4 py-2 text-white text-xs font-semibold rounded-xl min-h-[40px] disabled:opacity-50 ${
                    modalMode === "reschedule"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isPending
                    ? "İşleniyor..."
                    : modalMode === "reschedule"
                      ? "Ertelemeyi Onayla"
                      : "İptal Et"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
