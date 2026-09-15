export type TaskType =
  | "topic_video"
  | "topic_review"
  | "topic_questions"
  | "mixed_questions"
  | "meb_questions"
  | "daily_math_benchmark"
  | "daily_math_extra"
  | "daily_paragraph_benchmark"
  | "daily_paragraph_extra"
  | "paragraph_routine"
  | "spaced_review"
  | "extra_science_video"
  | "extra_science_questions"
  | "source_catchup"
  | "full_mock_verbal"
  | "mock_break"
  | "full_mock_numerical"
  | "mock_remediation"
  | "exam_prep"
  | "mistake_review"
  | "weekly_review"
  | "progress_review"
  | "branch_mock"
  | "full_mock"
  | "mock_analysis"
  | "reading"
  | "break"
  | "meal"
  | "sleep_prep";

export type NormalizationId =
  | "N-001"
  | "N-002"
  | "N-003"
  | "N-004"
  | "N-005"
  | "N-006"
  | "N-007"
  | "N-008"
  | "N-009"
  | "N-010"
  | "N-011";

export interface RawTaskSource {
  sheet: string;
  row: number;
  rowHash: string;
  rawTaskId: string;
  rawTaskType: string;
}

export interface RawDailyRow {
  TaskID: string;
  Tarih: string;
  "Gün No"?: string;
  "Hafta No"?: string;
  Gün?: string;
  Faz?: string;
  Uygunluk?: string;
  Başlangıç?: string;
  Bitiş?: string;
  Ders?: string;
  "Görev Türü": string;
  Konu?: string;
  Görev?: string;
  Kaynak?: string;
  "Kaynak URL"?: string;
  "Planlanan Soru"?: string;
  "Süre Tipi"?: string;
  Zorunlu?: string;
  Durum?: string;
  Not?: string;
}

export interface NormalizedTask {
  externalTaskId: string;
  taskGroupKey: string;
  date: string;
  plannedStart: string | null;
  plannedEnd: string | null;
  subject: string | null;
  topic: string | null;
  taskType: TaskType;
  title: string;
  resourceSourceKey: string | null;
  resourceLabel: string | null;
  resourceUrl: string | null;
  resourceItemExternalKey: string | null;
  resourceItemUrl: string | null;
  allowedTopics?: string[];
  plannedQuestionCount: number | null;
  required: boolean;
  countsTowardTopicCompletion: boolean;
  sortOrder: number;
  normalizations: NormalizationId[];
  source: RawTaskSource;
}

export interface CalendarOverrideItem {
  date: string;
  availability: "full_day" | "weekday_after_school" | "custom";
  reason: string;
  source: string;
}

export interface CalendarOverridesFile {
  schemaVersion: number;
  timezone: string;
  auditDate: string;
  policy: string;
  overrides: CalendarOverrideItem[];
}

export interface ResolvedResourceItem {
  sourceKey: string;
  externalKey: string;
  label: string;
  url: string;
  position: number;
  durationSeconds: number | null;
  topicKeys: string[];
  evidence: {
    method: "public-source-page" | "official-page" | "provided-reference";
    checkedAt: string;
    sourceUrl: string;
    matchMethod:
      | "exact-external-id"
      | "exact-title-and-position"
      | "official-item-identifier"
      | "provided-reference-exact";
  };
}

export interface ResourceInventoryFile {
  schemaVersion: number;
  generatedAt: string;
  sourceCatalogSha256: string;
  items: ResolvedResourceItem[];
}

export interface NormalizationSummary {
  totalRawRows: number;
  totalNormalizedTasks: number;
  normalizationCounts: Record<NormalizationId, number>;
  unresolvedVideoTasks: number;
  unresolvedMebTasks: number;
  ambiguousMappings: number;
  invalidRowErrors: string[];
}

export interface DryRunReport {
  timestamp: string;
  workbookSha256: string;
  resourceInventorySha256: string;
  calendarOverridesSha256: string;
  summary: NormalizationSummary;
  isValid: boolean;
  tasks: NormalizedTask[];
}
