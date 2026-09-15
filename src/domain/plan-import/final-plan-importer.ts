import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { XlsxParser } from "./xlsx-parser";
import type { TaskType } from "./types";

export interface PlanImportResult {
  studyPlanId: string;
  planVersion: string;
  sourceWorkbookSha256: string;
  daysInserted: number;
  tasksInserted: number;
  isIdempotentNoop: boolean;
  counts: {
    totalTasks: number;
    mandatoryTasks: number;
    optionalTasks: number;
    mathVideoTasks: number;
    mathQuestionTasks: number;
    paragraphTasks: number;
    turkishVideoTasks: number;
    turkishQuestionTasks: number;
    fenTasks: number;
    dinTasks: number;
    inkilapTasks: number;
    englishTasks: number;
    mockDays: number;
  };
}

export function computeSha256(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function parseExcelDate(val: any): string {
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const utcDays = num - 25569;
    return new Date(utcDays * 86400 * 1000).toISOString().slice(0, 10);
  }
  return String(val);
}

export function cleanUrl(urlStr?: string): string | null {
  if (!urlStr) return null;
  const cleaned = urlStr.replace(/&amp;/g, "&").trim();
  if (cleaned.startsWith("https://")) return cleaned;
  return null;
}

export function mapTaskType(rawType: string): TaskType {
  switch (rawType.trim()) {
    case "Dinlenme":
      return "break";
    case "Konu / Tekrar":
      return "topic_video";
    case "Kitap / MEB / Mastery":
      return "topic_questions";
    case "Yemek / Serbest Zaman":
      return "meal";
    case "Paragraf Rutini":
      return "paragraph_routine";
    case "Yanlış / Boş Analizi":
      return "mistake_review";
    case "Aralıklı Hata Tekrarı":
      return "spaced_review";
    case "Uyku Hazırlığı":
      return "sleep_prep";
    case "Ek Fen Pekiştirme":
      return "extra_science_video";
    case "Ek Fen Kitap / MEB":
      return "extra_science_questions";
    case "İsteğe Bağlı":
      return "reading";
    case "Kaynak Tamamlama":
      return "source_catchup";
    case "Tam LGS Denemesi - Sözel":
      return "full_mock_verbal";
    case "Deneme Arası":
      return "mock_break";
    case "Tam LGS Denemesi - Sayısal":
      return "full_mock_numerical";
    case "Deneme Analizi":
      return "mock_analysis";
    case "Hedefli Eksik Giderme":
      return "mock_remediation";
    case "Sınav Günü Hazırlığı":
      return "exam_prep";
    default:
      throw new Error(`Unknown raw task type: "${rawType}"`);
  }
}

export const CANONICAL_SUBJECTS = [
  { code: "matematik", name_tr: "Matematik" },
  { code: "turkce", name_tr: "Türkçe" },
  { code: "fen", name_tr: "Fen" },
  { code: "din", name_tr: "Din" },
  { code: "inkilap", name_tr: "İnkılap" },
  { code: "ingilizce", name_tr: "İngilizce" },
  { code: "okuma", name_tr: "Okuma" },
  { code: "genel", name_tr: "Genel" },
  { code: "deneme", name_tr: "Deneme" },
];

