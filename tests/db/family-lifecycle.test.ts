import { describe, it, expect, beforeEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { createTestDatabase, createAuthUser, setAuthContext, TestUser } from "./pglite-helper";

describe("M1: Family Lifecycle & Exactly-One-Owner Invariant", () => {
  let db: PGlite;
  let adult1: TestUser;
  let adult2: TestUser;
  let anonUser: TestUser;

  beforeEach(async () => {
    db = await createTestDatabase();
    adult1 = await createAuthUser(db, "owner1@test.local", false);
    adult2 = await createAuthUser(db, "member2@test.local", false);
    anonUser = await createAuthUser(db, "student@test.local", true);
  });

  it("creates family and owner atomically via create_family_with_owner", async () => {
    await setAuthContext(db, adult1);

    const res = await db.query<{ family_id: string }>(
      "SELECT public.create_family_with_owner('Test Ailesi') as family_id;"
    );
    const familyId = res.rows[0].family_id;
    expect(familyId).toBeDefined();

    // Verify family and owner exist
    const fam = await db.query<{ name: string }>(
      "SELECT name FROM public.families WHERE id = $1;",
      [familyId]
    );
    expect(fam.rows[0].name).toBe("Test Ailesi");

    const member = await db.query<{ role: string; auth_user_id: string }>(
      "SELECT role, auth_user_id FROM public.family_members WHERE family_id = $1;",
      [familyId]
    );
    expect(member.rows.length).toBe(1);
    expect(member.rows[0].role).toBe("owner");
    expect(member.rows[0].auth_user_id).toBe(adult1.id);
  });

  it("rejects family creation by anonymous auth user", async () => {
    await setAuthContext(db, anonUser);

    await expect(
      db.query("SELECT public.create_family_with_owner('Anon Ailesi');")
    ).rejects.toThrow(/permanent adult auth required/);
  });

  it("deferred constraint triggers reject family with zero owners at COMMIT", async () => {
    await setAuthContext(db, null); // admin/superuser mode to bypass RPC

    await expect(
      db.exec(`
        BEGIN;
        INSERT INTO public.families (name) VALUES ('Sahipsiz Aile');
        COMMIT;
      `)
    ).rejects.toThrow(/must have exactly one owner/);
  });

  it("deferred constraint triggers reject family with multiple owners at COMMIT", async () => {
    await setAuthContext(db, null);

    await expect(
      db.exec(`
        BEGIN;
        WITH new_fam AS (
          INSERT INTO public.families (name) VALUES ('Cok Sahipli Aile') RETURNING id
        )
        INSERT INTO public.family_members (family_id, auth_user_id, role)
        VALUES 
          ((SELECT id FROM new_fam), '${adult1.id}', 'owner'),
          ((SELECT id FROM new_fam), '${adult2.id}', 'owner');
        COMMIT;
      `)
    ).rejects.toThrow();
  });

  it("transfers family ownership to an existing adult member", async () => {
    await setAuthContext(db, adult1);
    const res = await db.query<{ family_id: string }>(
      "SELECT public.create_family_with_owner('Transfer Ailesi') as family_id;"
    );
    const familyId = res.rows[0].family_id;

    // Add adult2 as admin member
    await setAuthContext(db, null);
    await db.query(
      `INSERT INTO public.family_members (family_id, auth_user_id, role)
       VALUES ($1, $2, 'admin');`,
      [familyId, adult2.id]
    );

    // Transfer ownership as adult1
    await setAuthContext(db, adult1);
    const transferRes = await db.query<{ result_status: string }>(
      "SELECT * FROM public.transfer_family_ownership($1, $2);",
      [familyId, adult2.id]
    );
    expect(transferRes.rows[0].result_status).toBe("transferred");

    // Verify adult2 is now owner, adult1 is admin
    const members = await db.query<{ auth_user_id: string; role: string }>(
      "SELECT auth_user_id, role FROM public.family_members WHERE family_id = $1 ORDER BY role;",
      [familyId]
    );
    expect(members.rows.find((m) => m.auth_user_id === adult2.id)?.role).toBe("owner");
    expect(members.rows.find((m) => m.auth_user_id === adult1.id)?.role).toBe("admin");
  });

  it("rejects ownership transfer to a user who is not a member of the family", async () => {
    await setAuthContext(db, adult1);
    const res = await db.query<{ family_id: string }>(
      "SELECT public.create_family_with_owner('Guvenli Aile') as family_id;"
    );
    const familyId = res.rows[0].family_id;

    await expect(
      db.query("SELECT * FROM public.transfer_family_ownership($1, $2);", [familyId, adult2.id])
    ).rejects.toThrow(/new owner must already be an adult family member/);
  });
});
