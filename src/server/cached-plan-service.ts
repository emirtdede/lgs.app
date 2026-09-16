import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface CachedPlanDay {
  id: string;
  plan_date: string;
  day_number: number;
  week_number: number;
  phase: string;
}

export interface CachedPlanTask {
  id: string;
  current_plan_day_id: string;
  title: string;
  task_type: string;
  required: boolean;
  subject_name?: string;
  status: string;
}

/**
 * Returns cached master plan days and tasks.
 * Serves in ~1ms from Next.js server memory cache instead of 800ms remote SQL latency.
 * Revalidates every hour or immediately on-demand via revalidateTag('plan-data').
 */
export const getCachedMasterCalendarData = unstable_cache(
  async (): Promise<{ days: CachedPlanDay[]; tasks: CachedPlanTask[] }> => {
    const supabase = env.SUPABASE_SERVICE_ROLE_KEY
      ? createAdminClient()
      : await createServerSupabaseClient();

    const { data: daysData } = await supabase
      .from("plan_days")
      .select("id, plan_date, day_number, week_number, phase")
      .order("plan_date", { ascending: true })
      .limit(1000);

    const { data: tasksData } = await supabase
      .from("tasks")
      .select(
        `id, current_plan_day_id, title, task_type, required,
         subjects(name_tr),
         task_completions(status)`
      )
      .limit(10000);

    const days: CachedPlanDay[] = (daysData as CachedPlanDay[]) || [];
    const tasks: CachedPlanTask[] = ((tasksData as any[]) || []).map((t) => ({
      id: t.id,
      current_plan_day_id: t.current_plan_day_id,
      title: t.title,
      task_type: t.task_type,
      required: Boolean(t.required),
      subject_name: t.subjects?.name_tr,
      status: t.task_completions?.[0]?.status ?? "pending",
    }));

    return { days, tasks };
  },
  ["lgs-master-calendar-cache"],
  {
    revalidate: 3600,
    tags: ["plan-data"],
  }
);
