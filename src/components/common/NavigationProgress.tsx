"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Sleek, zero-dependency Top Navigation Progress Bar.
 * Immediately triggers on internal link clicks and completes on route transition.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete and reset progress bar when pathname changes
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Intercept click on internal links to provide instant 0ms feedback
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      // Only internal route links, not external, not hashes, not target="_blank"
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("/#") &&
        target.getAttribute("target") !== "_blank" &&
        href !== pathname
      ) {
        setLoading(true);
        setProgress(30);
        setTimeout(() => setProgress(75), 100);
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(59,130,246,0.6)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transitionProperty: "width, opacity",
        }}
      />
    </div>
  );
}
