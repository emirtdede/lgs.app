import React from "react";

export default function AnalizLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-pulse">
      {/* Title */}
      <div className="mb-6 space-y-2">
        <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-80 bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>

      {/* Curriculum cards skeleton (6 subjects) */}
      <div className="mb-8 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
        <div className="h-4 w-52 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 h-28 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* 20 question history table skeleton */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-64 p-5 space-y-3">
        <div className="h-4 w-56 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-40 bg-slate-50 dark:bg-slate-800/50 rounded-xl" />
      </div>
    </div>
  );
}
