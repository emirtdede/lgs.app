"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            if (process.env.NODE_ENV === "development") {
              console.log("[PWA] ServiceWorker registered with scope:", reg.scope);
            }
          })
          .catch((err) => {
            console.error("[PWA] ServiceWorker registration failed:", err);
          });
      });
    }
  }, []);

  return null;
}
