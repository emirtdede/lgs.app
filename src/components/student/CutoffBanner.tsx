"use client";

import { Moon, Sparkles } from "lucide-react";
import { getDailyMotivationQuote } from "@/domain/motivation-quotes";

interface CutoffBannerProps {
  planDate?: string;
  dayNumber?: number;
}

export function CutoffBanner({ planDate, dayNumber }: CutoffBannerProps = {}) {
  const quote = getDailyMotivationQuote({ dateStr: planDate, dayNumber });

  return (
    <div
      role="region"
      aria-label="Akşam Dinlenme ve Uyku Hatırlatması"
      className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800/80 dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 p-4 sm:p-5 rounded-2xl my-4 text-slate-800 dark:text-slate-200 shadow-xs"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
          <Moon className="w-5 h-5" />
        </div>
        <div className="space-y-2 flex-1">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Akşam Dinlenme ve Uyku Vakti (22:00)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
              Beyninin bugün öğrendiği tüm bilgileri kalıcı hafızaya işlemesi ve yarın en yüksek
              odaklanma gücüne ulaşması için uyku en temel çalışma aracıdır.
            </p>
          </div>

          {/* Discipline Motivation Quote */}
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900/40 text-xs sm:text-sm italic text-indigo-950 dark:text-indigo-200 shadow-xs leading-relaxed">
            <span className="inline-flex items-center gap-1 font-bold not-italic text-indigo-700 dark:text-indigo-400 mr-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Günün İlhamı:</span>
            </span>
            &ldquo;{quote}&rdquo;
          </div>
        </div>
      </div>
    </div>
  );
}
