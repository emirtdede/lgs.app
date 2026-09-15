import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/server/student-service";
import {
  MistakesClientView,
  type MistakeItem,
  type SubjectOption,
} from "@/components/student/MistakesClientView";

export const dynamic = "force-dynamic";

export default async function StudentMistakesPage() {
  const supabase = await createServerSupabaseClient();
  const student = await getCurrentStudent(supabase);
  const studentId = student?.studentId ?? "student-local-1";

  // 1. Fetch subjects
  let subjects: SubjectOption[] = [];
  try {
    const { data: subData } = await supabase
      .from("subjects")
      .select("id, code, name_tr")
      .order("id", { ascending: true });

    if (subData && subData.length > 0) {
      subjects = (subData as any[]).map((s: any) => ({
        id: Number(s.id),
        code: String(s.code),
        nameTr: String(s.name_tr),
      }));
    }
  } catch {
    subjects = [
      { id: 1, code: "math", nameTr: "Matematik" },
      { id: 2, code: "turkish", nameTr: "Türkçe" },
      { id: 3, code: "science", nameTr: "Fen Bilimleri" },
      { id: 4, code: "history", nameTr: "T.C. İnkılap Tarihi ve Atatürkçülük" },
      { id: 5, code: "religion", nameTr: "Din Kültürü ve Ahlak Bilgisi" },
      { id: 6, code: "english", nameTr: "İngilizce" },
    ];
  }

  // Fallback defaults if subjects table was empty
  if (subjects.length === 0) {
    subjects = [
      { id: 1, code: "math", nameTr: "Matematik" },
      { id: 2, code: "turkish", nameTr: "Türkçe" },
      { id: 3, code: "science", nameTr: "Fen Bilimleri" },
      { id: 4, code: "history", nameTr: "T.C. İnkılap Tarihi ve Atatürkçülük" },
      { id: 5, code: "religion", nameTr: "Din Kültürü ve Ahlak Bilgisi" },
      { id: 6, code: "english", nameTr: "İngilizce" },
    ];
  }

  // 2. Fetch known topics
  let topics: { id: string; subjectId: number; nameTr: string }[] = [];
  try {
    const { data: topData } = await supabase
      .from("topics")
      .select("id, subject_id, name_tr")
      .order("name_tr", { ascending: true });

    if (topData) {
      topics = (topData as any[]).map((t: any) => ({
        id: String(t.id),
        subjectId: Number(t.subject_id),
        nameTr: String(t.name_tr),
      }));
    }
  } catch {
    topics = [];
  }

  // 3. Fetch mistakes for this student
  let mistakesData: any[] = [];
  try {
    const res = await supabase
      .from("mistakes")
      .select(
        "id, subject_id, topic_name, reason, note, correct_solution, image_data, status, created_at, subjects(name_tr)"
      )
      .order("created_at", { ascending: false });

    mistakesData = res.data || [];
  } catch {
    mistakesData = [];
  }

  const initialMistakes: MistakeItem[] = (mistakesData || []).map((m: any) => ({
    id: m.id,
    subjectId: m.subject_id ?? null,
    subjectName: m.subjects?.name_tr ?? null,
    topicName: m.topic_name || "Genel Sorular",
    reason: m.reason,
    note: m.note,
    correctSolution: m.correct_solution ?? null,
    imageData: m.image_data ?? null,
    status: m.status,
    createdAt: m.created_at,
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <MistakesClientView
        initialMistakes={initialMistakes}
        subjects={subjects}
        knownTopics={topics}
      />
    </div>
  );
}
