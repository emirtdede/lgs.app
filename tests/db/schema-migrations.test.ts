import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { createTestDatabase } from "./pglite-helper";

describe("Database Migrations & Schema Initialization", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await createTestDatabase();
  });

  it("applies all migrations successfully and creates core tables", async () => {
    const res = await db.query<{ tablename: string }>(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    const tables = res.rows.map((r) => r.tablename);

    expect(tables).toContain("families");
    expect(tables).toContain("family_members");
    expect(tables).toContain("students");
    expect(tables).toContain("student_devices");
    expect(tables).toContain("pairing_codes");
    expect(tables).toContain("subjects");
    expect(tables).toContain("topics");
    expect(tables).toContain("resources");
    expect(tables).toContain("resource_items");
    expect(tables).toContain("study_plans");
    expect(tables).toContain("plan_days");
    expect(tables).toContain("tasks");
    expect(tables).toContain("task_completions");
    expect(tables).toContain("timer_sessions");
    expect(tables).toContain("question_sessions");
    expect(tables).toContain("mistakes");
    expect(tables).toContain("reading_sessions");
    expect(tables).toContain("audit_events");
  });

  it("creates custom domain enums correctly", async () => {
    const res = await db.query<{ typname: string }>(`
      SELECT typname FROM pg_type
      JOIN pg_namespace ON pg_type.typnamespace = pg_namespace.oid
      WHERE pg_namespace.nspname = 'public' AND typtype = 'e';
    `);
    const types = res.rows.map((r) => r.typname);

    expect(types).toContain("family_role");
    expect(types).toContain("task_type");
    expect(types).toContain("task_status");
    expect(types).toContain("session_status");
    expect(types).toContain("mistake_reason");
  });
});
