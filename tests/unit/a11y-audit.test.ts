import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

function getAllSourceFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllSourceFiles(fullPath, fileList);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe("Accessibility & Domain Guardrail Invariant Tests", () => {
  it("strictly prohibits shame language across all UI and source files", () => {
    const srcDir = path.resolve(process.cwd(), "src");
    const allFiles = getAllSourceFiles(srcDir);

    const FORBIDDEN_WORDS = [
      "geciktin",
      "başarısız",
      "seri bozuldu",
      "ceza",
      "kaybettin",
      "yetersiz",
    ];

    const violations: { file: string; word: string; line: number }[] = [];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        const lower = line.toLowerCase();
        for (const word of FORBIDDEN_WORDS) {
          if (lower.includes(word)) {
            violations.push({
              file: path.relative(process.cwd(), file),
              word,
              line: index + 1,
            });
          }
        }
      });
    }

    expect(
      violations,
      `Shame language violations detected:\n${violations.map((v) => `${v.file}:${v.line} contains "${v.word}"`).join("\n")}`
    ).toHaveLength(0);
  });

  it("enforces WCAG 2.2 AA 44px touch targets in globals.css", () => {
    const cssPath = path.resolve(process.cwd(), "src/app/globals.css");
    const content = fs.readFileSync(cssPath, "utf-8");

    expect(content).toContain("min-height: 44px");
    expect(content).toContain(":focus-visible");
    expect(content).toContain("prefers-reduced-motion");
  });

  it("enforces single timezone (Europe/Istanbul) across domain date handling", () => {
    const timeUtilsPath = path.resolve(process.cwd(), "src/domain/time-utils.ts");
    const content = fs.readFileSync(timeUtilsPath, "utf-8");

    expect(content).toContain("Europe/Istanbul");
    expect(content).toContain("ISTANBUL_TIMEZONE");
  });

  it("verifies count-up Benchmark 20 invariant (no countdown timer)", () => {
    const timerCompPath = path.resolve(process.cwd(), "src/components/student/BenchmarkTimer.tsx");
    const content = fs.readFileSync(timerCompPath, "utf-8");

    // Must be count-up timer: displays elapsed time, no target countdown
    expect(content).toContain("elapsedSeconds");
    expect(content).not.toContain("targetTime");
    expect(content).not.toContain("countdown");
  });
});
