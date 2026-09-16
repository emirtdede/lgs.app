import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/env";
import { getCurrentAdultMember } from "@/server/adult-service";
import { PlanAdminClientView, type AdminTaskItem } from "@/components/adult/PlanAdminClientView";

export const dynamic = "force-dynamic";

export default async function AdminPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string }>;
}) {
  const supabase = env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createServerSupabaseClient();
  const adult = await getCurrentAdultMember(supabase);

  if (!adult) {
    return null;
  }

  const { taskId } = await searchParams;

  // 1. Fetch future and current plan dates for reschedule dropdown (all 256 days)
  let availableDates: string[] = [];
  let tasks: AdminTaskItem[] = [];
  try {
    const { data: daysData } = await supabase
      .from("plan_days")
      .select("plan_date")
      .order("plan_date", { ascending: true })
      .limit(1000);

    availableDates = (daysData || []).map((d: any) => d.plan_date);

    // 2. Fetch tasks with original and current plan dates (all 2,947 tasks)
    const { data: tasksData } = await supabase
      .from("tasks")
      .select(
        `id, title, task_type, required,
         subjects(name_tr),
         plan_days!tasks_plan_day_id_fkey(plan_date),
         effective_day:plan_days!tasks_current_plan_day_id_fkey(plan_date),
         task_completions(status)`
      )
      .order("sort_order", { ascending: true })
      .limit(10000);

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
