"use client";

import React, { useState, useTransition, useRef } from "react";
import {
  Calculator,
  BookOpen,
  Atom,
  Landmark,
  Compass,
  Globe,
  Search,
  Bookmark,
  MessageSquare,
  Lightbulb,
  Camera,
  ImageIcon,
  X,
  Check,
  CheckCircle2,
  BookMarked,
  ZoomIn,
  Plus,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import {
  setMistakeReviewStatusAction,
  addCustomMistakeAction,
  deleteMistakeAction,
} from "@/application/student-actions";
import { compressImageToWebP } from "@/lib/image-utils";
import type { MistakeReason, ReviewStatus } from "@/lib/supabase/types";

export interface MistakeItem {
  id: string;
  subjectId: number | null;
  subjectName?: string | null;
  topicName: string;
  reason: MistakeReason;
  note: string | null;
  correctSolution?: string | null;
  imageData?: string | null;
  status: ReviewStatus;
  createdAt: string;
}

export interface SubjectOption {
  id: number;
  code: string;
  nameTr: string;
}

export interface TopicOption {
  id: string;
  subjectId: number;
  nameTr: string;
}

interface MistakesClientViewProps {
  initialMistakes: MistakeItem[];
  subjects: SubjectOption[];
  knownTopics: TopicOption[];
}

const REASON_LABELS: Record<MistakeReason, string> = {
  attention: "Dikkatsizlik",
  knowledge_gap: "Bilgi Eksiği",
  calculation_error: "İşlem Hatası",
  misread: "Soruyu Yanlış Okuma",
  strategy: "Süre / Strateji",
  unknown: "Diğer",
};

const SUBJECT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  math: Calculator,
  turkish: BookOpen,
  science: Atom,
  history: Landmark,
  religion: Compass,
  english: Globe,
};