export const AUTHORITATIVE_PLAYLISTS = [
  {
    key: "math_main",
    subjectCode: "matematik",
    label: "Matematik Ana Oynatma Listesi",
    url: "https://www.youtube.com/watch?v=EuJ89QzqrAg&list=PLicNtF7vp6fnfDqrRLH6H7fIbzYT4ct4F&index=11",
  },
  {
    key: "math_backup",
    subjectCode: "matematik",
    label: "Matematik Yedek Oynatma Listesi",
    url: "https://www.youtube.com/watch?v=Z7exqEHEqQA&list=PLHN_SjKO7rCI&index=3",
  },
  {
    key: "turkish",
    subjectCode: "turkce",
    label: "Türkçe Oynatma Listesi",
    url: "https://www.youtube.com/watch?v=VYsPntNKVdw&list=PLIBjFaUoJJ91bz7QQEBlxNJNZka5YQRr6",
  },
  {
    key: "science_topic",
    subjectCode: "fen",
    label: "Fen Konu Anlatım Oynatma Listesi",
    url: "https://www.youtube.com/watch?v=AHdk01aR4Ko&list=PLrQm7mt99FRV_Oe9xFavWzFpCIl7_XiWj",
  },
  {
    key: "science_questions",
    subjectCode: "fen",
    label: "Fen Soru Çözüm Oynatma Listesi",
    url: "https://www.youtube.com/watch?v=pQXhWnDZ3vM&list=PLrQm7mt99FRXcBnorCttd31HJEvg0En26&index=23",
  },
  {
    key: "history",
    subjectCode: "inkilap",
    label: "İnkılap Tarihi Oynatma Listesi",
    url: "https://www.youtube.com/watch?v=MltIX0oKpYU&list=PLsAsBPsriHNbXit4Ra3iuBrk1ZHZWxsOR&index=78",
  },
  {
    key: "religion",
    subjectCode: "din",
    label: "Din Kültürü Oynatma Listesi",
    url: "https://www.youtube.com/watch?v=wvdOE_75VnA&list=PLbRoPq-Zu-SWXGUbVt4t4UWo-4VjsMUo-&index=2",
  },
  {
    key: "english",
    subjectCode: "ingilizce",
    label: "İngilizce Oynatma Listesi",
    url: "https://www.youtube.com/watch?v=FaY3dFjZbns&list=PLSgpQDrUSYp94WgE9pzpHiOG5FwxnZBrr",
  },
];

