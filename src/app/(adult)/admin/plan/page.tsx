import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdultMember } from "@/server/adult-service";
import { PlanAdminClientView, type AdminTaskItem } from "@/components/adult/PlanAdminClientView";

export const dynamic = "force-dynamic";

export default async function AdminPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const adult = await getCurrentAdultMember(supabase);

  if (!adult) {
    return null;
  }

  const { taskId } = await searchParams;

  // 1. Fetch future and current plan dates for reschedule dropdown
  let availableDates: string[] = [];
  let tasks: AdminTaskItem[] = [];
  try {
    const { data: daysData } = await supabase
      .from("plan_days")
      .select("plan_date")
      .order("plan_date", { ascending: true })
      .limit(90);

    availableDates = (daysData || []).map((d: any) => d.plan_date);

    // 2. Fetch tasks with original and current plan dates
    const { data: tasksData } = await supabase
      .from("tasks")
      .select(
        `id, title, task_type, required,
         subjects(name_tr),
         plan_days!tasks_plan_day_id_fkey(plan_date),
         effective_day:plan_days!tasks_current_plan_day_id_fkey(plan_date),
         task_completions(status)`
      )
      .order("sort_order", { ascending: true });

    tasks = (tasksData || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      taskType: t.task_type,
      originalDate: t.plan_days?.plan_date ?? "",
      currentDate: t.effective_day?.plan_date ?? t.plan_days?.plan_date ?? "",
      subjectName: t.subjects?.name_tr ?? null,
      status: t.task_completions?.[0]?.status ?? "pending",
      required: t.required,
    }));
  } catch {
    availableDates = [];
    tasks = [];
  }

  // Fallback to curriculum initial tasks if empty
  if (tasks.length === 0) {
    availableDates = [
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
    ];
    tasks = [
      {
        id: "task-1",
        title: "Matematik 20 Soru (Benchmark)",
        taskType: "question",
        originalDate: "2026-10-01",
        currentDate: "2026-10-01",
        subjectName: "Matematik",
        status: "completed",
        required: true,
      },
      {
        id: "task-2",
        title: "Paragraf 20 Soru (Benchmark)",
        taskType: "question",
        originalDate: "2026-10-01",
        currentDate: "2026-10-01",
        subjectName: "Türkçe",
        status: "completed",
        required: true,
      },
      {
        id: "task-3",
        title: "Şenol Hoca — Çarpanlar ve Katlar Konu Anlatımı Video 1",
        taskType: "video",
        originalDate: "2026-10-02",
        currentDate: "2026-10-02",
        subjectName: "Matematik",
        status: "pending",
        required: true,
      },
      {
        id: "task-4",
        title: "Kitap Okuma (30 dk)",
        taskType: "reading",
        originalDate: "2026-10-01",
        currentDate: "2026-10-01",
        subjectName: "Rehberlik",
        status: "completed",
        required: false,
      },
    ];
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <PlanAdminClientView
        tasks={tasks}
        availableDates={availableDates}
        role={adult.role}
        initialSelectedTaskId={taskId}
      />
    </div>
  );
}
