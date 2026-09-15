import { describe, it, expect, beforeEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { createTestDatabase, createAuthUser, setAuthContext, TestUser } from "./pglite-helper";

describe("M1: RLS Authorization Matrix & Boundaries", () => {
  let db: PGlite;
  let owner1: TestUser;
  let viewer1: TestUser;
  let owner2: TestUser;
  let studentUserA: TestUser;
  let studentUserB: TestUser;
  let unpairedAnon: TestUser;
  let familyId1: string;
  let familyId2: string;
  let studentIdA: string;
  let studentIdB: string;

  beforeEach(async () => {
    db = await createTestDatabase();
    owner1 = await createAuthUser(db, "owner1@family1.local", false);
    viewer1 = await createAuthUser(db, "viewer1@family1.local", false);
    owner2 = await createAuthUser(db, "owner2@family2.local", false);
    studentUserA = await createAuthUser(db, "studentA@anon.local", true);
    studentUserB = await createAuthUser(db, "studentB@anon.local", true);
    unpairedAnon = await createAuthUser(db, "unpaired@anon.local", true);

    // Create Family 1
    await setAuthContext(db, owner1);
    const fam1Res = await db.query<{ create_family_with_owner: string }>(
      "SELECT public.create_family_with_owner('Aile 1');"
    );
    familyId1 = fam1Res.rows[0].create_family_with_owner;

    // Add viewer to Family 1
    await setAuthContext(db, null);
    await db.query(
      "INSERT INTO public.family_members (family_id, auth_user_id, role) VALUES ($1, $2, 'viewer');",
      [familyId1, viewer1.id]
    );

    // Create Student A in Family 1
    const s1Res = await db.query<{ id: string }>(
      "INSERT INTO public.students (family_id, display_name) VALUES ($1, 'Öğrenci A') RETURNING id;",
      [familyId1]
    );
    studentIdA = s1Res.rows[0].id;

    // Pair studentUserA with Student A
    await db.query(
      "INSERT INTO public.student_devices (student_id, auth_user_id, status) VALUES ($1, $2, 'active');",
      [studentIdA, studentUserA.id]
    );

    // Create Family 2
    await setAuthContext(db, owner2);
    const fam2Res = await db.query<{ create_family_with_owner: string }>(
      "SELECT public.create_family_with_owner('Aile 2');"
    );
    familyId2 = fam2Res.rows[0].create_family_with_owner;

    // Create Student B in Family 2
    await setAuthContext(db, null);
    const s2Res = await db.query<{ id: string }>(
      "INSERT INTO public.students (family_id, display_name) VALUES ($1, 'Öğrenci B') RETURNING id;",
      [familyId2]
    );
    studentIdB = s2Res.rows[0].id;

    // Pair studentUserB with Student B
    await db.query(
      "INSERT INTO public.student_devices (student_id, auth_user_id, status) VALUES ($1, $2, 'active');",
      [studentIdB, studentUserB.id]
    );

    // Add resources to Family 1 and Family 2
    await db.query(
      "INSERT INTO public.resources (id, family_id, label, resource_type, url) VALUES ('11111111-1111-1111-1111-111111111111', $1, 'Kaynak 1', 'other', 'https://example.com/1');",
      [familyId1]
    );
    await db.query(
      "INSERT INTO public.resources (id, family_id, label, resource_type, url) VALUES ('22222222-2222-2222-2222-222222222222', $1, 'Kaynak 2', 'other', 'https://example.com/2');",
      [familyId2]
    );
  });

  it("paired student device can only read their own student record", async () => {
    await setAuthContext(db, studentUserA);

    const res = await db.query<{ id: string }>("SELECT id FROM public.students;");
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].id).toBe(studentIdA);
  });

  it("student A cannot read student B data", async () => {
    await setAuthContext(db, studentUserA);

    const res = await db.query<{ id: string }>("SELECT id FROM public.students WHERE id = $1;", [
      studentIdB,
    ]);
    expect(res.rows.length).toBe(0);
  });

  it("unpaired anonymous user sees zero student records", async () => {
    await setAuthContext(db, unpairedAnon);

    const res = await db.query<{ id: string }>("SELECT id FROM public.students;");
    expect(res.rows.length).toBe(0);
  });

  it("revoked student device immediately loses access to student data", async () => {
    // Revoke device for studentUserA
    await setAuthContext(db, null);
    await db.query(
      "UPDATE public.student_devices SET status = 'revoked', revoked_at = now() WHERE auth_user_id = $1;",
      [studentUserA.id]
    );

    // studentUserA attempts to read
    await setAuthContext(db, studentUserA);
    const res = await db.query<{ id: string }>("SELECT id FROM public.students;");
    expect(res.rows.length).toBe(0);
  });

  it("adult owner can read all students in their family but not other families", async () => {
    await setAuthContext(db, owner1);

    const res = await db.query<{ id: string }>("SELECT id FROM public.students;");
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].id).toBe(studentIdA);
  });

  it("viewer member has read-only access and cannot create pairing codes", async () => {
    // Viewer can read student
    await setAuthContext(db, viewer1);
    const res = await db.query<{ id: string }>("SELECT id FROM public.students;");
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].id).toBe(studentIdA);

    // Viewer cannot create pairing code
    await expect(
      db.query("SELECT * FROM public.create_student_pairing_code($1);", [studentIdA])
    ).rejects.toThrow(/forbidden/);
  });

  it("adults cannot author student study evidence directly or via RPC", async () => {
    await setAuthContext(db, owner1);

    // Owner cannot call start_task_timer (requires active student device)
    await expect(
      db.query("SELECT * FROM public.start_task_timer('00000000-0000-0000-0000-000000000000');")
    ).rejects.toThrow(/active student device required/);
  });

  it("resources are strictly isolated to the student's family", async () => {
    await setAuthContext(db, studentUserA);

    const res = await db.query<{ label: string }>("SELECT label FROM public.resources;");
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].label).toBe("Kaynak 1");
  });
});
