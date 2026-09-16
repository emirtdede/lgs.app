"use client";

import React, { useState, useEffect } from "react";
import { Bell, Moon, Rocket, Sparkles, Wifi, Target } from "lucide-react";
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  requestNotificationPermission,
  getNotificationPermissionStatus,
  sendTestNotification,
  isNotificationSupported,
  type NotificationPreferences,
} from "@/lib/notifications";
import { useOfflineSyncStatus } from "@/lib/offline-sync";

export function StudentSettingsClientView() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(loadNotificationPreferences);
  const [permStatus, setPermStatus] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSyncStatus();

  useEffect(() => {
    setSupported(isNotificationSupported());
    setPermStatus(getNotificationPermissionStatus());
    setPrefs(loadNotificationPreferences());
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleMasterToggle = async () => {
    if (!prefs.enabled) {
      // User is enabling notifications
      const perm = await requestNotificationPermission();
      setPermStatus(perm);

      if (perm === "granted") {
        const updated = { ...prefs, enabled: true };
        setPrefs(updated);
        saveNotificationPreferences(updated);
        showToast("Bildirimler açıldı! İsteğe göre alt ayarları özelleştirebilirsin.");
      } else if (perm === "denied") {
        showToast("Tarayıcı bildirim izni engellendi. Tarayıcı ayarlarından izin verebilirsin.");
      }
    } else {
      // User is disabling notifications (instant & complete)
      const updated = { ...prefs, enabled: false };
      setPrefs(updated);
      saveNotificationPreferences(updated);
      showToast("Tüm bildirimler kapatıldı.");
    }
  };

  const handleSubToggle = (key: keyof NotificationPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    saveNotificationPreferences(updated);
  };

  const handleTimeChange = (timeStr: string) => {
    const updated = { ...prefs, reminderTime: timeStr };
    setPrefs(updated);
    saveNotificationPreferences(updated);
  };

  const handleSendTest = async () => {
    const ok = await sendTestNotification();
    if (ok) {
      showToast("Test bildirimi başarıyla gönderildi!");
    } else {
      showToast("Bildirim gönderilemedi. Lütfen bildirim iznini ve ana anahtarı kontrol edin.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {toastMsg && (
        <div
          role="status"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-lg text-xs font-semibold animate-in fade-in slide-in-from-top-2"
        >
          {toastMsg}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate whitespace-nowrap">
            Ayarlar & Tercihler
          </h1>
          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal truncate whitespace-nowrap hidden xs:inline">
            • Öğrenci Profili
          </span>
        </div>
      </div>

      {/* 1. NOTIFICATIONS CARD (STRICTLY OPT-IN & TOGGLEABLE) */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Bildirim & Hatırlatıcılar
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tamamen isteğe bağlıdır. Dilediğin an tek tıkla kapatabilirsin.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={prefs.enabled}
            onClick={handleMasterToggle}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 after:absolute after:-inset-2 after:content-[''] ${
              prefs.enabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span className="sr-only">Bildirimleri Aç/Kapat</span>
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                prefs.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {!supported && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-200">
            Bu tarayıcıda Web Bildirim API&apos;si desteklenmiyor.
          </div>
        )}

        {supported && permStatus === "denied" && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-200">
            Tarayıcı bildirim izni engellenmiş. Bildirim alabilmek için tarayıcı adres çubuğundaki
            kilit simgesinden bildirimlere izin vermen gerekir.
          </div>
        )}

        {/* Sub Toggles */}
        <div className={`space-y-3 pt-1 ${!prefs.enabled ? "opacity-50 pointer-events-none" : ""}`}>
          {/* Evening Cutoff 21:50 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="pr-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-500" /> 21:50 Akşam Dinlenme Uyarısı
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Beyninin öğrendiklerini kalıcı hafızaya kodlaması için uyku vaktini (22:00)
                hatırlatır.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.eveningCutoff}
              onClick={() => handleSubToggle("eveningCutoff")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 after:absolute after:-inset-2 after:content-[''] ${
                prefs.eveningCutoff ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span className="sr-only">21:50 Akşam Dinlenme Uyarısı</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  prefs.eveningCutoff ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Daily Study Reminder (Never overflows mobile width) */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                  <Rocket className="w-4 h-4 text-blue-500 shrink-0" /> Günlük Ders Hatırlatması
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Günün 20 soruluk hedeflerini masana davet eder.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.dailyReminder}
                onClick={() => handleSubToggle("dailyReminder")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                  prefs.dailyReminder ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span className="sr-only">Günlük Ders Hatırlatması</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    prefs.dailyReminder ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Time Picker Row when enabled */}
            {prefs.dailyReminder && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  Hatırlatma Saati:
                </span>
                <input
                  type="time"
                  value={prefs.reminderTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                />
              </div>
            )}
          </div>

          {/* Daily Motivation Quote */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="pr-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Günün İlhamı Bildirimi
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Her gün 270 özgün söz arasından o güne ait ilham sözünü sana ulaştırır.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.dailyMotivation}
              onClick={() => handleSubToggle("dailyMotivation")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 after:absolute after:-inset-2 after:content-[''] ${
                prefs.dailyMotivation ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span className="sr-only">Günün İlhamı Bildirimi</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  prefs.dailyMotivation ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Test Button */}
          {prefs.enabled && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSendTest}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-xl hover:bg-blue-100 transition-colors min-h-[44px]"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Test Bildirimi Gönder</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. OFFLINE & SYNC CARD */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              İnternetsiz Çalışma Desteği
            </h2>
          </div>
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              isOnline
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            {isOnline ? "Çevrimiçi" : "Çevrimdışı"}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          İnternet bağlantın kesilse bile sorularını çözebilir, sayaç başlatabilir ve not
          alabilirsin. Tüm çalışmaların cihazında güvenle saklanır ve internet bağlantısı
          sağlandığında otomatik olarak eşitlenir.
        </p>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">
            Eşitlenmeyi Bekleyen Kayıt Sayısı:{" "}
            <strong className="text-slate-900 dark:text-slate-100 font-bold">{pendingCount}</strong>
          </span>
          {isOnline && pendingCount > 0 && (
            <button
              type="button"
              onClick={syncNow}
              disabled={isSyncing}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors min-h-[36px]"
            >
              {isSyncing ? "Eşitleniyor..." : "Şimdi Eşitle"}
            </button>
          )}
        </div>
      </div>

      {/* 3. LGS 2027 MILESTONE ANCHOR CARD */}
      <div className="p-5 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 dark:from-slate-900 dark:to-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Yusuf&apos;un LGS 2027 Yol Haritası
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
              1. Aşama: Başlangıç
            </span>
            <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">1 Ekim 2026</p>
            <p className="text-[11px] text-slate-500">Temel Kurma & Alışkanlık</p>
          </div>

          <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
              2. Aşama: Konu Bitiş
            </span>
            <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">13 Nisan 2027</p>
            <p className="text-[11px] text-slate-500">195. Gün • Konular Biter</p>
          </div>

          <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
              3. Aşama: Deneme Dönemi
            </span>
            <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              14 Nisan – 12 Haziran
            </p>
            <p className="text-[11px] text-slate-500">60 Gün • 60 Tam Deneme</p>
          </div>
        </div>
      </div>
    </div>
  );
}
