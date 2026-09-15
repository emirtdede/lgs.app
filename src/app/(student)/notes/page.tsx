import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/server/student-service";
import { NotesClientView, type StudentNoteItem } from "@/components/student/NotesClientView";

export const dynamic = "force-dynamic";

export default async function StudentNotesPage() {
  const supabase = await createServerSupabaseClient();
  const student = await getCurrentStudent(supabase);
  const studentId = student?.studentId ?? "student-local-1";

  let rawNotes: any[] = [];
  try {
    const { data } = await supabase
      .from("student_notes")
      .select("id, category, title, content, target_date, is_resolved, created_at")
      .order("created_at", { ascending: false });

    rawNotes = data || [];
  } catch {
    rawNotes = [];
  }

  const initialNotes: StudentNoteItem[] = rawNotes.map((n) => ({
    id: n.id,
    category: n.category as StudentNoteItem["category"],
    title: n.title,
    content: n.content,
    targetDate: n.target_date ?? null,
    isResolved: Boolean(n.is_resolved),
    createdAt: n.created_at,
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <NotesClientView initialNotes={initialNotes} />
    </div>
  );
}
