// @vitest-environment node
import { describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";

describe("Database / PGlite Smoke Test", () => {
  it("initializes in-memory postgres and executes queries", async () => {
    const db = new PGlite();
    const result = await db.query<{ num: number }>("SELECT 42 as num;");
    expect(result.rows[0].num).toBe(42);
  });
});
