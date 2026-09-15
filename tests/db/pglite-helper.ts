import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
import path from "path";

export interface TestUser {
  id: string;
  email: string;
  isAnonymous: boolean;
}

export async function createTestDatabase(): Promise<PGlite> {
  const db = new PGlite();

  // 1. Setup mock auth schema that mimics Supabase Auth and required roles
  await db.exec(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
      END IF;
    END
    $$;

    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text,
      is_anonymous boolean DEFAULT false,
      raw_user_meta_data jsonb DEFAULT '{}'::jsonb
    );

    CREATE OR REPLACE FUNCTION auth.uid()
    RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;

    CREATE OR REPLACE FUNCTION auth.jwt()
    RETURNS jsonb LANGUAGE sql STABLE AS $$
      SELECT coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
    $$;
    CREATE SCHEMA IF NOT EXISTS extensions;
    CREATE OR REPLACE FUNCTION extensions.digest(data text, type text)
    RETURNS bytea LANGUAGE sql IMMUTABLE AS $$
      SELECT decode(md5(data) || md5(data), 'hex');
    $$;

    CREATE OR REPLACE FUNCTION extensions.gen_random_bytes(n integer)
    RETURNS bytea LANGUAGE sql VOLATILE AS $$
      SELECT decode(md5(random()::text) || md5(random()::text), 'hex');
    $$;
  `);

  // 2. Read and apply all migrations in order
  const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    let sql = fs.readFileSync(filePath, "utf-8");
    // In PGlite WASM, pgcrypto is provided via extensions functions above
    sql = sql.replace(
      /create extension if not exists pgcrypto;/gi,
      "-- create extension if not exists pgcrypto;"
    );
    await db.exec(sql);
  }

  // 3. Seed canonical subjects
  await db.exec(`
    insert into public.subjects (code, name_tr) values
      ('matematik', 'Matematik'),
      ('turkce', 'Türkçe'),
      ('fen', 'Fen Bilimleri'),
      ('inkilap', 'T.C. İnkılap Tarihi ve Atatürkçülük'),
      ('din', 'Din Kültürü ve Ahlak Bilgisi'),
      ('ingilizce', 'İngilizce'),
      ('okuma', 'Okuma'),
      ('genel', 'Genel'),
      ('deneme', 'Deneme')
    on conflict (code) do nothing;
  `);

  // Default test time override to daytime (16:00) so tests can run cleanly at night
  await db.exec(`
    DO $$
    BEGIN
      PERFORM set_config('app.override_time', '16:00', false);
    END
    $$;
  `);

  return db;
}

export async function createAuthUser(
  db: PGlite,
  email: string,
  isAnonymous = false
): Promise<TestUser> {
  await db.exec("RESET ROLE;");
  const res = await db.query<TestUser>(
    `INSERT INTO auth.users (email, is_anonymous)
     VALUES ($1, $2)
     RETURNING id, email, is_anonymous as "isAnonymous"`,
    [email, isAnonymous]
  );
  return res.rows[0];
}

export async function setAuthContext(db: PGlite, user: TestUser | null) {
  if (!user) {
    await db.exec(`
      SELECT set_config('request.jwt.claim.sub', '', false);
      SELECT set_config('request.jwt.claims', '{}', false);
      RESET ROLE;
    `);
  } else {
    const claims = JSON.stringify({
      sub: user.id,
      email: user.email,
      is_anonymous: user.isAnonymous,
      role: "authenticated",
    });
    const escapedClaims = claims.replace(/'/g, "''");
    await db.exec(`
      SELECT set_config('request.jwt.claim.sub', '${user.id}', false);
      SELECT set_config('request.jwt.claims', '${escapedClaims}', false);
      SET ROLE authenticated;
    `);
  }
}
