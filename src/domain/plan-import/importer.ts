import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { XlsxParser } from "./xlsx-parser";
import { PlanNormalizer } from "./normalizer";
import type {
  CalendarOverridesFile,
  DryRunReport,
  NormalizedTask,
  RawDailyRow,
  ResourceInventoryFile,
} from "./types";

export interface PlanImportFiles {
  workbookBuffer: Buffer;
  calendarOverridesJson: string;
  resourceInventoryJson: string;
}

export interface ImportOptions {
  files?: PlanImportFiles;
  workbookPath?: string;
  calendarOverridesPath?: string;
  resourceInventoryPath?: string;
}

export function loadImportFiles(options: ImportOptions = {}): PlanImportFiles {
  const root = process.cwd();
  const wbPath = options.workbookPath ?? path.join(root, "data", "LGS_2027_MASTER_PLAN.xlsx");
  const calPath =
    options.calendarOverridesPath ?? path.join(root, "data", "calendar_overrides.json");
  const invPath =
    options.resourceInventoryPath ?? path.join(root, "data", "resolved", "resource-items.json");

  return {
    workbookBuffer: options.files?.workbookBuffer ?? fs.readFileSync(wbPath),
    calendarOverridesJson: options.files?.calendarOverridesJson ?? fs.readFileSync(calPath, "utf8"),
    resourceInventoryJson: options.files?.resourceInventoryJson ?? fs.readFileSync(invPath, "utf8"),
  };
}

