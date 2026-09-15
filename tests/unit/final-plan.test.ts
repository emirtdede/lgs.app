import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { XlsxParser } from "@/domain/plan-import/xlsx-parser";
import {
  computeSha256,
  parseExcelDate,
  mapTaskType,
  cleanUrl,
  AUTHORITATIVE_PLAYLISTS,
} from "@/domain/plan-import/final-plan-importer";
import { buildEmptyTodayData, PLAN_START_DATE, EXAM_ANCHOR_DATE } from "@/server/student-service";

describe("LGS 2027 Final 500 Plan Specifications", () => {
  const xlsxPath = path.join(process.cwd(), "data", "LGS_2027_MASTER_PLAN.xlsx");
  const xlsxBuffer = fs.readFileSync(xlsxPath);
  const parser = new XlsxParser(xlsxBuffer);
  const rows = parser.parseSheet("Gunluk_Gorevler");

  it("verifies authoritative workbook row count and SHA-256", () => {
    expect(rows.length).toBe(2947);
    const sha256 = computeSha256(xlsxBuffer);
    expect(sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("verifies 1 October 2026 start date and core tasks (NO random Çarpanlar ve Katlar)", () => {
    const oct1Rows = rows.filter((r) => parseExcelDate(r.data.Tarih) === "2026-10-01");
    expect(oct1Rows.length).toBe(12);

    // 1. Math topic video is Temel Kavramlar
    const mathVideo = oct1Rows.find(
      (r) => r.data.Ders === "Matematik" && r.data["Görev Türü"] === "Konu / Tekrar"
    );
    expect(mathVideo).toBeDefined();
    expect(mathVideo?.data.Konu).toBe("Temel Kavramlar");
    expect(mathVideo?.data.Kaynak).toContain("Matematik Ana Oynatma Listesi");

    // 2. Math questions is SAME TOPIC (Temel Kavramlar), 20 questions
    const mathQuestions = oct1Rows.find(
      (r) => r.data.Ders === "Matematik" && r.data["Görev Türü"] === "Kitap / MEB / Mastery"
    );
    expect(mathQuestions).toBeDefined();
    expect(mathQuestions?.data.Konu).toBe("Temel Kavramlar");
    expect(mathQuestions?.data["Planlanan Soru"]).toBe("20");

    // 3. Turkish Paragraph routine: 20 questions
    const paragraph = oct1Rows.find(
      (r) => r.data.Ders === "Türkçe" && r.data["Görev Türü"] === "Paragraf Rutini"
    );
    expect(paragraph).toBeDefined();
    expect(paragraph?.data["Planlanan Soru"]).toBe("20");

    // 4. Turkish topic: Sözcükte Anlam
    const turkishVideo = oct1Rows.find(
      (r) => r.data.Ders === "Türkçe" && r.data["Görev Türü"] === "Konu / Tekrar"
    );
    expect(turkishVideo).toBeDefined();
    expect(turkishVideo?.data.Konu).toBe("Sözcükte Anlam");

    // 5. Third subject is Fen: Mevsimlerin Oluşumu
    const scienceVideo = oct1Rows.find(
      (r) => r.data.Ders === "Fen" && r.data["Görev Türü"] === "Konu / Tekrar"
    );
    expect(scienceVideo).toBeDefined();
    expect(scienceVideo?.data.Konu).toBe("Mevsimlerin Oluşumu");

    // 6. Confirms NO independent Math benchmark task exists
    const independentBenchmark = oct1Rows.find(
      (r) => r.data["Görev Türü"] === "Günlük Rutin" && r.data.Ders === "Matematik"
    );
    expect(independentBenchmark).toBeUndefined();

    // 7. Confirms NO Çarpanlar ve Katlar on 1 Oct
    const carpanlarTask = oct1Rows.find((r) => r.data.Konu?.includes("Çarpanlar ve Katlar"));
    expect(carpanlarTask).toBeUndefined();
  });

  it("verifies learning phase daily Math and Turkish structure across all 195 learning days", () => {
    const daysMap = new Map<
      string,
      { mathVideo: boolean; mathQ: boolean; parag: boolean; turkVideo: boolean }
    >();

    for (const r of rows) {
      const date = parseExcelDate(r.data.Tarih);
      if (date > "2027-04-13") continue;

      const current = daysMap.get(date) || {
        mathVideo: false,
        mathQ: false,
        parag: false,
        turkVideo: false,
      };
      const subj = r.data.Ders;
      const tt = r.data["Görev Türü"];

      if (subj === "Matematik" && tt === "Konu / Tekrar") current.mathVideo = true;
      if (subj === "Matematik" && tt === "Kitap / MEB / Mastery") current.mathQ = true;
      if (subj === "Türkçe" && tt === "Paragraf Rutini") current.parag = true;
      if (subj === "Türkçe" && tt === "Konu / Tekrar") current.turkVideo = true;

      daysMap.set(date, current);
    }

    expect(daysMap.size).toBe(195);
    for (const [date, d] of daysMap.entries()) {
      expect(d.mathVideo).toBe(true);
      expect(d.mathQ).toBe(true);
      expect(d.parag).toBe(true);
      expect(d.turkVideo).toBe(true);
    }
  });

  it("verifies deterministic third-subject rotation (Fen -> Din -> İnkılap -> İngilizce)", () => {
    const thirdSubjectByDate = new Map<string, string[]>();

    for (const r of rows) {
      const date = parseExcelDate(r.data.Tarih);
      if (date > "2027-04-13") continue;

      const subj = r.data.Ders;
      if (subj && ["Fen", "Din", "İnkılap", "İngilizce"].includes(subj)) {
        const list = thirdSubjectByDate.get(date) || [];
        if (!list.includes(subj)) list.push(subj);
        thirdSubjectByDate.set(date, list);
      }
    }

    const dates = Array.from(thirdSubjectByDate.keys()).sort();
    expect(dates.length).toBe(195);

    const expectedRotation = ["Fen", "Din", "İnkılap", "İngilizce"];
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const subjects = thirdSubjectByDate.get(date) || [];
      const expectedSubject = expectedRotation[i % 4];
      expect(subjects).toContain(expectedSubject);
    }
  });

  it("verifies authoritative general playlist URLs are present", () => {
    expect(AUTHORITATIVE_PLAYLISTS.length).toBe(8);
    for (const pl of AUTHORITATIVE_PLAYLISTS) {
      expect(pl.url).toMatch(/^https:\/\/(www\.)?youtube\.com/);
      expect(pl.label.length).toBeGreaterThan(0);
    }
  });

  it("verifies mandatory (2005) and optional (942) task counts", () => {
    let mandatory = 0;
    let optional = 0;
    for (const r of rows) {
      if (r.data.Zorunlu?.trim() === "Evet") mandatory++;
      else optional++;
    }
    expect(mandatory).toBe(2005);
    expect(optional).toBe(942);
  });

  it("verifies hard content deadline (13 April 2027)", () => {
    const dates = Array.from(new Set(rows.map((r) => parseExcelDate(r.data.Tarih)))).sort();
    const learningPhaseDates = dates.filter((d) => d <= "2027-04-13");
    expect(learningPhaseDates.length).toBe(195);
    expect(learningPhaseDates[learningPhaseDates.length - 1]).toBe("2027-04-13");
  });

  it("verifies final 60-day mock period (14 April 2027 to 12 June 2027) with 60 full mock exams", () => {
    const dates = Array.from(new Set(rows.map((r) => parseExcelDate(r.data.Tarih)))).sort();
    const mockDates = dates.filter((d) => d >= "2027-04-14" && d <= "2027-06-12");
    expect(mockDates.length).toBe(60);
    expect(mockDates[0]).toBe("2027-04-14");
    expect(mockDates[59]).toBe("2027-06-12");

    // Verify 60 verbal and 60 numerical mock sessions
    let verbalCount = 0;
    let numericalCount = 0;
    let mockAnalysisCount = 0;
    let remediationCount = 0;

    for (const r of rows) {
      const tt = r.data["Görev Türü"];
      if (tt === "Tam LGS Denemesi - Sözel") verbalCount++;
      if (tt === "Tam LGS Denemesi - Sayısal") numericalCount++;
      if (tt === "Deneme Analizi") mockAnalysisCount++;
      if (tt === "Hedefli Eksik Giderme") remediationCount++;
    }

    expect(verbalCount).toBe(60);
    expect(numericalCount).toBe(60);
    expect(mockAnalysisCount).toBe(60);
    expect(remediationCount).toBe(60);
  });

  it("verifies temporary exam anchor is 13 June 2027", () => {
    expect(EXAM_ANCHOR_DATE).toBe("2027-06-13");
    const anchorRows = rows.filter((r) => parseExcelDate(r.data.Tarih) === "2027-06-13");
    expect(anchorRows.length).toBeGreaterThan(0);
  });

  it("verifies pre-plan start state before 1 October (NO fake mock fallback data)", () => {
    const emptyToday = buildEmptyTodayData("2026-09-14");
    expect(emptyToday.isPrePlanStart).toBe(true);
    expect(emptyToday.prePlanMessage).toBe("Plan 1 Ekim 2026 tarihinde başlıyor.");
    expect(emptyToday.routineTasks).toHaveLength(0);
    expect(emptyToday.topicTasks).toHaveLength(0);
    expect(emptyToday.completedTasks).toHaveLength(0);
  });

  it("verifies spaced error reviews (+1 / +7 / +21)", () => {
    const spacedTasks = rows.filter((r) => r.data["Görev Türü"] === "Aralıklı Hata Tekrarı");
    expect(spacedTasks.length).toBe(255);
    for (const st of spacedTasks) {
      expect(st.data.Konu).toBe("+1 / +7 / +21");
    }
  });
});
