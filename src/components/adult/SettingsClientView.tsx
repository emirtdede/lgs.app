"use client";

import React, { useState } from "react";
import type { FamilyRole } from "@/lib/supabase/types";
import {
  CheckCircle2,
  ShieldCheck,
  Clock,
  Users,
  UserCheck,
  Bell,
  Moon,
  Rocket,
} from "lucide-react";
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  requestNotificationPermission,
  sendTestNotification,
  type NotificationPreferences,
} from "@/lib/notifications";

export interface StudentInfo {
  id: string;
  displayName: string;
}

export interface PairedDeviceInfo {
  id: string;
  deviceLabel: string;
  pairedAt: string;
  status: string;
}

export interface MemberInfo {
  authUserId: string;
  role: FamilyRole;
}

interface SettingsClientViewProps {
  familyName: string;
  timezone: string;
  currentRole: FamilyRole;
  students: StudentInfo[];
  pairedDevices: PairedDeviceInfo[];
  members: MemberInfo[];
}

export function SettingsClientView({
  familyName,
  timezone,
  currentRole,
  students,
  members,
}: SettingsClientViewProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(loadNotificationPreferences);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleMasterToggle = async () => {
    if (!prefs.enabled) {
      const perm = await requestNotificationPermission();
      if (perm === "granted") {
        const updated = { ...prefs, enabled: true };
        setPrefs(updated);
        saveNotificationPreferences(updated);
        showToast("Bildirimler açıldı!");
      } else {
        showToast("Bildirim izni verilmedi.");
      }
    } else {
      const updated = { ...prefs, enabled: false };
      setPrefs(updated);
      saveNotificationPreferences(updated);
      showToast("Bildirimler kapatıldı.");
    }
  };

  const handleSubToggle = (key: keyof NotificationPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    saveNotificationPreferences(updated);
  };

  const roleLabels: Record<FamilyRole, string> = {
    owner: "Aile Yöneticisi",
    admin: "Yönetici",
    viewer: "Aile Hesabı",
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div
          role="status"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-lg text-xs font-semibold animate-in fade-in slide-in-from-top-2"
        >
          {toastMsg}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Uygulama & Aile Ayarları
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Bildirim tercihleri, saat dilimi ve aile profil bilgileri.
        </p>
      </div>

      {/* Family Info */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Aile Profili
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Aile Adı</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              {familyName}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Zaman Dilimi</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-sm flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {timezone === "Europe/Istanbul" ? "Türkiye Saati (TSİ)" : timezone}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Hesap Türü</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
              {roleLabels[currentRole] || "Aile Hesabı"}
            </span>
          </div>
        </div>
      </div>

      {/* Student Profile Section */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Kayıtlı Öğrenci
        </h2>
        <div className="space-y-3">
          {(students.length > 0 ? students : [{ id: "student-local-1", displayName: "Yusuf" }]).map(
            (student) => (
              <div
                key={student.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {student.displayName}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Ders masası, 20 soruluk hız ölçümü, Yanlışlar Havuzu
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Aktif
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Access Roles */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          Erişim Rolleri ve İzinler
        </h2>

        <div className="space-y-2">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Öğrenci Girişi
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Günlük çalışma listesi, 20 soruluk süre sayacı, soru ve okuma kayıtları girme.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md font-semibold text-[11px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              Ders Masası
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Aile Girişi</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Özet pano, hız grafikleri, geciken görevler, takvim ve yanlış analizi.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md font-semibold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              İzleme ve Takip
            </span>
          </div>
        </div>
      </div>

      {/* Notification Preferences Card */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              İsteğe Bağlı Bildirim & Hatırlatıcılar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Akşam uyku vakti ve çalışma başlangıç hatırlatmalarını bu cihazda açıp
              kapatabilirsiniz.
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

        <div className={`space-y-3 pt-1 ${!prefs.enabled ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-500" /> 21:50 Akşam Dinlenme Uyarısı
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                22:00 uyku vaktine doğru dinlenmeye geçilmesi için hatırlatma gönderir.
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

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5 text-blue-500" /> Günlük Çalışma Başlangıç Bildirimi
                ({prefs.reminderTime})
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Günün 20 soruluk çalışma hedeflerinin hazır olduğunu bildirir.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.dailyReminder}
              onClick={() => handleSubToggle("dailyReminder")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 after:absolute after:-inset-2 after:content-[''] ${
                prefs.dailyReminder ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span className="sr-only">Günlük Çalışma Başlangıç Bildirimi</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  prefs.dailyReminder ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {prefs.enabled && (
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  const ok = await sendTestNotification();
                  showToast(ok ? "Test bildirimi gönderildi!" : "Test bildirimi gönderilemedi.");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-xl hover:bg-blue-100 transition-colors min-h-[44px]"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Test Bildirimi Gönder</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
