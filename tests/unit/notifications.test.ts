/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "@/lib/notifications";

describe("Notification Preferences (Opt-in & Granular Controls)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to strictly disabled (opt-in)", () => {
    const prefs = loadNotificationPreferences();
    expect(prefs.enabled).toBe(false);
    expect(prefs.eveningCutoff).toBe(true);
    expect(prefs.dailyReminder).toBe(true);
    expect(prefs.reminderTime).toBe("17:00");
  });

  it("saves and loads updated preferences faithfully", () => {
    const custom: NotificationPreferences = {
      enabled: true,
      eveningCutoff: false,
      dailyReminder: true,
      dailyMotivation: true,
      reminderTime: "18:30",
    };

    saveNotificationPreferences(custom);
    const loaded = loadNotificationPreferences();

    expect(loaded.enabled).toBe(true);
    expect(loaded.eveningCutoff).toBe(false);
    expect(loaded.reminderTime).toBe("18:30");
  });

  it("handles corrupted storage gracefully with defaults", () => {
    localStorage.setItem("lgs2027_notification_preferences", "invalid-json{{");
    const loaded = loadNotificationPreferences();
    expect(loaded).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });
});
