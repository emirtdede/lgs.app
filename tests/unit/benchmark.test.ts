import { describe, it, expect } from "vitest";
import {
  validateBenchmarkResult,
  calculateBenchmarkMetrics,
  BENCHMARK_QUESTION_COUNT,
} from "@/domain/benchmark";

describe("Domain: Benchmark 20 Rules", () => {
  it("validates exact sum of 20 questions", () => {
    expect(validateBenchmarkResult({ correct: 18, wrong: 2, blank: 0 }).isValid).toBe(true);
    expect(validateBenchmarkResult({ correct: 20, wrong: 0, blank: 0 }).isValid).toBe(true);
    expect(validateBenchmarkResult({ correct: 15, wrong: 3, blank: 2 }).isValid).toBe(true);

    // Sum is 19
    const res19 = validateBenchmarkResult({ correct: 15, wrong: 3, blank: 1 });
    expect(res19.isValid).toBe(false);
    expect(res19.totalEntered).toBe(19);
    expect(res19.remaining).toBe(1);
    expect(res19.errorMessage).toContain("tam olarak 20 soru olmalıdır");

    // Sum is 21
    const res21 = validateBenchmarkResult({ correct: 18, wrong: 2, blank: 1 });
    expect(res21.isValid).toBe(false);
    expect(res21.totalEntered).toBe(21);
    expect(res21.remaining).toBe(-1);

    // Negative numbers
    const resNeg = validateBenchmarkResult({ correct: -1, wrong: 20, blank: 1 });
    expect(resNeg.isValid).toBe(false);
  });

  it("calculates benchmark speed and accuracy metrics consistently", () => {
    // 20 questions in 1200 seconds (20 mins) -> 60 s/q
    const metrics = calculateBenchmarkMetrics(1200, { correct: 18, wrong: 2, blank: 0 });
    expect(metrics.durationSeconds).toBe(1200);
    expect(metrics.secondsPerQuestion).toBe(60);
    expect(metrics.accuracyPct).toBe(90);
    // Net: 18 - (2/3) = 17.33
    expect(metrics.netScore).toBe(17.33);
  });

  it("throws when calculating metrics on invalid sum", () => {
    expect(() => calculateBenchmarkMetrics(600, { correct: 10, wrong: 5, blank: 0 })).toThrow();
  });
});
