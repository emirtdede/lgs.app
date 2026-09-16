"use client";

import React, { useState, useTransition } from "react";
import {
  RotateCcw,
  Clock,
  Rocket,
  FileText,
  Check,
  Calendar,
  Search,
  CheckCircle2,
  X,
  Plus,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import {
  addStudentNoteAction,
  toggleStudentNoteResolvedAction,
  deleteStudentNoteAction,
} from "@/application/student-actions";

export interface StudentNoteItem {
  id: string;
  category: "telafi" | "extra_time" | "future_plan" | "general";
  title: string;
  content: string;
  targetDate: string | null;
  isResolved: boolean;
  createdAt: string;
}

export type LgsSubject =
  "all" | "matematik" | "turkce" | "fen" | "inkilap" | "din" | "ingilizce" | "genel";

export const LGS_SUBJECTS: { id: LgsSubject; label: string; badge: string }[] = [
  {
    id: "all",
    label: "Tüm Dersler",
    badge: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  },
  {
    id: "matematik",
    label: "Matematik",
    badge:
      "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  {
    id: "turkce",
    label: "Türkçe",
    badge:
      "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  },
  {
    id: "fen",
    label: "Fen Bilimleri",
    badge:
      "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  {
    id: "inkilap",
    label: "İnkılap Tarihi",
    badge:
      "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  {
    id: "din",
    label: "Din Kültürü",
    badge:
      "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  {
    id: "ingilizce",
    label: "İngilizce",
    badge:
      "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
  },
  {
    id: "genel",
    label: "Genel Notlar",
    badge:
      "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
];

export function detectNoteSubject(note: { title: string; content: string }): LgsSubject {
  const text = (note.title + " " + note.content).toLowerCase();
  if (
    text.includes("matematik") ||
    text.includes("çarpan") ||
    text.includes("carpan") ||
    text.includes("ebob") ||
    text.includes("ekok") ||
    text.includes("üslü") ||
    text.includes("uslu") ||
    text.includes("köklü") ||
    text.includes("koklu") ||
    text.includes("geometri")
  ) {
    return "matematik";
  }
  if (
    text.includes("türkçe") ||
    text.includes("turkce") ||
    text.includes("paragraf") ||
    text.includes("fiilimsi") ||
    text.includes("cümle")
  ) {
    return "turkce";
  }
  if (
    text.includes("fen") ||
    text.includes("mitoz") ||
    text.includes("mayoz") ||
    text.includes("dna") ||
    text.includes("genetik") ||
    text.includes("basınç") ||
    text.includes("basinc") ||
    text.includes("periyodik")
  ) {
    return "fen";
  }
  if (
    text.includes("inkılap") ||
    text.includes("inkilap") ||
    text.includes("tarih") ||
    text.includes("atatürk") ||
    text.includes("ataturk") ||
    text.includes("lozan") ||
    text.includes("kongre")
  ) {
    return "inkilap";
  }
  if (
    text.includes("din") ||
    text.includes("kader") ||
    text.includes("zekat") ||
    text.includes("sadaka") ||
    text.includes("hac")
  ) {
    return "din";
  }
  if (
    text.includes("ingilizce") ||
    text.includes("english") ||
    text.includes("friendship") ||
    text.includes("teen life")
  ) {
    return "ingilizce";
  }
  return "genel";
}

interface NotesClientViewProps {
  initialNotes: StudentNoteItem[];
}

const CATEGORY_CONFIG: Record<
  StudentNoteItem["category"],
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
    desc: string;
  }
> = {
  telafi: {
    label: "Eksikler & Telafi",
    icon: RotateCcw,
    badgeClass:
      "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    desc: "Aksaklıklar sonrası tamamlanamayan günler ve telafi edilecek konular",
  },
  extra_time: {
    label: "Daha Fazla Zaman Ayrılacaklar",
    icon: Clock,
    badgeClass:
      "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    desc: "1 günde bitmeyen veya pekiştirilmesi gereken zorlu konular",
  },
  future_plan: {
    label: "Gelecek Planı",
    icon: Rocket,
    badgeClass:
      "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    desc: "Gelecekte hedeflenen çalışma adımları ve stratejiler",
  },
  general: {
    label: "Genel Notlar",
    icon: FileText,
    badgeClass:
      "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    desc: "Kişisel çalışma notları, ipuçları ve hatırlatmalar",
  },
};

export function NotesClientView({ initialNotes }: NotesClientViewProps) {
  const [notes, setNotes] = useState<StudentNoteItem[]>(initialNotes);
  const [selectedSubject, setSelectedSubject] = useState<LgsSubject>("all");
  const [isSubjectMenuOpen, setIsSubjectMenuOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved">("active");

  const [searchQuery, setSearchQuery] = useState("");

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<StudentNoteItem["category"]>("telafi");
  const [newSubject, setNewSubject] = useState<LgsSubject>("genel");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTargetDate, setNewTargetDate] = useState("");

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Toggle resolved status
  const handleToggleResolved = (noteId: string, currentResolved: boolean) => {
    const nextState = !currentResolved;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await toggleStudentNoteResolvedAction(noteId, nextState);
      if (res.success) {
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? { ...n, isResolved: nextState } : n))
        );
      } else {
        setErrorMsg(res.errorMessage ?? "Not güncellenemedi.");
      }
    });
  };

  // Delete note
  const handleDeleteNote = (noteId: string) => {
    if (!window.confirm("Bu notu silmek istediğinize emin misiniz?")) {
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      const res = await deleteStudentNoteAction(noteId);
      if (res.success) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      } else {
        setErrorMsg(res.errorMessage ?? "Not silinemedi.");
      }
    });
  };

  // Add new note submission
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setErrorMsg("Lütfen hem başlık hem de not içeriğini doldurun.");
      return;
    }

    const titleToSave = newTitle.trim();
    const subjectCfg = LGS_SUBJECTS.find((s) => s.id === newSubject);
    const contentToSave =
      newSubject !== "genel" &&
      subjectCfg &&
      !newContent.toLowerCase().includes(newSubject) &&
      !newTitle.toLowerCase().includes(newSubject)
        ? `${newContent.trim()}\n\n[Ders: ${subjectCfg.label}]`
        : newContent.trim();
    const categoryToSave = newCategory;
    const targetDateToSave = newTargetDate.trim();

    setErrorMsg(null);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewContent("");
    setNewTargetDate("");
    setNewSubject("genel");

    startTransition(async () => {
      const res = await addStudentNoteAction({
        category: categoryToSave,
        title: titleToSave,
        content: contentToSave,
        targetDate: targetDateToSave || undefined,
      });

      if (res.success && res.data) {
        const newItem: StudentNoteItem = {
          id: res.data.noteId,
          category: categoryToSave,
          title: titleToSave,
          content: contentToSave,
          targetDate: targetDateToSave || null,
          isResolved: false,
          createdAt: new Date().toISOString(),
        };

        setNotes((prev) => [newItem, ...prev]);
        setSuccessMsg("Notun başarıyla kaydedildi! Aile paneline de yansıtıldı.");
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        setErrorMsg(res.errorMessage ?? "Not kaydedilemedi.");
      }
    });
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (selectedSubject !== "all" && detectNoteSubject(n) !== selectedSubject) {
      return false;
    }
    if (statusFilter === "active" && n.isResolved) {
      return false;
    }
    if (statusFilter === "resolved" && !n.isResolved) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = n.title.toLowerCase().includes(q);
      const contentMatch = n.content.toLowerCase().includes(q);
      if (!titleMatch && !contentMatch) {
        return false;
      }
    }
    return true;
  });

  const activeCount = notes.filter((n) => !n.isResolved).length;
  const resolvedCount = notes.filter((n) => n.isResolved).length;

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* 1. APPLE MINIMALIST NAVIGATION BAR */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate whitespace-nowrap">
            Çalışma Notlarım
          </h1>
          {notes.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 shrink-0">
              {notes.length} Not
            </span>
          )}
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-semibold shadow-xs transition-all active:scale-[0.98] shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Not Yaz</span>
        </button>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <span>✓</span> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200">
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
            placeholder="Not başlıklarında veya içeriğinde ara..."
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
              selectedSubject === "all"
                ? "bg-slate-100 dark:bg-slate-800/80 border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                : "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-xs"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{LGS_SUBJECTS.find((s) => s.id === selectedSubject)?.label ?? "Ders Seç"}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isSubjectMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsSubjectMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Ders Filtresi
                </div>
                {LGS_SUBJECTS.map((sub) => {
                  const isSelected = selectedSubject === sub.id;
                  const count =
                    sub.id === "all"
                      ? notes.length
                      : notes.filter((n) => detectNoteSubject(n) === sub.id).length;

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubject(sub.id);
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
                        <span>{sub.label}</span>
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
          onClick={() => setStatusFilter("active")}
          className={`py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
            statusFilter === "active"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <span>Bekleyen</span>
          {activeCount > 0 && (
            <span className="text-[10px] font-semibold opacity-70">({activeCount})</span>
          )}
        </button>

        <button
          onClick={() => setStatusFilter("resolved")}
          className={`py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
            statusFilter === "resolved"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <span>Tamamlanan</span>
          {resolvedCount > 0 && (
            <span className="text-[10px] font-semibold opacity-70">({resolvedCount})</span>
          )}
        </button>

        <button
          onClick={() => setStatusFilter("all")}
          className={`py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
            statusFilter === "all"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <span>Tümü</span>
          {notes.length > 0 && (
            <span className="text-[10px] font-semibold opacity-70">({notes.length})</span>
          )}
        </button>
      </div>

      {/* 4. NOTES LIST & APPLE AIRY EMPTY STATES */}
      <div className="space-y-3">
        {filteredNotes.map((note) => {
          const cfg = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.general;
          const CardIcon = cfg.icon;
          const noteSub = detectNoteSubject(note);
          const subCfg = LGS_SUBJECTS.find((s) => s.id === noteSub);

          return (
            <div
              key={note.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                note.isResolved
                  ? "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-75"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cfg.badgeClass}`}
                  >
                    <CardIcon className="w-3 h-3 shrink-0" />
                    <span>{cfg.label}</span>
                  </span>

                  {subCfg && subCfg.id !== "all" && subCfg.id !== "genel" && (
                    <span
                      className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${subCfg.badge}`}
                    >
                      {subCfg.label}
                    </span>
                  )}

                  {note.targetDate && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                      <Calendar className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Hedef: {note.targetDate}</span>
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-slate-400">
                  {new Date(note.createdAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Title & Content */}
              <h2
                className={`text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5 ${
                  note.isResolved ? "line-through text-slate-500 dark:text-slate-400" : ""
                }`}
              >
                {note.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed mb-3">
                {note.content}
              </p>

              {/* Card Bottom Actions */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  {note.isResolved ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 text-xs">
                      <Check className="w-3.5 h-3.5" />
                      <span>Telafi Edildi / Tamamlandı</span>
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Tamamlanmayı Bekliyor</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleResolved(note.id, note.isResolved)}
                    disabled={isPending}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px] ${
                      note.isResolved
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                        : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    {note.isResolved ? "Geri Al (Aç)" : "✓ Tamamlandı İşaretle"}
                  </button>

                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={isPending}
                    title="Notu sil"
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* APPLE AIRY EMPTY STATES */}
        {filteredNotes.length === 0 && (
          <>
            {/* Scenario A: Completely empty notes list in database */}
            {notes.length === 0 && (
              <div className="py-12 sm:py-16 px-4 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center">
                  <FileText className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Kendi çalışma stratejilerini ve telafilerini kaydet!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Yoğun geçen günlerde tamamlayamadığın konuları, ekstra zaman ayırmak istediğin
                  zorlu kısımları veya geleceğe dair çalışma hedeflerini buraya yazabilirsin.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/70">
                    Eksikler & Telafi
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/70">
                    Daha Fazla Zaman Ayrılacaklar
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/70">
                    Gelecek Planı
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>İlk Notunu Yaz</span>
                </button>
              </div>
            )}

            {/* Scenario B: Viewing 'active' filter but all notes are already resolved */}
            {notes.length > 0 && statusFilter === "active" && activeCount === 0 && (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Harika! Bekleyen telafi notun yok
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Şu an bekleyen hiçbir eksik konun bulunmuyor. Tamamladığın {resolvedCount} notunu
                  inceleyebilir veya yeni bir not ekleyebilirsin.
                </p>
                <button
                  type="button"
                  onClick={() => setStatusFilter("resolved")}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Tamamlanan Notları Göster ({resolvedCount})
                </button>
              </div>
            )}

            {/* Scenario C: Filter or search query returned 0 matches */}
            {notes.length > 0 && !(statusFilter === "active" && activeCount === 0) && (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <Search className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Aramanıza uygun not bulunamadı
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Farklı bir arama terimi deneyebilir veya filtreleri temizleyebilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSubject("all");
                    setStatusFilter("all");
                  }}
                  className="mt-3 px-3.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. ADD NOTE MODAL (APPLE BOTTOM SHEET) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 max-h-[85vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Yeni Not Ekle</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNote} className="space-y-4">
              {/* Category Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kategori Seçimi
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(CATEGORY_CONFIG) as Array<StudentNoteItem["category"]>).map(
                    (catKey) => {
                      const cfg = CATEGORY_CONFIG[catKey];
                      const ModalCatIcon = cfg.icon;
                      const isSelected = newCategory === catKey;

                      return (
                        <button
                          type="button"
                          key={catKey}
                          onClick={() => setNewCategory(catKey)}
                          className={`p-3 text-left rounded-xl border transition-all min-h-[52px] ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-800 dark:text-blue-200 ring-1 ring-blue-500/30"
                              : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold mb-0.5">
                            <ModalCatIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{cfg.label}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block line-clamp-1">
                            {cfg.desc}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Subject Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İlgili Ders (İsteğe bağlı)
                </label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value as LgsSubject)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[44px]"
                >
                  <option value="genel">Genel / Tüm Dersler</option>
                  <option value="matematik">Matematik</option>
                  <option value="turkce">Türkçe</option>
                  <option value="fen">Fen Bilimleri</option>
                  <option value="inkilap">T.C. İnkılap Tarihi</option>
                  <option value="din">Din Kültürü</option>
                  <option value="ingilizce">İngilizce</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Başlık
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Örn: 14 Ekim Fen Telafisi, Mitoz-Mayoz Pekiştirme"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[44px]"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Not Detayı
                </label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Nerede geri kaldın? Hangi konulara ekstra süre ayırman gerekiyor? Gelecek planın nedir?..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Optional Target Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hedef Tamamlama / Telafi Tarihi (İsteğe bağlı)
                </label>
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[40px]"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px]"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-full text-xs font-semibold shadow-xs transition-colors min-h-[44px]"
                >
                  {isPending ? "Kaydediliyor..." : "Notu Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
