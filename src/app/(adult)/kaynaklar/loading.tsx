import React from "react";

export default function KaynaklarLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-pulse">
      {/* Title */}
      <div className="mb-6 space-y-2">
        <div className="h-7 w-60 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>

      {/* Verification banner skeleton */}
      <div className="mb-6 h-20 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/50" />

      {/* Resources grid skeleton (9 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => (
          <div
            key={k}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-52 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3.5 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
            <div className="h-9 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
