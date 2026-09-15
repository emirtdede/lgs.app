import React from "react";
import { StudentNav } from "@/components/student/StudentNav";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <main id="main-content" className="flex-1 pb-24 md:pb-8 focus:outline-none">
        {children}
      </main>
      <StudentNav />
    </div>
  );
}
