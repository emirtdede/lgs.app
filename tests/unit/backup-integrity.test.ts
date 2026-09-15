import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { exportBackup, verifyBackupIntegrity, computeSha256 } from "@/../scripts/backup-data";

describe("Database Backup & Observability Integrity", () => {
  it("exports valid JSON backup and verifiable SHA-256 checksum", async () => {
    const testDir = path.resolve(process.cwd(), "backups/test-run");
    const result = await exportBackup(testDir);

    expect(fs.existsSync(result.backupPath)).toBe(true);
    expect(fs.existsSync(result.checksumPath)).toBe(true);

    const valid = verifyBackupIntegrity(result.backupPath, result.checksumPath);
    expect(valid).toBe(true);

    // Test tamper resistance
    const originalContent = fs.readFileSync(result.backupPath, "utf-8");
    fs.writeFileSync(result.backupPath, originalContent + " "); // Tamper with 1 space
    const tampered = verifyBackupIntegrity(result.backupPath, result.checksumPath);
    expect(tampered).toBe(false);

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it("computes reproducible SHA-256 hash", () => {
    const hash1 = computeSha256("test-data-payload");
    const hash2 = computeSha256("test-data-payload");
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });
});
