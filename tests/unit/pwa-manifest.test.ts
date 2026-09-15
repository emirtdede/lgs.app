import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import manifest from "@/app/manifest";

describe("PWA Manifest and Service Worker Verification", () => {
  it("verifies public/manifest.json format and icons", () => {
    const manifestPath = path.resolve(process.cwd(), "public/manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(content.name).toBe("LGS 2027 Çalışma Takibi");
    expect(content.short_name).toBe("LGS 2027");
    expect(content.display).toBe("standalone");
    expect(content.start_url).toBe("/");
    expect(content.theme_color).toBe("#2563eb");
    expect(content.background_color).toBe("#0f172a");

    expect(Array.isArray(content.icons)).toBe(true);
    expect(content.icons.length).toBeGreaterThanOrEqual(2);

    // Verify each icon referenced actually exists on disk
    for (const icon of content.icons) {
      const iconFilePath = path.resolve(process.cwd(), "public", icon.src.replace(/^\//, ""));
      expect(fs.existsSync(iconFilePath)).toBe(true);
      const stats = fs.statSync(iconFilePath);
      expect(stats.size).toBeGreaterThan(500); // Valid image file
    }
  });

  it("verifies dynamic Next.js manifest route output", () => {
    const dynManifest = manifest();
    expect(dynManifest.name).toBe("LGS 2027 Çalışma Takibi");
    expect(dynManifest.short_name).toBe("LGS 2027");
    expect(dynManifest.display).toBe("standalone");
    expect(dynManifest.start_url).toBe("/");
    expect(dynManifest.theme_color).toBe("#2563eb");
    expect(dynManifest.background_color).toBe("#0f172a");
  });

  it("verifies public/sw.js exists and handles offline fallback", () => {
    const swPath = path.resolve(process.cwd(), "public/sw.js");
    expect(fs.existsSync(swPath)).toBe(true);

    const swCode = fs.readFileSync(swPath, "utf-8");
    expect(swCode).toContain("install");
    expect(swCode).toContain("activate");
    expect(swCode).toContain("fetch");
    expect(swCode).toContain("caches.match");
    expect(swCode).toContain("İnternet Bağlantısı Yok");
  });
});
