import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdultMember, DEFAULT_ADULT } from "@/server/adult-service";
import { AdultNav } from "@/components/adult/AdultNav";

export const dynamic = "force-dynamic";

export default async function AdultLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const adult = (await getCurrentAdultMember(supabase)) || DEFAULT_ADULT;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <AdultNav familyName={adult.familyName} role={adult.role} />
      <main id="main-content" className="flex-1 pb-24 md:pb-8 focus:outline-none pt-[env(safe-area-inset-top,0px)] md:pt-0">
        {children}
      </main>
    </div>
  );
}
