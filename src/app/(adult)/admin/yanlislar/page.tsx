import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/env";
import { getCurrentAdultMember } from "@/server/adult-service";

export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  knowledge_gap: "Bilgi Eksiği",
  calculation_error: "İşlem Hatası",
  misread: "Soruyu Yanlış Okuma",
  attention: "Dikkatsizlik",
  strategy: "Süre / Strateji",
  unknown: "Diğer",
};

export default async function AdminMistakesPage() {
  const supabase = env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createServerSupabaseClient();
  const adult = await getCurrentAdultMember(supabase);

  if (!adult) {
    return null;
  }

  // Fetch all mistakes with subject and topic names
  const { data: mistakesData } = await supabase
    .from("mistakes")
    .select(
      `id, reason, note, status, created_at, resolved_at,
       subjects(name_tr),
       topics(name_tr)`
    )
    .order("created_at", { ascending: false });

  const mistakes = (mistakesData as any[]) || [];

  // Group counts by reason
  const countsByReason = new Map<string, { total: number; resolved: number }>();
  for (const m of mistakes) {
    const entry = countsByReason.get(m.reason) || { total: 0, resolved: 0 };
    entry.total += 1;
    if (m.status === "resolved") {
      entry.resolved += 1;
    }
    countsByReason.set(m.reason, entry);
  }

  const openCount = mistakes.filter((m) => m.status === "open").length;
  const reviewedCount = mistakes.filter((m) => m.status === "reviewed").length;
  const resolvedCount = mistakes.filter((m) => m.status === "resolved").length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Yanlış Soru Analizi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Öğrencinin çözdüğü sorularda karşılaşılan yanlış nedenleri ve tekrar çözüm süreci.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">İncelenmedi (Açık)</span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{openCount}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">İncelendi</span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {reviewedCount}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Çözüldü</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {resolvedCount}
          </span>
        </div>
      </div>

      {/* Breakdown by Reason */}
      <div className="mb-8 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Yanlış Nedenleri Dağılımı
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {Object.entries(REASON_LABELS).map(([reasonKey, label]) => {
            const data = countsByReason.get(reasonKey) || { total: 0, resolved: 0 };
            return (
              <div
                key={reasonKey}
                className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-center"
              >
                <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                  {label}
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {data.total}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {data.resolved} çözüldü
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mistakes Detailed List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Kayıtlı Yanlış Sorular ({mistakes.length})
          </h2>
        </div>

        {/* Mobile Cards (Visible on screens < md) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {mistakes.map((m: any) => (
            <div key={m.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {m.subjects?.name_tr ?? "Ders"}
                </span>
                {m.status === "open" ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-[11px]">
                    İncelenmedi
                  </span>
                ) : m.status === "reviewed" ? (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                    İncelendi
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                    Çözüldü
                  </span>
                )}
              </div>
              {m.topics?.name_tr && (
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {m.topics.name_tr}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
                <span>
                  Neden:{" "}
                  <strong className="font-semibold text-slate-800 dark:text-slate-200">
                    {REASON_LABELS[m.reason] ?? m.reason}
                  </strong>
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(m.created_at).toLocaleDateString("tr-TR")}
                </span>
              </div>
              {m.note && (
                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 italic">
                  &ldquo;{m.note}&rdquo;
                </p>
              )}
            </div>
          ))}

          {mistakes.length === 0 && (
            <div className="p-6 text-center text-slate-500 text-xs">
              Kayıtlı yanlış soru bulunmuyor.
            </div>
          )}
        </div>

        {/* Desktop Table (Visible on md and up) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">Ders / Konu</th>
                <th className="py-3 px-4">Neden</th>
                <th className="py-3 px-4">Öğrenci Notu</th>
                <th className="py-3 px-4 text-right">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {mistakes.map((m: any) => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(m.created_at).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {m.subjects?.name_tr ?? "Ders"}
                    </span>
                    {m.topics?.name_tr && (
                      <span className="text-slate-400 block text-[11px]">{m.topics.name_tr}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium">{REASON_LABELS[m.reason] ?? m.reason}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {m.note ?? "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {m.status === "open" ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-[11px]">
                        İncelenmedi
                      </span>
                    ) : m.status === "reviewed" ? (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                        İncelendi
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                        Çözüldü
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {mistakes.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Kayıtlı yanlış soru bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
