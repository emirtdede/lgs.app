import Link from "next/link";
import { BookOpen, Eye, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 text-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800">
        <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-lg mx-auto mb-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="LGS 2027 Logo"
            className="w-full h-full object-contain p-1"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
          LGS 2027 Çalışma Takibi
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 leading-relaxed">
          Sakin, dengeli ve istikrarlı hazırlık rehberi.
        </p>

        <div className="space-y-4">
          {/* 1. Öğrenci Girişi (Etkileşimli) */}
          <Link
            href="/today"
            className="group block p-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-left shadow-lg shadow-blue-600/20 transition-all active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold">Öğrenci Girişi</span>
              </div>
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">
                Ders Masası
              </span>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed pl-11">
              Bugünkü ders planı, 20 soruluk hız sayacı, soru kayıtları ve serbest okuma.
            </p>
          </Link>

          {/* 2. Aile Girişi */}
          <Link
            href="/dashboard"
            className="group block p-5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 text-left border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <Eye className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold">Aile Girişi</span>
              </div>
              <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full font-medium">
                Veli Paneli
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-11">
              Günün tamamlanma durumu, hız grafikleri, takvim ve konu analizi.
            </p>
          </Link>
        </div>

        <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Yusuf için kişiselleştirilmiş 2026-2027 LGS çalışma rehberi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