export function computeSha256(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function executeDryRun(options: ImportOptions = {}): DryRunReport {
  const files = loadImportFiles(options);

  const workbookSha256 = computeSha256(files.workbookBuffer);
  const calendarOverridesSha256 = computeSha256(files.calendarOverridesJson);
  const resourceInventorySha256 = computeSha256(files.resourceInventoryJson);

  const calendarOverrides: CalendarOverridesFile = JSON.parse(files.calendarOverridesJson);
  const resourceInventory: ResourceInventoryFile = JSON.parse(files.resourceInventoryJson);

  const parser = new XlsxParser(files.workbookBuffer);
  const rawRows = parser.parseSheet<RawDailyRow>("Gunluk_Gorevler");

  const normalizer = new PlanNormalizer({ calendarOverrides, resourceInventory });
  const { tasks, summary } = normalizer.normalizeRows(rawRows);

  const isValid =
    summary.unresolvedVideoTasks === 0 &&
    summary.unresolvedMebTasks === 0 &&
    summary.ambiguousMappings === 0 &&
    summary.invalidRowErrors.length === 0 &&
    tasks.length > 0;

  return {
    timestamp: new Date().toISOString(),
    workbookSha256,
    resourceInventorySha256,
    calendarOverridesSha256,
    summary,
    isValid,
    tasks,
  };
}

export function formatDryRunMarkdown(report: DryRunReport): string {
  const { summary } = report;
  return `# LGS 2027 Study Plan Import Dry-Run Report

**Timestamp**: ${report.timestamp}  
**Status**: ${report.isValid ? "VALID / GEÇERLİ (Commit Edilebilir)" : "INVALID / GEÇERSİZ (Hatalar Bulundu)"}  

## SHA-256 Hashes
- **Workbook**: \`${report.workbookSha256}\`
- **Resource Inventory**: \`${report.resourceInventorySha256}\`
- **Calendar Overrides**: \`${report.calendarOverridesSha256}\`

## Summary Metrics
- **Total Raw Source Rows**: ${summary.totalRawRows}
- **Total Normalized Tasks**: ${summary.totalNormalizedTasks}
- **Unresolved Video Tasks**: ${summary.unresolvedVideoTasks}
- **Unresolved MEB Tasks**: ${summary.unresolvedMebTasks}
- **Ambiguous Mappings**: ${summary.ambiguousMappings}
- **Invalid Row Errors**: ${summary.invalidRowErrors.length}

## Normalization Breakdown
- **N-001** (1 Oct Math Baseline): ${summary.normalizationCounts["N-001"]}
- **N-002** (Benchmark 20 + Extra Split): ${summary.normalizationCounts["N-002"]}
- **N-003** (Optional Reading): ${summary.normalizationCounts["N-003"]}
- **N-004** (Non-academic Blocks): ${summary.normalizationCounts["N-004"]}
- **N-005** (Source HTTPS Allowlist): ${summary.normalizationCounts["N-005"]}
- **N-006** (Exact Video Resolution): ${summary.normalizationCounts["N-006"]}
- **N-007** (Learned-Topic-Safe MEB): ${summary.normalizationCounts["N-007"]}
- **N-008** (Empty Dashboard Ignored): ${summary.normalizationCounts["N-008"]}
- **N-009** (Compound Teaching Split): ${summary.normalizationCounts["N-009"]}
- **N-010** (Exhaustive Task Mapping): ${summary.normalizationCounts["N-010"]}
- **N-011** (17-18 May Holiday Overrides): ${summary.normalizationCounts["N-011"]}
`;
}

/**
 * Transactional DB Committer
 * Compatible with Supabase Postgres client or PGlite instance.
 */
export async function commitImport(
  db: { query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }> },
  params: {
    familyId: string;
    studentId: string;
    actorAuthUserId: string;
    dryRunReport: DryRunReport;
  }
): Promise<{ studyPlanId: string; importRunId: string; taskCount: number }> {
  const { familyId, studentId, actorAuthUserId, dryRunReport } = params;

  if (!dryRunReport.isValid) {
    throw new Error("Cannot commit invalid dry-run report");
  }

  // 1. Transaction BEGIN
  await db.query("BEGIN");
  try {
    // 2. Ensure subjects exist
    const subjectMap = new Map<string, number>();
    const subjects = [
      { code: "matematik", name: "Matematik" },
      { code: "turkce", name: "Türkçe" },
      { code: "fen", name: "Fen" },
      { code: "inkilap", name: "İnkılap" },
      { code: "din", name: "Din" },
      { code: "ingilizce", name: "İngilizce" },
      { code: "meb", name: "MEB" },
    ];
    for (const s of subjects) {
      const res = await db.query(
        `insert into public.subjects (code, name_tr)
         values ($1, $2)
         on conflict (code) do update set name_tr = excluded.name_tr
         returning id`,
        [s.code, s.name]
      );
      subjectMap.set(s.name, res.rows[0].id);
    }

    // 3. Upsert topics
    const topicMap = new Map<string, string>();
    const uniqueTopics = new Set<string>();
    for (const t of dryRunReport.tasks) {
      if (t.topic && t.subject) {
        uniqueTopics.add(`${t.subject}:${t.topic}`);
      }
    }
    for (const st of uniqueTopics) {
      const [subjName, topicName] = st.split(":");
      const subjId = subjectMap.get(subjName);
      if (subjId) {
        const res = await db.query(
          `insert into public.topics (subject_id, name_tr)
           values ($1, $2)
           on conflict (subject_id, name_tr) do update set name_tr = excluded.name_tr
           returning id`,
          [subjId, topicName]
        );
        topicMap.set(st, res.rows[0].id);
      }
    }

    // 4. Upsert resources and resource_items for this family
    const resourceMap = new Map<string, string>(); // sourceKey -> resource_id
    const resourceItemMap = new Map<string, string>(); // sourceKey:externalKey -> resource_item_id

    const inv = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data", "resolved", "resource-items.json"), "utf8")
    ) as ResourceInventoryFile;

    const sourceKeys = new Set(inv.items.map((i) => i.sourceKey));
    for (const sk of sourceKeys) {
      const sampleItem = inv.items.find((i) => i.sourceKey === sk);
      const resType = sk.startsWith("meb-")
        ? "meb"
        : sk.startsWith("yt-")
          ? "youtube_playlist"
          : "other";
      const res = await db.query(
        `insert into public.resources (family_id, resource_type, label, url, fixed_by_owner)
         values ($1, $2, $3, $4, true)
         returning id`,
        [
          familyId,
          resType,
          sampleItem?.label ?? sk,
          sampleItem?.evidence.sourceUrl ?? "https://youtube.com",
        ]
      );
      const resourceId = res.rows[0].id;
      resourceMap.set(sk, resourceId);

      // Insert items for this resource
      const sourceItems = inv.items.filter((i) => i.sourceKey === sk);
      for (const it of sourceItems) {
        const itemRes = await db.query(
          `insert into public.resource_items (resource_id, external_key, label, url, position, duration_seconds)
           values ($1, $2, $3, $4, $5, $6)
           on conflict (resource_id, external_key) do update
             set label = excluded.label, url = excluded.url
           returning id`,
          [resourceId, it.externalKey, it.label, it.url, it.position, it.durationSeconds]
        );
        resourceItemMap.set(`${sk}:${it.externalKey}`, itemRes.rows[0].id);
      }
    }

    // 5. Create or get study plan with 3-hash binding
    const planRes = await db.query(
      `insert into public.study_plans (
         student_id, name, starts_on, planning_anchor_end, status,
         source_workbook_sha256, source_resource_inventory_sha256, source_calendar_overrides_sha256
       )
       values ($1, 'LGS 2027 Master Plan', '2026-10-01', '2027-06-13', 'active', $2, $3, $4)
       on conflict do nothing
       returning id`,
      [
        studentId,
        dryRunReport.workbookSha256,
        dryRunReport.resourceInventorySha256,
        dryRunReport.calendarOverridesSha256,
      ]
    );

    let studyPlanId = planRes.rows[0]?.id;
    if (!studyPlanId) {
      const activePlan = await db.query(
        `select id from public.study_plans where student_id = $1 and status = 'active' limit 1`,
        [studentId]
      );
      studyPlanId = activePlan.rows[0].id;
      // Update hashes
      await db.query(
        `update public.study_plans
         set source_workbook_sha256 = $1,
             source_resource_inventory_sha256 = $2,
             source_calendar_overrides_sha256 = $3
         where id = $4`,
        [
          dryRunReport.workbookSha256,
          dryRunReport.resourceInventorySha256,
          dryRunReport.calendarOverridesSha256,
          studyPlanId,
        ]
      );
    }

    // 6. Upsert plan_days
    const planDayMap = new Map<string, string>(); // date -> plan_day_id
    const dates = Array.from(new Set(dryRunReport.tasks.map((t) => t.date))).sort();

    for (let i = 0; i < dates.length; i++) {
      const planDate = dates[i];
      const dayNumber = i + 1;
      const weekNumber = Math.floor(i / 7) + 1;
      const phase = dayNumber <= 60 ? "1 — Temel Kurma" : "2 — Pekiştirme ve Derinleşme";

      const dayRes = await db.query(
        `insert into public.plan_days (study_plan_id, plan_date, day_number, week_number, phase)
         values ($1, $2, $3, $4, $5)
         on conflict (study_plan_id, plan_date) do update
           set day_number = excluded.day_number
         returning id`,
        [studyPlanId, planDate, dayNumber, weekNumber, phase]
      );
      planDayMap.set(planDate, dayRes.rows[0].id);
    }

    // 7. Upsert tasks (setting plan_day_id and current_plan_day_id initially identical)
    for (const t of dryRunReport.tasks) {
      const planDayId = planDayMap.get(t.date);
      if (!planDayId) continue;

      const subjectId = t.subject ? (subjectMap.get(t.subject) ?? null) : null;
      const topicId =
        t.subject && t.topic ? (topicMap.get(`${t.subject}:${t.topic}`) ?? null) : null;

      let resId: string | null = null;
      let resItemId: string | null = null;

      if (t.resourceSourceKey) {
        resId = resourceMap.get(t.resourceSourceKey) ?? null;
        if (t.resourceItemExternalKey) {
          resItemId =
            resourceItemMap.get(`${t.resourceSourceKey}:${t.resourceItemExternalKey}`) ?? null;
        }
      }

      await db.query(
        `insert into public.tasks (
           plan_day_id, current_plan_day_id, external_task_id, task_group_key,
           subject_id, topic_id, task_type, title, planned_start, planned_end,
           planned_question_count, required, counts_toward_topic_completion,
           sort_order, resource_id, resource_item_id, source_sheet, source_row,
           source_row_hash, metadata
         )
         values (
           $1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
         )
         on conflict (plan_day_id, external_task_id) do update set
           title = excluded.title,
           planned_question_count = excluded.planned_question_count,
           source_row_hash = excluded.source_row_hash`,
        [
          planDayId,
          t.externalTaskId,
          t.taskGroupKey,
          subjectId,
          topicId,
          t.taskType,
          t.title,
          t.plannedStart,
          t.plannedEnd,
          t.plannedQuestionCount,
          t.required,
          t.countsTowardTopicCompletion,
          t.sortOrder,
          resId,
          resItemId,
          t.source.sheet,
          t.source.row,
          t.source.rowHash,
          JSON.stringify({ allowedTopics: t.allowedTopics ?? [] }),
        ]
      );
    }

    // 8. Record import_run
    const runRes = await db.query(
      `insert into public.import_runs (
         family_id, student_id, workbook_sha256, resource_inventory_sha256,
         calendar_overrides_sha256, status, summary, actor_auth_user_id
       )
       values ($1, $2, $3, $4, $5, 'committed', $6, $7)
       returning id`,
      [
        familyId,
        studentId,
        dryRunReport.workbookSha256,
        dryRunReport.resourceInventorySha256,
        dryRunReport.calendarOverridesSha256,
        JSON.stringify(dryRunReport.summary),
        actorAuthUserId,
      ]
    );
    const importRunId = runRes.rows[0].id;

    // 9. Audit event
    await db.query(
      `insert into public.audit_events (family_id, actor_auth_user_id, action, entity_type, entity_id, details)
       values ($1, $2, 'plan_imported', 'study_plan', $3, $4)`,
      [
        familyId,
        actorAuthUserId,
        studyPlanId,
        JSON.stringify({
          taskCount: dryRunReport.tasks.length,
          importRunId,
          workbookSha256: dryRunReport.workbookSha256,
        }),
      ]
    );

    // 10. Commit transaction
    await db.query("COMMIT");
    return {
      studyPlanId,
      importRunId,
      taskCount: dryRunReport.tasks.length,
    };
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
}
