import React from "react";

export default function TakvimLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-pulse">
      {/* Title */}
      <div className="mb-6 space-y-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>

        {/* Quick jump buttons skeleton (3 columns) */}
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:gap-2">
          <div className="h-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Phase tabs skeleton (2x2 grid) */}
        <div className="grid grid-cols-2 sm:flex sm:gap-2 gap-1.5">
          <div className="h-11 rounded-xl bg-blue-100 dark:bg-blue-950/40" />
          <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
        </div>

        {/* Search input skeleton */}
        <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/80" />
      </div>

      {/* Days skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((d) => (
          <div
            key={d}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((t) => (
                <div
                  key={t}
                  className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-2.5"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