export function MistakesClientView({
  initialMistakes,
  subjects,
  knownTopics,
}: MistakesClientViewProps) {
  const [mistakes, setMistakes] = useState<MistakeItem[]>(initialMistakes);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "all">("all");
  const [isSubjectMenuOpen, setIsSubjectMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Add form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubjectId, setNewSubjectId] = useState<number>(subjects[0]?.id ?? 1);
  const [newTopicName, setNewTopicName] = useState("");
  const [newReason, setNewReason] = useState<MistakeReason>("attention");
  const [newNote, setNewNote] = useState("");
  const [newCorrectSolution, setNewCorrectSolution] = useState("");
  const [newImageData, setNewImageData] = useState<string | null>(null);
  const [imageSizeKb, setImageSizeKb] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Lightbox preview modal state
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // File input refs for Camera and Gallery
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Available topics for currently selected subject in form
  const relevantTopics = knownTopics.filter((t) => t.subjectId === newSubjectId);

  // Handle Image Selection and Client-side WebP Compression
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsCompressing(true);
    try {
      const webpBase64 = await compressImageToWebP(file, 1200, 0.82);
      setNewImageData(webpBase64);
      // Rough KB size calculation from base64 string
      const sizeInKb = Math.round((webpBase64.length * 3) / 4 / 1024);
      setImageSizeKb(sizeInKb);
    } catch {
      setErrorMsg("Görsel WebP formatına sıkıştırılırken bir sorun oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsCompressing(false);
      // Reset input value so same file can be re-selected if needed
      e.target.value = "";
    }
  };

  // Status toggle handler
  const handleStatusChange = (mistakeId: string, nextStatus: ReviewStatus) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await setMistakeReviewStatusAction(mistakeId, nextStatus);
      if (res.success) {
        setMistakes((prev) =>
          prev.map((m) => (m.id === mistakeId ? { ...m, status: nextStatus } : m))
        );
      } else {
        setErrorMsg(res.errorMessage ?? "Durum güncellenemedi.");
      }
    });
  };

  // Delete mistake handler
  const handleDeleteMistake = (mistakeId: string) => {
    if (!window.confirm("Bu yanlış soru kaydını silmek istediğinize emin misiniz?")) {
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      const res = await deleteMistakeAction(mistakeId);
      if (res.success) {
        setMistakes((prev) => prev.filter((m) => m.id !== mistakeId));
      } else {
        setErrorMsg(res.errorMessage ?? "Soru silinemedi.");
      }
    });
  };

  // Add mistake submission
  const handleAddMistake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) {
      setErrorMsg("Lütfen bir konu başlığı girin veya listeden seçin.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const subj = subjects.find((s) => s.id === newSubjectId);
      const res = await addCustomMistakeAction({
        subjectId: newSubjectId,
        topicName: newTopicName.trim(),
        reason: newReason,
        note: newNote.trim() || undefined,
        correctSolution: newCorrectSolution.trim() || undefined,
        imageData: newImageData || undefined,
      });

      if (res.success && res.data) {
        const newItem: MistakeItem = {
          id: res.data.mistakeId,
          subjectId: newSubjectId,
          subjectName: subj?.nameTr ?? "Ders",
          topicName: newTopicName.trim(),
          reason: newReason,
          note: newNote.trim() || null,
          correctSolution: newCorrectSolution.trim() || null,
          imageData: newImageData || null,
          status: "open",
          createdAt: new Date().toISOString(),
        };

        setMistakes((prev) => [newItem, ...prev]);
        setIsAddModalOpen(false);
        // Reset form
        setNewTopicName("");
        setNewNote("");
        setNewCorrectSolution("");
        setNewImageData(null);
        setImageSizeKb(null);
        setSuccessMsg("Yanlış soru başarıyla eklendi!");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.errorMessage ?? "Yanlış soru kaydedilemedi.");
      }
    });
  };

  // Filtered mistakes
  const filteredMistakes = mistakes.filter((m) => {
    // Subject filter
    if (selectedSubjectId !== "all" && m.subjectId !== selectedSubjectId) {
      return false;
    }
    // Status filter
    if (statusFilter !== "all" && m.status !== statusFilter) {
      return false;
    }
    // Search query filter (matches topic name or student note or solution)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const topicMatch = m.topicName.toLowerCase().includes(q);
      const noteMatch = m.note ? m.note.toLowerCase().includes(q) : false;
      const solMatch = m.correctSolution ? m.correctSolution.toLowerCase().includes(q) : false;
      if (!topicMatch && !noteMatch && !solMatch) {
        return false;
      }
    }
    return true;
  });

  // Group filtered mistakes by topicName
  const groupedByTopic = filteredMistakes.reduce<Record<string, MistakeItem[]>>((acc, item) => {
    const key = item.topicName || "Genel Sorular";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  const topicKeys = Object.keys(groupedByTopic).sort();

  const selectedSubjectObj =
    selectedSubjectId === "all" ? null : subjects.find((s) => s.id === selectedSubjectId);
  const selectedSubjectLabel = selectedSubjectObj ? selectedSubjectObj.nameTr : "Tüm Dersler";

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* 1. APPLE MINIMALIST NAVIGATION BAR */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate whitespace-nowrap">
            Yanlış Sorular
          </h1>
          {mistakes.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 shrink-0">
              {mistakes.length} Soru
            </span>
          )}
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-semibold shadow-xs transition-all active:scale-[0.98] shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Soru Ekle</span>
        </button>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs sm:text-sm text-rose-800 dark:text-rose-200">
          {errorMsg}
        </div>
      )}

      {/* 2. SEARCH BAR & TEK DERS FİLTRE BUTONU */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Konu veya notlarda ara..."
            className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-800/60 border border-transparent focus:border-blue-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* TEK BUTON: Apple Minimalist Ders Filtresi */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsSubjectMenuOpen(!isSubjectMenuOpen)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
              selectedSubjectId === "all"
                ? "bg-slate-100 dark:bg-slate-800/80 border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                : "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-xs"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{selectedSubjectLabel}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isSubjectMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsSubjectMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-56 sm:w-60 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Ders Filtresi
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubjectId("all");
                    setIsSubjectMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                    selectedSubjectId === "all"
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {selectedSubjectId === "all" ? (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <span className="w-3.5 h-3.5" />
                    )}
                    <span>Tüm Dersler</span>
                  </span>
                  {mistakes.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({mistakes.length})
                    </span>
                  )}
                </button>

                {subjects.map((subj) => {
                  const isSelected = selectedSubjectId === subj.id;
                  const count = mistakes.filter((m) => m.subjectId === subj.id).length;

                  return (
                    <button
                      key={subj.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubjectId(subj.id);
                        setIsSubjectMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <span className="w-3.5 h-3.5" />
                        )}
                        <span>{subj.nameTr}</span>
                      </span>
                      {count > 0 && (
                        <span className="text-[10px] text-slate-400 font-medium">({count})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. APPLE SEGMENTED CONTROL (STATUS FILTER) */}
      <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl mb-4">
        <button
          onClick={() => setStatusFilter("all")}
          className={`py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
            statusFilter === "all"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <span>Tümü</span>
        </button>

        <button
          onClick={() => setStatusFilter("open")}
          className={`py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
            statusFilter === "open"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <span>Açık</span>
        </button>

        <button
          onClick={() => setStatusFilter("resolved")}
          className={`py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
            statusFilter === "resolved"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <span>Çözüldü</span>
        </button>
      </div>

      {/* Grouped by Topic Mistake List */}
      <div className="space-y-6">
        {topicKeys.map((topicName) => {
          const items = groupedByTopic[topicName] || [];

          return (
            <div
              key={topicName}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
            >
              {/* Topic Header */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {topicName}
                  </span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {items.length} Soru
                </span>
              </div>

              {/* Mistake Items in this Topic */}
              <div className="p-4 space-y-4 divide-y divide-slate-100 dark:divide-slate-800/60">
                {items.map((m, idx) => {
                  const statusBadge =
                    m.status === "open" ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        İncelenmedi
                      </span>
                    ) : m.status === "reviewed" ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        İncelendi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Çözüldü</span>
                      </span>
                    );

                  return (
                    <div key={m.id} className={idx > 0 ? "pt-4" : ""}>
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Question Photo (WebP Thumbnail) */}
                        {m.imageData && (
                          <div className="sm:w-44 flex-shrink-0">
                            <div
                              onClick={() => setActiveLightboxImage(m.imageData!)}
                              className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-4/3 flex items-center justify-center"
                              title="Büyütmek için tıklayın"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={m.imageData}
                                alt={`Soru Görseli - ${m.topicName}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded-md flex items-center gap-1">
                                  <ZoomIn className="w-3.5 h-3.5" />
                                  <span>Büyüt</span>
                                </span>
                              </div>
                            </div>
                            <span className="block text-center text-[10px] text-slate-400 mt-1">
                              Görseli büyütmek için tıkla
                            </span>
                          </div>
                        )}

                        {/* Question Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {REASON_LABELS[m.reason] ?? "Hata"}
                              </span>
                              {m.subjectName && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                  {m.subjectName}
                                </span>
                              )}
                            </div>
                            {statusBadge}
                          </div>

                          {/* Student Note */}
                          {m.note && (
                            <div className="mb-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-0.5">
                                <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span>Öğrenci Notu / Yanılma Sebebi:</span>
                              </span>
                              <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                                {m.note}
                              </p>
                            </div>
                          )}

                          {/* Correct Solution Note */}
                          {m.correctSolution && (
                            <div className="mb-2 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-0.5">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>Doğru Çözüm / Püf Noktası:</span>
                              </span>
                              <p className="text-xs text-emerald-900 dark:text-emerald-200 whitespace-pre-wrap">
                                {m.correctSolution}
                              </p>
                            </div>
                          )}

                          {/* Bottom Card Actions */}
                          <div className="flex items-center justify-between gap-2 pt-2 text-xs text-slate-400">
                            <span>
                              {new Date(m.createdAt).toLocaleDateString("tr-TR", {
                                day: "numeric",
                                month: "long",
                              })}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {m.status !== "reviewed" && (
                                <button
                                  onClick={() => handleStatusChange(m.id, "reviewed")}
                                  disabled={isPending}
                                  className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors min-h-[36px]"
                                >
                                  İncelendi
                                </button>
                              )}
                              {m.status !== "resolved" ? (
                                <button
                                  onClick={() => handleStatusChange(m.id, "resolved")}
                                  disabled={isPending}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors min-h-[36px]"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Çözüldü</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusChange(m.id, "open")}
                                  disabled={isPending}
                                  className="px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors min-h-[36px]"
                                >
                                  Açık Yap
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteMistake(m.id)}
                                disabled={isPending}
                                className="px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors min-h-[36px]"
                                title="Soruyu Sil"
                              >
                                Sil
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {topicKeys.length === 0 && (
          <div className="py-12 sm:py-16 px-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Yanlışlar öğrenmenin en değerli adımlarıdır!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
              Çözemediğin veya yanlış yaptığın soruları fotoğraflayarak veya not alarak ekleyebilir,
              LGS hazırlığında eksiklerini tek tek kapatabilirsin.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/70">
                Matematik
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/70">
                Türkçe
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/70">
                Fen Bilimleri
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/70">
                İnkılap Tarihi
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/70">
                Din Kültürü
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/70">
                İngilizce
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>İlk Yanlış Sorunu Ekle</span>
            </button>
          </div>
        )}
      </div>

      {/* ADD MISTAKE MODAL (APPLE BOTTOM SHEET) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 max-h-[85vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
                <Camera className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Yeni Yanlış Soru Kaydı</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMistake} className="space-y-4">
              {/* Subject Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ders Seçimi
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {subjects.map((subj) => {
                    const ModalSubjIcon = SUBJECT_ICONS[subj.code] || BookMarked;
                    return (
                      <button
                        type="button"
                        key={subj.id}
                        onClick={() => setNewSubjectId(subj.id)}
                        className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-left flex items-center gap-1.5 min-h-[44px] ${
                          newSubjectId === subj.id
                            ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                            : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <ModalSubjIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{subj.nameTr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topic Input with Datalist Suggestions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Konu Başlığı
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  list="topics-list"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="Konu adı yazın veya seçin (Örn: Çarpanlar ve Katlar)"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 min-h-[44px]"
                />
                <datalist id="topics-list">
                  {relevantTopics.map((top) => (
                    <option key={top.id} value={top.nameTr} />
                  ))}
                </datalist>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  İpucu: Harf yazarak o dersteki mevcut LGS konularından hızlıca seçebilirsiniz.
                </span>
              </div>

              {/* Mistake Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Yanlış Nedeni
                </label>
                <select
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value as MistakeReason)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 min-h-[44px]"
                >
                  <option value="attention">Dikkatsizlik</option>
                  <option value="knowledge_gap">Bilgi Eksiği</option>
                  <option value="calculation_error">İşlem Hatası</option>
                  <option value="misread">Soruyu Yanlış Okuma</option>
                  <option value="strategy">Süre / Strateji Eksikliği</option>
                  <option value="unknown">Diğer</option>
                </select>
              </div>

              {/* Photo Input (Camera or Gallery) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Soru Görseli (Kamera veya Galeri)
                </label>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
                <input
                  type="file"
                  ref={galleryInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                />

                {!newImageData ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isCompressing}
                      className="p-3 border-2 border-dashed border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-2xl flex flex-col items-center justify-center gap-1 text-blue-600 dark:text-blue-400 font-semibold text-xs min-h-[64px] transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Kameradan Çek</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={isCompressing}
                      className="p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-700 dark:text-slate-300 font-semibold text-xs min-h-[64px] transition-colors"
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span>Galeriden Seç</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-2">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={newImageData}
                        alt="Yüklenen Görsel"
                        className="w-20 h-20 object-cover rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Görsel Yüklendi</span>
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          Format: .webp • Boyut: ~{imageSizeKb} KB
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Yüksek kalite korundu, boyut optimize edildi.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewImageData(null);
                          setImageSizeKb(null);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-semibold"
                      >
                        Kaldır
                      </button>
                    </div>
                  </div>
                )}

                {isCompressing && (
                  <p className="text-xs text-blue-600 animate-pulse mt-1.5">
                    Görsel optimize ediliyor (.webp)...
                  </p>
                )}
              </div>

              {/* Student Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Öğrenci Notu (İsteğe bağlı)
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Örn: Sorudaki 'kesinlikle yanlıştır' kökünü gözden kaçırdım..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Correct Solution Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Doğru Çözüm / Püf Noktası (İsteğe bağlı)
                </label>
                <textarea
                  value={newCorrectSolution}
                  onChange={(e) => setNewCorrectSolution(e.target.value)}
                  placeholder="Örn: Formülde yarıçapı karesiyle çarpmak gerekiyordu..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 min-h-[44px]"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isPending || isCompressing}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors min-h-[44px]"
                >
                  {isPending ? "Kaydediliyor..." : "Yanlış Sorusunu Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX IMAGE MODAL */}
      {activeLightboxImage && (
        <div
          onClick={() => setActiveLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeLightboxImage}
              alt="Büyütülmüş Soru Görseli"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl mx-auto"
            />
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Kapat</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
