import React from "react";
import {
  Calculator,
  BookOpen,
  Atom,
  Landmark,
  Compass,
  Globe,
  FileCheck,
  PlayCircle,
  ExternalLink,
  Tv,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/env";
import { getCurrentAdultMember } from "@/server/adult-service";

export const dynamic = "force-dynamic";

interface ApprovedResource {
  id: string;
  key: string;
  title: string;
  instructorOrPublisher: string;
  subjectName: string;
  subjectColor: string;
  badgeBg: string;
  icon: React.ComponentType<{ className?: string }>;
  resourceType: "youtube_playlist" | "meb_official";
  videoCount: number;
  url: string;
  description: string;
  isPrimary: boolean;
}

const MASTER_APPROVED_RESOURCES: ApprovedResource[] = [
  {
    id: "res-math-main",
    key: "math-main",
    title: "8. Sınıf LGS Matematik Konu Anlatımı",
    instructorOrPublisher: "Şenol Hoca / Hocalara Geldik",
    subjectName: "Matematik",
    subjectColor: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/60",
    badgeBg: "bg-blue-600 text-white",
    icon: Calculator,
    resourceType: "youtube_playlist",
    videoCount: 100,
    url: "https://www.youtube.com/watch?v=EuJ89QzqrAg&list=PLicNtF7vp6fnfDqrRLH6H7fIbzYT4ct4F",
    description: "Tüm LGS 2027 matematik konularını baştan sona kapsayan ana öğretim oynatma listesi.",
    isPrimary: true,
  },
  {
    id: "res-turkish-main",
    key: "turkish-main",
    title: "8. Sınıf LGS Türkçe & Paragraf Taktikleri",
    instructorOrPublisher: "Rüştü Hoca ile Türkçe",
    subjectName: "Türkçe",
    subjectColor: "text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/60",
    badgeBg: "bg-indigo-600 text-white",
    icon: BookOpen,
    resourceType: "youtube_playlist",
    videoCount: 92,
    url: "https://www.youtube.com/watch?v=VYsPntNKVdw&list=PLIBjFaUoJJ91bz7QQEBlxNJNZka5YQRr6",
    description: "Fiilimsiler, cümle türleri, anlatım bozuklukları ve 20 soruluk paragraf anlama teknikleri.",
    isPrimary: true,
  },
  {
    id: "res-science-topic",
    key: "science-topic",
    title: "8. Sınıf LGS Fen Bilimleri Konu Anlatımı",
    instructorOrPublisher: "Hocalara Geldik / Tonguç Akademi",
    subjectName: "Fen Bilimleri",
    subjectColor: "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60",
    badgeBg: "bg-emerald-600 text-white",
    icon: Atom,
    resourceType: "youtube_playlist",
    videoCount: 22,
    url: "https://www.youtube.com/watch?v=AHdk01aR4Ko&list=PLrQm7mt99FRV_Oe9xFavWzFpCIl7_XiWj",
    description: "Mevsimler, DNA ve Genetik Kod, Basınç, Madde ve Endüstri üniteleri tam müfredat serisi.",
    isPrimary: true,
  },
  {
    id: "res-science-questions",
    key: "science-questions",
    title: "LGS Fen Bilimleri Yeni Nesil Soru Çözümü",
    instructorOrPublisher: "Uzman Fen Eğitimcileri",
    subjectName: "Fen Bilimleri",
    subjectColor: "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60",
    badgeBg: "bg-emerald-600 text-white",
    icon: Atom,
    resourceType: "youtube_playlist",
    videoCount: 23,
    url: "https://www.youtube.com/watch?v=pQXhWnDZ3vM&list=PLrQm7mt99FRXcBnorCttd31HJEvg0En26",
    description: "Grafik ve deney temelli yeni nesil LGS fen sorularının model çözüm ve analizleri.",
    isPrimary: false,
  },
  {
    id: "res-history-main",
    key: "history-main",
    title: "T.C. İnkılap Tarihi ve Atatürkçülük",
    instructorOrPublisher: "Benim Hocam / Hocalara Geldik",
    subjectName: "İnkılap Tarihi",
    subjectColor: "text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60",
    badgeBg: "bg-rose-600 text-white",
    icon: Landmark,
    resourceType: "youtube_playlist",
    videoCount: 78,
    url: "https://www.youtube.com/watch?v=MltIX0oKpYU&list=PLsAsBPsriHNbXit4Ra3iuBrk1ZHZWxsOR",
    description: "Bir Kahraman Doğuyor'dan İkinci Dünya Savaşı'na kadar kronolojik ve kavramsal tam seri.",
    isPrimary: true,
  },
  {
    id: "res-religion-main",
    key: "religion-main",
    title: "Din Kültürü ve Ahlak Bilgisi Müfredat Serisi",
    instructorOrPublisher: "LGS Din Kültürü Akademisi",
    subjectName: "Din Kültürü",
    subjectColor: "text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950/60",
    badgeBg: "bg-teal-600 text-white",
    icon: Compass,
    resourceType: "youtube_playlist",
    videoCount: 37,
    url: "https://www.youtube.com/watch?v=wvdOE_75VnA&list=PLbRoPq-Zu-SWXGUbVt4t4UWo-4VjsMUo-",
    description: "Kader İnancı, Zekat, Sadaka, Din ve Hayat üniteleri ayet-hadis yorumlama teknikleri.",
    isPrimary: true,
  },
  {
    id: "res-english-main",
    key: "english-main",
    title: "8. Sınıf LGS İngilizce Master Serisi",
    instructorOrPublisher: "LGS English Channel",
    subjectName: "İngilizce",
    subjectColor: "text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/60",
    badgeBg: "bg-sky-600 text-white",
    icon: Globe,
    resourceType: "youtube_playlist",
    videoCount: 41,
    url: "https://www.youtube.com/watch?v=FaY3dFjZbns&list=PLSgpQDrUSYp94WgE9pzpHiOG5FwxnZBrr",
    description: "Friendship, Teen Life, In the Kitchen ve tüm 10 ünite kelime listeleri ile soru kalıpları.",
    isPrimary: true,
  },
  {
    id: "res-math-backup",
    key: "math-backup",
    title: "Matematik Yeni Nesil Soru Pratiği",
    instructorOrPublisher: "LGS Matematik Destek",
    subjectName: "Matematik",
    subjectColor: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/60",
    badgeBg: "bg-blue-600 text-white",
    icon: Calculator,
    resourceType: "youtube_playlist",
    videoCount: 17,
    url: "https://www.youtube.com/watch?v=Z7exqEHEqQA&list=PLHN_SjKO7rCI",
    description: "Zorlayıcı konular için alternatif anlatım ve pekiştirici yeni nesil soru çözümleri.",
    isPrimary: false,
  },
  {
    id: "res-meb-official",
    key: "meb-official",
    title: "MEB Ölçme ve Değerlendirme (ODSGM) Resmi Kitapçıkları",
    instructorOrPublisher: "T.C. Millî Eğitim Bakanlığı",
    subjectName: "Resmi MEB",
    subjectColor: "text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800",
    badgeBg: "bg-slate-800 text-white",
    icon: FileCheck,
    resourceType: "meb_official",
    videoCount: 8,
    url: "https://odsgm.meb.gov.tr/www/8sinif-calisma-sorulari/icerik/1632",
    description: "Bakanlığın her ay yayınladığı 8. sınıf örnek soruları, fasiküller ve çıkmış LGS sınavları.",
    isPrimary: true,
  },
];

export default async function AdultResourcesPage() {
  const supabase = env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createServerSupabaseClient();
  const adult = await getCurrentAdultMember(supabase);

  if (!adult) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Ders Kaynakları
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 shrink-0">
              9 Kaynak
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            LGS 2027 çalışma planındaki ders konu anlatım videoları ve MEB soru fasikülleri.
          </p>
        </div>
      </div>

      {/* Resources Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MASTER_APPROVED_RESOURCES.map((res) => {
          const Icon = res.icon;
          const isYouTube = res.resourceType === "youtube_playlist";

          return (
            <div
              key={res.id}
              className="flex flex-col justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md transition-all group"
            >
              <div>
                {/* Header: Subject badge & video count */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${res.subjectColor}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{res.subjectName}</span>
                  </span>

                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {res.videoCount} {isYouTube ? "Video" : "Fasikül"}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {res.title}
                </h3>

                {/* Channel / Publisher */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span className="font-medium truncate">{res.instructorOrPublisher}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {res.description}
                </p>
              </div>

              {/* Footer / CTA Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  {isYouTube ? (
                    <>
                      <Tv className="w-3 h-3 text-red-500" />
                      <span>YouTube Listesi</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-3 h-3 text-emerald-600" />
                      <span>Resmi MEB PDF</span>
                    </>
                  )}
                </div>

                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                >
                  <PlayCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Listeyi Aç</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
