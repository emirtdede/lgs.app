import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/env";
import {
  StudentPlanClientView,
  type PlanDayItem,
} from "@/components/student/StudentPlanClientView";

export const dynamic = "force-dynamic";

export default async function StudentPlanPage() {
  const supabase = env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createServerSupabaseClient();

  // Fetch all real plan days from Supabase
  let days: PlanDayItem[] = [];
  try {
    const { data } = await supabase
      .from("plan_days")
      .select("id, plan_date, day_number, week_number, phase")
      .order("plan_date", { ascending: true });
    days = (data as PlanDayItem[]) || [];
  } catch {
    days = [];
  }

  return <StudentPlanClientView days={days} />;
}
