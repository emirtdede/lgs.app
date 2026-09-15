import crypto from "node:crypto";
import type {
  CalendarOverridesFile,
  NormalizationId,
  NormalizationSummary,
  NormalizedTask,
  RawDailyRow,
  ResourceInventoryFile,
  TaskType,
} from "./types";
import { parseExcelDate, cleanUrl, mapTaskType } from "./final-plan-importer";

export function computeRowHash(
  sheet: string,
  rowNum: number,
  data: Record<string, string>
): string {
  const sortedKeys = Object.keys(data).sort();
  const normalizedObj: Record<string, string> = {};
  for (const k of sortedKeys) {
    normalizedObj[k] = data[k] ?? "";
  }
  const payload = JSON.stringify({ sheet, rowNum, data: normalizedObj });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export interface NormalizerContext {
  calendarOverrides?: CalendarOverridesFile;
  resourceInventory?: ResourceInventoryFile;
}

export class PlanNormalizer {
  private ctx: NormalizerContext;

  constructor(ctx: NormalizerContext = {}) {
    this.ctx = ctx;
  }

  private cleanString(val: string | undefined): string | null {
    if (!val) return null;
    const trimmed = val.trim();
    if (trimmed === "" || trimmed === "—" || trimmed === "-") return null;
    return trimmed;
  }

  private parseTime(val: string | undefined): string | null {
    if (!val) return null;
    const trimmed = val.trim();
    const match = /^([01]\d|2[0-3]):[0-5]\d$/.exec(trimmed);
    return match ? match[0] : null;
  }

  public normalizeRows(rawRows: { rowNum: number; data: RawDailyRow }[]): {
    tasks: NormalizedTask[];
    summary: NormalizationSummary;
  } {
    const tasks: NormalizedTask[] = [];
    const normalizationCounts: Record<NormalizationId, number> = {
      "N-001": 0,
      "N-002": 0,
      "N-003": 0,
      "N-004": 0,
      "N-005": 0,
      "N-006": 0,
      "N-007": 0,
      "N-008": 0,
      "N-009": 0,
      "N-010": 0,
      "N-011": 0,
    };

    const invalidRowErrors: string[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const r = rawRows[i];
      const rowNum = r.rowNum;
      const row = r.data;
      const rowHash = computeRowHash(
        "Gunluk_Gorevler",
        rowNum,
        row as unknown as Record<string, string>
      );

      const rawTaskId = row.TaskID ? String(row.TaskID).trim() : String(i + 1);
      const rawDate = parseExcelDate(row.Tarih);
      const rawTaskType = row["Görev Türü"]?.trim();

      if (!rawTaskId || !rawDate || !rawTaskType) {
        invalidRowErrors.push(`Row ${rowNum}: missing TaskID, Tarih or Görev Türü`);
        continue;
      }

      let taskType: TaskType;
      try {
        taskType = mapTaskType(rawTaskType);
      } catch (err: any) {
        invalidRowErrors.push(`Row ${rowNum}: ${err.message}`);
        continue;
      }

      const subject = this.cleanString(row.Ders);
      const rawTopic = this.cleanString(row.Konu);
      const rawTitle = this.cleanString(row.Görev) ?? rawTopic ?? rawTaskType;
      const rawStart = this.parseTime(row.Başlangıç);
      const rawEnd = this.parseTime(row.Bitiş);
      const rawCountStr = row["Planlanan Soru"] ? String(row["Planlanan Soru"]).trim() : "";
      const rawPlannedCount =
        rawCountStr && !isNaN(parseInt(rawCountStr, 10)) ? parseInt(rawCountStr, 10) : null;
      const isRequired = row.Zorunlu?.trim() === "Evet";
      const sourceUrl = cleanUrl(row["Kaynak URL"]);
      const sourceLabel = this.cleanString(row.Kaynak);

      const normalizations: NormalizationId[] = ["N-010"];
      normalizationCounts["N-010"]++;

      if (sourceUrl) {
        normalizations.push("N-005");
        normalizationCounts["N-005"]++;
      }

      if (taskType === "reading") {
        normalizations.push("N-003");
        normalizationCounts["N-003"]++;
      }

      if (["break", "meal", "sleep_prep", "mock_break"].includes(taskType)) {
        normalizations.push("N-004");
        normalizationCounts["N-004"]++;
      }

      const isMathQuestions = taskType === "topic_questions" && subject === "Matematik";
      const isParagraphRoutine = taskType === "paragraph_routine";
      if (isMathQuestions || isParagraphRoutine) {
        normalizations.push("N-002");
        normalizationCounts["N-002"]++;
      }

      tasks.push({
        externalTaskId: rawTaskId,
        taskGroupKey: `${rawDate}:${rawTaskId}`,
        date: rawDate,
        plannedStart: rawStart,
        plannedEnd: rawEnd,
        subject,
        topic: rawTopic,
        taskType,
        title: rawTitle,
        resourceSourceKey: null,
        resourceLabel: sourceLabel,
        resourceUrl: sourceUrl,
        resourceItemExternalKey: null,
        resourceItemUrl: sourceUrl,
        plannedQuestionCount: rawPlannedCount,
        required: isRequired,
        countsTowardTopicCompletion:
          isMathQuestions || (taskType === "topic_questions" && subject !== null),
        sortOrder: tasks.length + 1,
        normalizations,
        source: {
          sheet: "Gunluk_Gorevler",
          row: rowNum,
          rowHash,
          rawTaskId,
          rawTaskType,
        },
      });
    }

    const summary: NormalizationSummary = {
      totalRawRows: rawRows.length,
      totalNormalizedTasks: tasks.length,
      normalizationCounts,
      unresolvedVideoTasks: 0,
      unresolvedMebTasks: 0,
      ambiguousMappings: 0,
      invalidRowErrors,
    };

    return { tasks, summary };
  }
}
