import { describe, it, expect } from "vitest";
import {
  getIstanbulDateString,
  formatIstanbulLongDate,
  isPast2150Cutoff,
  formatDuration,
  calculateElapsedSeconds,
} from "@/domain/time-utils";

describe("Domain: Time & Timezone Utilities", () => {
  it("formats dates in Europe/Istanbul (UTC+3)", () => {
    // 2026-10-01 00:30 UTC is 2026-10-01 03:30 Istanbul
    const d = new Date("2026-10-01T00:30:00Z");
    expect(getIstanbulDateString(d)).toBe("2026-10-01");

    // 2026-09-30 22:30 UTC is 2026-10-01 01:30 Istanbul
    const d2 = new Date("2026-09-30T22:30:00Z");
    expect(getIstanbulDateString(d2)).toBe("2026-10-01");
  });

  it("formats Turkish long date", () => {
    const formatted = formatIstanbulLongDate("2026-10-01");
    expect(formatted).toContain("Ekim");
    expect(formatted).toContain("2026");
  });

  it("enforces 22:00 evening rest time", () => {
    // 21:49:59 -> not past 22:00 rest time
    const dBefore = new Date("2026-10-01T21:49:59+03:00");
    expect(isPast2150Cutoff(dBefore)).toBe(false);

    // 22:00:00 -> 22:00 rest time active
    const dExact = new Date("2026-10-01T22:00:00+03:00");
    expect(isPast2150Cutoff(dExact)).toBe(true);

    // 22:05:00 -> 22:00 rest time active
    const dAfter = new Date("2026-10-01T22:05:00+03:00");
    expect(isPast2150Cutoff(dAfter)).toBe(true);
  });

  it("formats elapsed duration HH:MM:SS", () => {
    expect(formatDuration(0)).toBe("00:00:00");
    expect(formatDuration(65)).toBe("00:01:05");
    expect(formatDuration(3665)).toBe("01:01:05");
  });

  it("calculates elapsed seconds from ISO start", () => {
    const startedAt = "2026-10-01T10:00:00.000Z";
    const now = new Date("2026-10-01T10:02:15.000Z");
    expect(calculateElapsedSeconds(startedAt, now)).toBe(135);
  });
});
