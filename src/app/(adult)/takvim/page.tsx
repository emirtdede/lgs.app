import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/env";
import { getCurrentAdultMember } from "@/server/adult-service";
import { getTodayDateIstanbul } from "@/domain/time-utils";
import {
  AdultCalendarClientView,
  type AdultCalendarDay,
  type AdultCalendarTask,
} from "@/components/adult/AdultCalendarClientView";

export const dynamic = "force-dynamic";

export default async function AdultCalendarPage() {
  const supabase = env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createServerSupabaseClient();
  const adult = await getCurrentAdultMember(supabase);

  if (!adult) {
    return null;
  }

  const today = getTodayDateIstanbul();

  // Fetch all plan days and tasks from Supabase
  let planDays: AdultCalendarDay[] = [];
  let tasksData: any[] = [];
  try {
    const { data: days } = await supabase
      .from("plan_days")
      .select("id, plan_date, day_number, week_number, phase")
      .order("plan_date", { ascending: true });
    planDays = (days as AdultCalendarDay[]) || [];

    const { data: tasks } = await supabase.from("tasks").select(
      `id, current_plan_day_id, title, task_type, required,
         subjects(name_tr),
         task_completions(status)`
    );
    tasksData = tasks || [];
  } catch {
    planDays = [];
    tasksData = [];
  }

  const mappedTasks: AdultCalendarTask[] = tasksData.map((t: any) => ({
    id: t.id,
    current_plan_day_id: t.current_plan_day_id,
    title: t.title,
    task_type: t.task_type,
    required: Boolean(t.required),
    subject_name: t.subjects?.name_tr,
    status: t.task_completions?.[0]?.status ?? "pending",
  }));

  return (
    <AdultCalendarClientView
      days={planDays}
      tasks={mappedTasks}
      adultRole={adult.role}
      todayDate={today}
    />
  );
}
