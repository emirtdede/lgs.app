/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createTestDatabase, createAuthUser, setAuthContext } from "./pglite-helper";
import { executeDryRun, commitImport, formatDryRunMarkdown } from "@/domain/plan-import/importer";

describe("Plan Import & Idempotency", () => {
  let db: PGlite;
  let familyId: string;
  let studentId: string;
  let ownerId: string;

  beforeEach(async () => {
    db = await createTestDatabase();

    const owner = await createAuthUser(db, "owner@family.test", false);
    ownerId = owner.id;
    await setAuthContext(db, owner);

    const famRes = await db.query<{ family_id: string }>(
      `select public.create_family_with_owner('Test Family') as family_id`
    );
    familyId = famRes.rows[0].family_id;

    // Switch to service/admin context for student creation and plan import
    await setAuthContext(db, null);

    // Create student
    const stuRes = await db.query<{ id: string }>(
      `insert into public.students (family_id, display_name) values ($1, 'Student Test') returning id`,
      [familyId]
    );
    studentId = stuRes.rows[0].id;
  });

  it("runs dry-run and generates valid report", () => {
    const report = executeDryRun();
    expect(report.isValid).toBe(true);
    expect(report.summary.unresolvedVideoTasks).toBe(0);
    expect(report.summary.unresolvedMebTasks).toBe(0);
    expect(report.summary.ambiguousMappings).toBe(0);
    expect(report.summary.invalidRowErrors.length).toBe(0);
    expect(report.tasks.length).toBeGreaterThan(2400);

    const md = formatDryRunMarkdown(report);
    expect(md).toContain("LGS 2027 Study Plan Import Dry-Run Report");
    expect(md).toContain("VALID");
    expect(md).toContain(report.workbookSha256);
  });

  it("commits import transactionally with 3-hash binding and verifies initial invariants", async () => {
    const report = executeDryRun();
    const result = await commitImport(db, {
      familyId,
      studentId,
      actorAuthUserId: ownerId,
      dryRunReport: report,
    });

    expect(result.studyPlanId).toBeTruthy();
    expect(result.taskCount).toBe(report.tasks.length);

    // Verify study_plans 3 hashes
    const planRes = await db.query<{
      source_workbook_sha256: string;
      source_resource_inventory_sha256: string;
      source_calendar_overrides_sha256: string;
    }>(
      `select source_workbook_sha256, source_resource_inventory_sha256, source_calendar_overrides_sha256
       from public.study_plans where id = $1`,
      [result.studyPlanId]
    );
    expect(planRes.rows[0].source_workbook_sha256).toBe(report.workbookSha256);
    expect(planRes.rows[0].source_resource_inventory_sha256).toBe(report.resourceInventorySha256);
    expect(planRes.rows[0].source_calendar_overrides_sha256).toBe(report.calendarOverridesSha256);

    // Verify plan_day_id == current_plan_day_id initially
    const mismatchRes = await db.query<{ count: string }>(
      `select count(*) as count from public.tasks where plan_day_id <> current_plan_day_id`
    );
    expect(parseInt(mismatchRes.rows[0].count, 10)).toBe(0);

    // Verify import_runs record
    const runRes = await db.query<{ status: string; workbook_sha256: string }>(
      `select status, workbook_sha256 from public.import_runs where id = $1`,
      [result.importRunId]
    );
    expect(runRes.rows[0].status).toBe("committed");
    expect(runRes.rows[0].workbook_sha256).toBe(report.workbookSha256);

    // Verify audit_events record
    const auditRes = await db.query<{ action: string; entity_type: string }>(
      `select action, entity_type from public.audit_events where entity_id = $1`,
      [result.studyPlanId]
    );
    expect(auditRes.rows.length).toBeGreaterThan(0);
    expect(auditRes.rows[0].action).toBe("plan_imported");
  });

  it("verifies idempotent re-import (zero duplicate tasks or days)", async () => {
    const report = executeDryRun();

    // First import
    const firstResult = await commitImport(db, {
      familyId,
      studentId,
      actorAuthUserId: ownerId,
      dryRunReport: report,
    });

    const tasksBefore = await db.query<{ c: string }>(`select count(*) as c from public.tasks`);
    const daysBefore = await db.query<{ c: string }>(`select count(*) as c from public.plan_days`);
    const countBefore = parseInt(tasksBefore.rows[0].c, 10);
    const daysCountBefore = parseInt(daysBefore.rows[0].c, 10);

    // Second import (exact same report)
    const secondResult = await commitImport(db, {
      familyId,
      studentId,
      actorAuthUserId: ownerId,
      dryRunReport: report,
    });

    const tasksAfter = await db.query<{ c: string }>(`select count(*) as c from public.tasks`);
    const daysAfter = await db.query<{ c: string }>(`select count(*) as c from public.plan_days`);
    const countAfter = parseInt(tasksAfter.rows[0].c, 10);
    const daysCountAfter = parseInt(daysAfter.rows[0].c, 10);

    expect(countAfter).toBe(countBefore);
    expect(daysCountAfter).toBe(daysCountBefore);
    expect(secondResult.studyPlanId).toBe(firstResult.studyPlanId);

    // Verify import_runs has 2 records
    const runsRes = await db.query<{ c: string }>(`select count(*) as c from public.import_runs`);
    expect(parseInt(runsRes.rows[0].c, 10)).toBe(2);
  });

  it("rolls back completely on error leaving zero partial writes", async () => {
    const report = executeDryRun();
    // Tamper dryRunReport with an invalid task date to trigger constraint error
    const corruptedReport = {
      ...report,
      tasks: [
        ...report.tasks,
        {
          ...report.tasks[0],
          externalTaskId: "corrupted-task",
          date: "invalid-date",
        },
      ],
    };

    const tasksBefore = await db.query<{ c: string }>(`select count(*) as c from public.tasks`);
    const countBefore = parseInt(tasksBefore.rows[0].c, 10);

    await expect(
      commitImport(db, {
        familyId,
        studentId,
        actorAuthUserId: ownerId,
        dryRunReport: corruptedReport,
      })
    ).rejects.toThrow();

    const tasksAfter = await db.query<{ c: string }>(`select count(*) as c from public.tasks`);
    const countAfter = parseInt(tasksAfter.rows[0].c, 10);
    expect(countAfter).toBe(countBefore);
  });
});
