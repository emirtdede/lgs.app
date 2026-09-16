import React from "react";

export default function StudentLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-pulse space-y-4">
      {/* Student Today Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* Progress pill skeleton */}
      <div className="h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between" />

      {/* Task cards skeleton */}
      <div className="space-y-2.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-20 flex items-center justify-between"
          >
            <div className="space-y-2 flex-1 mr-4">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
