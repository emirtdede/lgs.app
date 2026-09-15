/**
 * Domain rules and invariants for Benchmark 20 routines.
 * Canonical: docs/10_TIMER_AND_BENCHMARK_SPEC.md & docs/05_DOMAIN_MODEL_AND_INVARIANTS.md
 */

export const BENCHMARK_QUESTION_COUNT = 20;

export interface BenchmarkResultInput {
  correct: number;
  wrong: number;
  blank: number;
}

export interface BenchmarkValidationResult {
  isValid: boolean;
  totalEntered: number;
  remaining: number;
  errorMessage?: string;
}

export function validateBenchmarkResult(input: BenchmarkResultInput): BenchmarkValidationResult {
  const { correct, wrong, blank } = input;

  if (
    !Number.isInteger(correct) ||
    !Number.isInteger(wrong) ||
    !Number.isInteger(blank) ||
    correct < 0 ||
    wrong < 0 ||
    blank < 0
  ) {
    return {
      isValid: false,
      totalEntered: 0,
      remaining: BENCHMARK_QUESTION_COUNT,
      errorMessage: "Soru sayıları sıfır veya pozitif tam sayı olmalıdır.",
    };
  }

  const total = correct + wrong + blank;
  const remaining = BENCHMARK_QUESTION_COUNT - total;

  if (total !== BENCHMARK_QUESTION_COUNT) {
    return {
      isValid: false,
      totalEntered: total,
      remaining,
      errorMessage: `Benchmark toplamı tam olarak 20 soru olmalıdır (Şu an: ${total}).`,
    };
  }

  return {
    isValid: true,
    totalEntered: total,
    remaining: 0,
  };
}

export interface BenchmarkMetrics {
  durationSeconds: number;
  secondsPerQuestion: number;
  correct: number;
  wrong: number;
  blank: number;
  accuracyPct: number;
  netScore: number;
}

export function calculateBenchmarkMetrics(
  durationSeconds: number,
  input: BenchmarkResultInput
): BenchmarkMetrics {
  const validation = validateBenchmarkResult(input);
  if (!validation.isValid) {
    throw new Error(validation.errorMessage ?? "Invalid benchmark result");
  }

  const duration = Math.max(0, durationSeconds);
  const secondsPerQuestion = Math.round((duration / BENCHMARK_QUESTION_COUNT) * 10) / 10;
  const accuracyPct = Math.round((input.correct / BENCHMARK_QUESTION_COUNT) * 1000) / 10;
  const netScore = Math.max(0, Math.round((input.correct - input.wrong / 3) * 100) / 100);

  return {
    durationSeconds: duration,
    secondsPerQuestion,
    correct: input.correct,
    wrong: input.wrong,
    blank: input.blank,
    accuracyPct,
    netScore,
  };
}
