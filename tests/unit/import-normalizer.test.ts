import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { XlsxParser } from "@/domain/plan-import/xlsx-parser";
import { PlanNormalizer } from "@/domain/plan-import/normalizer";
import type { RawDailyRow } from "@/domain/plan-import/types";

describe("PlanNormalizer — Final 500 Plan Normalization", () => {
  const xlsxPath = path.join(process.cwd(), "data", "LGS_2027_MASTER_PLAN.xlsx");
  const xlsxBuffer = fs.readFileSync(xlsxPath);

  const parser = new XlsxParser(xlsxBuffer);
  const rawRows = parser.parseSheet<RawDailyRow>("Gunluk_Gorevler");
  const normalizer = new PlanNormalizer();
  const { tasks, summary } = normalizer.normalizeRows(rawRows);

  it("normalizes all 2947 rows with 0 invalid row errors", () => {
    expect(summary.totalRawRows).toBe(2947);
    expect(summary.totalNormalizedTasks).toBe(2947);
    expect(summary.invalidRowErrors).toHaveLength(0);
    expect(summary.unresolvedVideoTasks).toBe(0);
    expect(summary.ambiguousMappings).toBe(0);
  });

  it("verifies N-002: Timed first-20 sessions for Math same-topic questions and Paragraph routine", () => {
    const timedTasks = tasks.filter((t) => t.normalizations.includes("N-002"));
    expect(timedTasks.length).toBe(390); // 195 Math + 195 Paragraph

    const mathTimed = timedTasks.filter((t) => t.subject === "Matematik");
    expect(mathTimed.length).toBe(195);
    for (const mt of mathTimed) {
      expect(mt.taskType).toBe("topic_questions");
      expect(mt.topic).toBeTruthy();
    }

    const paragraphTimed = timedTasks.filter((t) => t.taskType === "paragraph_routine");
    expect(paragraphTimed.length).toBe(195);
    for (const pt of paragraphTimed) {
      expect(pt.subject).toBe("Türkçe");
      expect(pt.plannedQuestionCount).toBeGreaterThanOrEqual(20);
    }
  });

  it("verifies N-003: Optional reading tasks", () => {
    const readings = tasks.filter((t) => t.taskType === "reading");
    expect(readings.length).toBe(138);
    for (const r of readings) {
      expect(r.required).toBe(false);
      expect(r.normalizations).toContain("N-003");
    }
  });

  it("verifies N-004: Non-academic schedule blocks", () => {
    const nonAcademic = tasks.filter((t) =>
      ["break", "meal", "sleep_prep", "mock_break"].includes(t.taskType)
    );
    expect(nonAcademic.length).toBe(669); // 159 + 195 + 255 + 60
    for (const na of nonAcademic) {
      expect(na.normalizations).toContain("N-004");
    }
  });

  it("verifies N-005: HTTPS source URL preservation", () => {
    const withUrl = tasks.filter((t) => t.resourceUrl !== null);
    expect(withUrl.length).toBeGreaterThan(0);
    for (const task of withUrl) {
      expect(task.resourceUrl).toMatch(/^https:\/\//);
      expect(task.normalizations).toContain("N-005");
    }
  });

  it("verifies N-010: Exhaustive raw task type mapping", () => {
    expect(summary.normalizationCounts["N-010"]).toBe(2947);
  });
});
