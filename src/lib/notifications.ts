/**
 * Client-side Notification Management & Scheduling for LGS 2027.
 * Strictly optional (opt-in), completely toggleable by student or parent.
 * Uses standard Web Notification API & Service Worker showNotification.
 */

export interface NotificationPreferences {
  enabled: boolean;
  eveningCutoff: boolean;
  dailyReminder: boolean;
  dailyMotivation: boolean;
  reminderTime: string; // e.g. "17:00"
}

const STORAGE_KEY = "lgs2027_notification_preferences";

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: false, // Default is strictly OFF as requested
  eveningCutoff: true,
  dailyReminder: true,
  dailyMotivation: true,
  reminderTime: "17:00",
};

/**
 * Loads notification preferences from localStorage safely.
 */
export function loadNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...parsed,
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

/**
 * Saves notification preferences to localStorage.
 */
export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Graceful fallback
  }
}

/**
 * Checks if browser supports Notification API.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Requests notification permission from user.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/**
 * Gets current notification permission status.
 */
export function getNotificationPermissionStatus(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

export interface AppNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
}

/**
 * Sends a notification using Service Worker registration or native Notification.
 */
export async function sendAppNotification(payload: AppNotificationPayload): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;

  const prefs = loadNotificationPreferences();
  if (!prefs.enabled) return false;

  const iconUrl = payload.icon || "/icons/icon-192.png";
  const badgeUrl = payload.badge || "/icons/icon-72.png";

  try {
    // Prefer service worker showNotification for mobile/PWA background support
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && "showNotification" in reg) {
        await reg.showNotification(payload.title, {
          body: payload.body,
          icon: iconUrl,
          badge: badgeUrl,
          tag: payload.tag || "lgs2027-notification",
          data: { url: payload.url || "/" },
        });
        return true;
      }
    }

    // Fallback to desktop Web Notification
    new Notification(payload.title, {
      body: payload.body,
      icon: iconUrl,
    });
    return true;
  } catch (err) {
    console.warn("Notification display failed:", err);
    return false;
  }
}

/**
 * Sends a test notification to verify user's audio/visual alerts.
 */
export async function sendTestNotification(): Promise<boolean> {
  return sendAppNotification({
    title: "LGS 2027 Çalışma Takibi",
    body: "Bildirimler başarıyla açıldı! İhtiyacın olan hatırlatmalar tam vaktinde burada olacak.",
    url: "/today",
    tag: "test-notification",
  });
}
