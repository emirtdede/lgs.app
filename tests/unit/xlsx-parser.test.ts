import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { XlsxParser } from "@/domain/plan-import/xlsx-parser";

describe("XlsxParser", () => {
  const xlsxPath = path.join(process.cwd(), "data", "LGS_2027_MASTER_PLAN.xlsx");
  const buffer = fs.readFileSync(xlsxPath);

  it("correctly parses workbook sheets", () => {
    const parser = new XlsxParser(buffer);
    const sheets = parser.getSheetNames();
    expect(sheets.length).toBe(21);
    expect(sheets).toContain("Gunluk_Gorevler");
    expect(sheets).toContain("Matematik_Yol");
    expect(sheets).toContain("Turkce_Yol");
    expect(sheets).toContain("Fen_Yol");
    expect(sheets).toContain("Inkilap_Yol");
    expect(sheets).toContain("Din_Yol");
    expect(sheets).toContain("Ingilizce_Yol");
    expect(sheets).toContain("MEB_Takibi");
    expect(sheets).toContain("Kaynaklar");
    expect(sheets).toContain("Dashboard");
  });

  it("correctly parses all 2947 rows in Gunluk_Gorevler", () => {
    const parser = new XlsxParser(buffer);
    const rows = parser.parseSheet("Gunluk_Gorevler");
    expect(rows.length).toBe(2947);

    // Verify row 0 (TaskID=1, Dinlenme)
    const firstRow = rows[0].data;
    expect(firstRow["TaskID"]).toBe("1");
    expect(firstRow["Görev Türü"]).toBe("Dinlenme");

    // Verify row 1 (TaskID=2, Temel Kavramlar, Konu / Tekrar)
    const secondRow = rows[1].data;
    expect(secondRow["TaskID"]).toBe("2");
    expect(secondRow["Ders"]).toBe("Matematik");
    expect(secondRow["Konu"]).toBe("Temel Kavramlar");
    expect(secondRow["Görev Türü"]).toBe("Konu / Tekrar");
  });
});
