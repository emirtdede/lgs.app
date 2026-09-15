import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStudentTodayData } from "@/server/student-service";
import { TodayClientView } from "@/components/student/TodayClientView";

export const dynamic = "force-dynamic";

export default async function StudentTodayPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string; bypassCutoff?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const requestedDate = resolvedParams?.date;
  const bypassCutoff = resolvedParams?.bypassCutoff === "true";
  const supabase = await createServerSupabaseClient();
  const { student, todayData } = await getStudentTodayData(supabase, {
    requestedDate,
    bypassCutoff,
  });

  return <TodayClientView key={todayData.planDate} student={student} initialData={todayData} />;
}
