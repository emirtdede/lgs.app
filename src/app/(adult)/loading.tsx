import React from "react";

export default function AdultLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-80 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <div className="h-9 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-28 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        ))}
      </div>

      {/* Content boxes skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-64 space-y-4">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-64 space-y-4">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
