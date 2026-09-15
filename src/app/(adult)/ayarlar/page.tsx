import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdultMember } from "@/server/adult-service";
import {
  SettingsClientView,
  type StudentInfo,
  type PairedDeviceInfo,
  type MemberInfo,
} from "@/components/adult/SettingsClientView";

export const dynamic = "force-dynamic";

export default async function AdultSettingsPage() {
  const supabase = await createServerSupabaseClient();
  const adult = await getCurrentAdultMember(supabase);

  if (!adult) {
    return null;
  }

  // 1. Fetch students
  let students: StudentInfo[] = [];
  try {
    const { data: studentsData } = await supabase
      .from("students")
      .select("id, display_name")
      .eq("family_id", adult.familyId)
      .eq("active", true);

    students = (studentsData || []).map((s: any) => ({
      id: s.id,
      displayName: s.display_name,
    }));
  } catch {
    students = [{ id: "student-local-1", displayName: "Öğrenci" }];
  }

  // 2. Fetch paired devices
  let pairedDevices: PairedDeviceInfo[] = [];
  try {
    const studentIds = students.map((s) => s.id);
    const { data: devicesData } = await supabase
      .from("student_devices")
      .select("id, device_label, paired_at, status")
      .in(
        "student_id",
        studentIds.length > 0 ? studentIds : ["00000000-0000-0000-0000-000000000000"]
      )
      .order("paired_at", { ascending: false });

    pairedDevices = (devicesData || []).map((d: any) => ({
      id: d.id,
      deviceLabel: d.device_label,
      pairedAt: d.paired_at,
      status: d.status,
    }));
  } catch {
    pairedDevices = [];
  }

  // 3. Fetch family members
  let members: MemberInfo[] = [];
  try {
    const { data: membersData } = await supabase
      .from("family_members")
      .select("auth_user_id, role")
      .eq("family_id", adult.familyId);

    members = (membersData || []).map((m: any) => ({
      authUserId: m.auth_user_id,
      role: m.role,
    }));
  } catch {
    members = [{ authUserId: "local-viewer", role: adult.role }];
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <SettingsClientView
        familyName={adult.familyName}
        timezone="Europe/Istanbul"
        currentRole={adult.role}
        students={students}
        pairedDevices={pairedDevices}
        members={members}
      />
    </div>
  );
}