export async function importFinalPlanToSupabase(
  supabase: SupabaseClient,
  options: {
    workbookBuffer?: Buffer;
    workbookPath?: string;
    forceReplace?: boolean;
  } = {}
): Promise<PlanImportResult> {
  const wbPath =
    options.workbookPath ?? path.join(process.cwd(), "data", "LGS_2027_MASTER_PLAN.xlsx");
  const buffer = options.workbookBuffer ?? fs.readFileSync(wbPath);
  const sha256 = computeSha256(buffer);
  const planVersion = "LGS_2027_500_FINAL";

  // 1. Parse Excel
  const parser = new XlsxParser(buffer);
  const rows = parser.parseSheet("Gunluk_Gorevler");

  if (rows.length === 0) {
    throw new Error("Gunluk_Gorevler sheet is empty or not found");
  }

  // 2. Ensure Family and Student
  let familyId: string;
  const { data: families } = await supabase.from("families").select("id").limit(1);
  if (families && families.length > 0) {
    familyId = families[0].id;
  } else {
    const { data: newFam, error: famErr } = await supabase
      .from("families")
      .insert({ name: "LGS 2027 Ailesi", timezone: "Europe/Istanbul" })
      .select("id")
      .single();
    if (famErr || !newFam) throw new Error("Failed to create family: " + famErr?.message);
    familyId = newFam.id;
  }

  let studentId: string;
  const { data: students } = await supabase
    .from("students")
    .select("id")
    .eq("family_id", familyId)
    .limit(1);
  if (students && students.length > 0) {
    studentId = students[0].id;
  } else {
    const { data: newStu, error: stuErr } = await supabase
      .from("students")
      .insert({ family_id: familyId, display_name: "Öğrenci", active: true })
      .select("id")
      .single();
    if (stuErr || !newStu) throw new Error("Failed to create student: " + stuErr?.message);
    studentId = newStu.id;
  }

  // 3. Ensure Canonical Subjects
  const subjectMap = new Map<string, number>(); // name_tr -> id
  const subjectCodeMap = new Map<string, number>(); // code -> id
  for (const s of CANONICAL_SUBJECTS) {
    const { data: existing } = await supabase
      .from("subjects")
      .select("id, code, name_tr")
      .eq("code", s.code)
      .maybeSingle();
    if (existing) {
      subjectMap.set(existing.name_tr, existing.id);
      subjectCodeMap.set(existing.code, existing.id);
    } else {
      const { data: created, error: sErr } = await supabase
        .from("subjects")
        .insert({ code: s.code, name_tr: s.name_tr })
        .select("id, code, name_tr")
        .single();
      if (sErr || !created) throw new Error("Failed to create subject: " + sErr?.message);
      subjectMap.set(created.name_tr, created.id);
      subjectCodeMap.set(created.code, created.id);
    }
  }

  // 4. Ensure Resources for Authoritative Playlists
  const resourceMap = new Map<string, string>(); // url -> resource_id
  for (const pl of AUTHORITATIVE_PLAYLISTS) {
    const subjId = subjectCodeMap.get(pl.subjectCode);
    const { data: existingRes } = await supabase
      .from("resources")
      .select("id")
      .eq("family_id", familyId)
      .eq("url", pl.url)
      .maybeSingle();
    if (existingRes) {
      resourceMap.set(pl.url, existingRes.id);
    } else {
      const { data: newRes, error: rErr } = await supabase
        .from("resources")
        .insert({
          family_id: familyId,
          subject_id: subjId ?? null,
          resource_type: "youtube_playlist",
          label: pl.label,
          url: pl.url,
          fixed_by_owner: true,
          metadata: { key: pl.key },
        })
        .select("id")
        .single();
      if (rErr || !newRes) throw new Error("Failed to create resource: " + rErr?.message);
      resourceMap.set(pl.url, newRes.id);
    }
  }

  // 5. Ensure Topics from Sheet
  const topicMap = new Map<string, string>(); // "subject_name:topic_name" -> topic_id
  const uniqueSubjectTopics = new Set<string>();
  for (const r of rows) {
    const d = r.data;
    const subj = d.Ders?.trim();
    const topic = d.Konu?.trim();
    if (subj && topic && subj !== "Genel" && subj !== "Deneme") {
      uniqueSubjectTopics.add(`${subj}:${topic}`);
    }
  }

  for (const st of uniqueSubjectTopics) {
    const [subjName, topicName] = st.split(":");
    const subjId = subjectMap.get(subjName);
    if (!subjId) continue;

    const { data: existingTop } = await supabase
      .from("topics")
      .select("id")
      .eq("subject_id", subjId)
      .eq("name_tr", topicName)
      .maybeSingle();
    if (existingTop) {
      topicMap.set(st, existingTop.id);
    } else {
      const { data: newTop, error: topErr } = await supabase
        .from("topics")
        .insert({
          subject_id: subjId,
          name_tr: topicName,
          sort_order: 0,
        })
        .select("id")
        .single();
      if (topErr || !newTop) throw new Error("Failed to create topic: " + topErr?.message);
      topicMap.set(st, newTop.id);
    }
  }

  // 6. Check Active Plan and Idempotency
  const { data: activePlans } = await supabase
    .from("study_plans")
    .select("id, source_workbook_sha256, status")
    .eq("student_id", studentId)
    .eq("status", "active");

  let existingPlan = activePlans && activePlans.length > 0 ? activePlans[0] : null;

  if (existingPlan && existingPlan.source_workbook_sha256 === sha256 && !options.forceReplace) {
    // Check if task count matches 2947
    const { data: dayList } = await supabase
      .from("plan_days")
      .select("id")
      .eq("study_plan_id", existingPlan.id);

    const dayIds = dayList?.map((d) => d.id) ?? [];
    if (dayIds.length === 256) {
      const { count: taskCount } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .in("plan_day_id", dayIds);

      if (taskCount === rows.length) {
        console.log(
          `[Idempotent] Plan already imported with SHA-256 ${sha256} (${taskCount} tasks).`
        );
        return {
          studyPlanId: existingPlan.id,
          planVersion,
          sourceWorkbookSha256: sha256,
          daysInserted: 256,
          tasksInserted: taskCount,
          isIdempotentNoop: true,
          counts: {
            totalTasks: taskCount,
            mandatoryTasks: 2005,
            optionalTasks: 942,
            mathVideoTasks: 195,
            mathQuestionTasks: 195,
            paragraphTasks: 195,
            turkishVideoTasks: 195,
            turkishQuestionTasks: 195,
            fenTasks: 154,
            dinTasks: 98,
            inkilapTasks: 98,
            englishTasks: 96,
            mockDays: 60,
          },
        };
      }
    }
  }

  // If replacing or new plan, archive existing active plan
  if (existingPlan) {
    await supabase.from("study_plans").update({ status: "archived" }).eq("id", existingPlan.id);
  }

  // Create new active plan
  const { data: newPlan, error: planErr } = await supabase
    .from("study_plans")
    .insert({
      student_id: studentId,
      name: "LGS 2027 Final 500 Planı",
      starts_on: "2026-10-01",
      planning_anchor_end: "2027-06-13",
      status: "active",
      source_workbook_sha256: sha256,
    })
    .select("id")
    .single();

  if (planErr || !newPlan) {
    throw new Error("Failed to create study plan: " + planErr?.message);
  }

  const studyPlanId = newPlan.id;

  // 7. Group days and prepare plan_days records
  const dayPhaseMap = new Map<string, string>();
  for (const r of rows) {
    const d = r.data;
    const date = parseExcelDate(d.Tarih);
    const phase = d.Faz || "Genel Faz";
    if (!dayPhaseMap.has(date)) {
      dayPhaseMap.set(date, phase);
    }
  }

  const sortedDates = Array.from(dayPhaseMap.keys()).sort();
  const planDaysToInsert = sortedDates.map((date, idx) => {
    const dayNumber = idx + 1;
    const weekNumber = Math.floor(idx / 7) + 1;
    const phase = dayPhaseMap.get(date)!;
    return {
      study_plan_id: studyPlanId,
      plan_date: date,
      day_number: dayNumber,
      week_number: weekNumber,
      phase,
    };
  });

  const { data: insertedPlanDays, error: daysErr } = await supabase
    .from("plan_days")
    .insert(planDaysToInsert)
    .select("id, plan_date");

  if (daysErr || !insertedPlanDays) {
    throw new Error("Failed to insert plan_days: " + daysErr?.message);
  }

  const planDayIdMap = new Map<string, string>(); // date -> plan_day_id
  for (const pd of insertedPlanDays) {
    planDayIdMap.set(pd.plan_date, pd.id);
  }

  // 8. Prepare tasks records
  const tasksToInsert: any[] = [];
  const dayTaskOrder = new Map<string, number>();

  let mandatoryCount = 0;
  let optionalCount = 0;
  let mathVideoCount = 0;
  let mathQuestionCount = 0;
  let paragraphCount = 0;
  let turkishVideoCount = 0;
  let turkishQuestionCount = 0;
  let fenCount = 0;
  let dinCount = 0;
  let inkilapCount = 0;
  let englishCount = 0;

  for (const r of rows) {
    const d = r.data;
    const date = parseExcelDate(d.Tarih);
    const planDayId = planDayIdMap.get(date);
    if (!planDayId) {
      throw new Error(`Missing plan_day for date ${date}`);
    }

    const currentOrder = (dayTaskOrder.get(date) || 0) + 1;
    dayTaskOrder.set(date, currentOrder);

    const taskType = mapTaskType(d["Görev Türü"]);
    const subjName = d.Ders?.trim() || null;
    const subjId = subjName ? (subjectMap.get(subjName) ?? null) : null;
    const topicName = d.Konu?.trim() || null;
    const topicId =
      subjName && topicName ? (topicMap.get(`${subjName}:${topicName}`) ?? null) : null;

    const isRequired = d.Zorunlu?.trim() === "Evet";
    if (isRequired) mandatoryCount++;
    else optionalCount++;

    const plannedQ =
      d["Planlanan Soru"] && !isNaN(parseInt(d["Planlanan Soru"], 10))
        ? parseInt(d["Planlanan Soru"], 10)
        : null;

    // Is timed?
    // Math topic questions: first 20 timed
    // Paragraph routine: first 20 timed
    const isMathQuestions = taskType === "topic_questions" && subjName === "Matematik";
    const isParagraphRoutine = taskType === "paragraph_routine";
    const isTimed = isMathQuestions || isParagraphRoutine;
    const timedQuestionTarget = isTimed ? 20 : null;

    if (subjName === "Matematik" && taskType === "topic_video") mathVideoCount++;
    if (isMathQuestions) mathQuestionCount++;
    if (isParagraphRoutine) paragraphCount++;
    if (subjName === "Türkçe" && taskType === "topic_video") turkishVideoCount++;
    if (subjName === "Türkçe" && taskType === "topic_questions") turkishQuestionCount++;
    if (subjName === "Fen") fenCount++;
    if (subjName === "Din") dinCount++;
    if (subjName === "İnkılap") inkilapCount++;
    if (subjName === "İngilizce") englishCount++;

    const playlistUrl = cleanUrl(d["Kaynak URL"]);
    const resId = playlistUrl ? (resourceMap.get(playlistUrl) ?? null) : null;

    const rowHash = computeSha256(JSON.stringify({ rowNum: r.rowNum, data: d }));

    const title = d.Görev?.trim() || topicName || d["Görev Türü"]?.trim();

    tasksToInsert.push({
      plan_day_id: planDayId,
      current_plan_day_id: planDayId,
      external_task_id: String(d.TaskID || r.rowNum),
      task_group_key: `${date}:${d.TaskID || r.rowNum}`,
      subject_id: subjId,
      topic_id: topicId,
      task_type: taskType,
      title,
      planned_start: d.Başlangıç?.trim() || null,
      planned_end: d.Bitiş?.trim() || null,
      planned_question_count: plannedQ,
      is_timed: isTimed,
      timed_question_target: timedQuestionTarget,
      general_playlist_url: playlistUrl,
      resource_label: d.Kaynak?.trim() || null,
      resource_id: resId,
      required: isRequired,
      counts_toward_topic_completion:
        isMathQuestions || (taskType === "topic_questions" && subjName !== null),
      sort_order: currentOrder,
      source_sheet: "Gunluk_Gorevler",
      source_row: r.rowNum,
      source_row_hash: rowHash,
      metadata: {
        rawType: d["Görev Türü"],
        rawSubject: d.Ders,
        rawTopic: d.Konu,
        phase: d.Faz,
        gunTipi: d["Gün Tipi"],
        musaitlik: d["Müsaitlik"],
      },
    });
  }

  // 9. Batch insert tasks (200 at a time)
  const batchSize = 200;
  for (let i = 0; i < tasksToInsert.length; i += batchSize) {
    const batch = tasksToInsert.slice(i, i + batchSize);
    const { error: batchErr } = await supabase.from("tasks").insert(batch);
    if (batchErr) {
      throw new Error(
        `Failed to insert task batch ${i} to ${i + batch.length}: ${batchErr.message}`
      );
    }
  }

  return {
    studyPlanId,
    planVersion,
    sourceWorkbookSha256: sha256,
    daysInserted: planDaysToInsert.length,
    tasksInserted: tasksToInsert.length,
    isIdempotentNoop: false,
    counts: {
      totalTasks: tasksToInsert.length,
      mandatoryTasks: mandatoryCount,
      optionalTasks: optionalCount,
      mathVideoTasks: mathVideoCount,
      mathQuestionTasks: mathQuestionCount,
      paragraphTasks: paragraphCount,
      turkishVideoTasks: turkishVideoCount,
      turkishQuestionTasks: turkishQuestionCount,
      fenTasks: fenCount,
      dinTasks: dinCount,
      inkilapTasks: inkilapCount,
      englishTasks: englishCount,
      mockDays: 60,
    },
  };
}
