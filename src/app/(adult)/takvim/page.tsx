import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdultMember } from "@/server/adult-service";
import { getTodayDateIstanbul } from "@/domain/time-utils";
import { AdultCalendarClientView } from "@/components/adult/AdultCalendarClientView";
import { getCachedMasterCalendarData } from "@/server/cached-plan-service";

export const dynamic = "force-dynamic";

export default async function AdultCalendarPage() {
  const supabase = await createServerSupabaseClient();
  const adult = await getCurrentAdultMember(supabase);

  if (!adult) {
    return null;
  }

  const today = getTodayDateIstanbul();
  const { days, tasks } = await getCachedMasterCalendarData();

  return (
    <AdultCalendarClientView
      days={days}
      tasks={tasks}
      adultRole={adult.role}
      todayDate={today}
    />
  );
}
