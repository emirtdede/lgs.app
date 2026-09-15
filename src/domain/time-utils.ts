/**
 * Time and timezone utilities for LGS 2027 Study Tracker.
 * Canonical timezone: Europe/Istanbul (UTC+3, no DST changes).
 */

export const ISTANBUL_TIMEZONE = "Europe/Istanbul";

/**
 * Returns current date string formatted as YYYY-MM-DD in Europe/Istanbul.
 */
export function getIstanbulDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

export const getTodayDateIstanbul = getIstanbulDateString;

/**
 * Returns formatted Turkish long date (e.g. "1 Ekim 2026, Perşembe").
 */
export function formatIstanbulLongDate(dateStr: string | Date): string {
  if (!dateStr) return "";
  try {
    const d = typeof dateStr === "string" ? new Date(`${dateStr}T12:00:00+03:00`) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat("tr-TR", {
      timeZone: ISTANBUL_TIMEZONE,
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

/**
 * Returns current hours and minutes in Europe/Istanbul.
 */
export function getIstanbulTimeParts(date: Date = new Date()): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: ISTANBUL_TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hours = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minutes = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  const seconds = parseInt(parts.find((p) => p.type === "second")?.value ?? "0", 10);
  return { hours, minutes, seconds };
}

/**
 * Checks if current Istanbul time is past the 22:00 evening rest time.
 */
export function isPast2150Cutoff(date: Date = new Date()): boolean {
  const { hours } = getIstanbulTimeParts(date);
  return hours >= 22;
}

export const isPast2200RestTime = isPast2150Cutoff;

/**
 * Formats duration in seconds into HH:MM:SS or MM:SS string.
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return "00:00:00";
  const totalSec = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

/**
 * Computes elapsed seconds from a starting ISO date string to now.
 * Used for count-up timer refresh resilience.
 */
export function calculateElapsedSeconds(startedAtIso: string, now: Date = new Date()): number {
  if (!startedAtIso) return 0;
  const startMs = new Date(startedAtIso).getTime();
  if (isNaN(startMs)) return 0;
  const nowMs = now.getTime();
  return Math.max(0, Math.floor((nowMs - startMs) / 1000));
}
