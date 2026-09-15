import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export function computeSha256(content: string | Buffer): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export async function exportBackup(outputDir: string = "backups"): Promise<{
  backupPath: string;
  checksumPath: string;
  sha256: string;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = `lgs2027_backup_${timestamp}.json`;
  const checksumFileName = `lgs2027_backup_${timestamp}.sha256`;

  const backupPath = path.join(outputDir, backupFileName);
  const checksumPath = path.join(outputDir, checksumFileName);

  const tablesDump: Record<string, unknown> = {};

  if (supabaseUrl && serviceRoleKey) {
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const tables = [
      "families",
      "family_members",
      "students",
      "student_devices",
      "pairing_codes",
      "plan_days",
      "tasks",
      "study_sessions",
      "mistake_records",
      "plan_audit_log",
      "plan_imports",
    ];

    for (const table of tables) {
      const { data, error } = await admin.from(table).select("*");
      if (error) {
        console.warn(`[Backup] Warning reading table ${table}:`, error.message);
        tablesDump[table] = [];
      } else {
        tablesDump[table] = data ?? [];
      }
    }
  } else {
    // Schema / metadata export placeholder for offline / CI environments
    tablesDump.note = "Local test environment export";
  }

  const dump = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    tables: tablesDump,
  };

  const jsonContent = JSON.stringify(dump, null, 2);
  const hash = computeSha256(jsonContent);

  fs.writeFileSync(backupPath, jsonContent, "utf-8");
  fs.writeFileSync(checksumPath, `${hash}  ${backupFileName}\n`, "utf-8");

  return { backupPath, checksumPath, sha256: hash };
}

export function verifyBackupIntegrity(backupPath: string, checksumPath: string): boolean {
  if (!fs.existsSync(backupPath) || !fs.existsSync(checksumPath)) {
    return false;
  }

  const content = fs.readFileSync(backupPath, "utf-8");
  const expectedHash = computeSha256(content);

  const checksumLine = fs.readFileSync(checksumPath, "utf-8").trim();
  const [recordedHash] = checksumLine.split(/\s+/);

  return expectedHash.toLowerCase() === recordedHash?.toLowerCase();
}
