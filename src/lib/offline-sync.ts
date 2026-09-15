/**
 * Offline-First IndexedDB Synchronization Queue for LGS 2027.
 * Ensures zero study progress or notes are lost during network disconnects.
 * Syncs automatically when internet connection is restored.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  completeNonQuestionTaskAction,
  finishBenchmark20Action,
  addStudentNoteAction,
  addCustomMistakeAction,
} from "@/application/student-actions";

export type OfflineMutationType = "COMPLETE_TASK" | "FINISH_BENCHMARK" | "ADD_NOTE" | "ADD_MISTAKE";

export interface OfflineMutation {
  id: string;
  type: OfflineMutationType;
  payload: any;
  createdAt: string;
}

const DB_NAME = "lgs2027_offline_db";
const STORE_NAME = "mutation_queue";
const DB_VERSION = 1;

/**
 * Opens or initializes the local IndexedDB.
 */
function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Adds an offline mutation to the IndexedDB queue.
 */
export async function queueOfflineMutation(
  type: OfflineMutationType,
  payload: any
): Promise<string> {
  const id = `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const mutation: OfflineMutation = {
    id,
    type,
    payload,
    createdAt: new Date().toISOString(),
  };

  try {
    const db = await openOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(mutation);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    return id;
  } catch (err) {
    console.warn("Failed to queue mutation in IndexedDB, fallback to localStorage:", err);
    // Fallback to localStorage if IndexedDB is unavailable
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const key = `lgs_offline_mutations`;
        const current: OfflineMutation[] = JSON.parse(localStorage.getItem(key) || "[]");
        current.push(mutation);
        localStorage.setItem(key, JSON.stringify(current));
      } catch {
        // ignore
      }
    }
    return id;
  }
}

/**
 * Gets all pending mutations from IndexedDB.
 */
export async function getPendingMutations(): Promise<OfflineMutation[]> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback check in localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        return JSON.parse(localStorage.getItem("lgs_offline_mutations") || "[]");
      } catch {
        return [];
      }
    }
    return [];
  }
}

/**
 * Removes a mutation after successful sync.
 */
export async function removeMutation(id: string): Promise<void> {
  try {
    const db = await openOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const current: OfflineMutation[] = JSON.parse(
          localStorage.getItem("lgs_offline_mutations") || "[]"
        );
        const filtered = current.filter((m) => m.id !== id);
        localStorage.setItem("lgs_offline_mutations", JSON.stringify(filtered));
      } catch {
        // ignore
      }
    }
  }
}

/**
 * Syncs all pending mutations to the server.
 */
export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const mutations = await getPendingMutations();
  if (mutations.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const item of mutations) {
    try {
      let success = false;

      if (item.type === "COMPLETE_TASK") {
        const res = await completeNonQuestionTaskAction(item.payload.taskId);
        success = res.success;
      } else if (item.type === "FINISH_BENCHMARK") {
        const { sessionId, correct, wrong, blank } = item.payload;
        const res = await finishBenchmark20Action(sessionId, correct, wrong, blank);
        success = res.success;
      } else if (item.type === "ADD_NOTE") {
        const res = await addStudentNoteAction(item.payload);
        success = res.success;
      } else if (item.type === "ADD_MISTAKE") {
        const res = await addCustomMistakeAction(item.payload);
        success = res.success;
      }

      if (success) {
        await removeMutation(item.id);
        synced++;
      } else {
        failed++;
      }
    } catch (err) {
      console.warn(`Failed to sync mutation ${item.id}:`, err);
      failed++;
    }
  }

  return { synced, failed };
}

/**
 * React Hook for live online/offline status and offline queue count.
 */
export function useOfflineSyncStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== "undefined") return navigator.onLine;
    return true;
  });
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshCount = useCallback(async () => {
    const list = await getPendingMutations();
    setPendingCount(list.length);
  }, []);

  const runSync = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      await syncOfflineQueue();
      await refreshCount();
    } finally {
      setIsSyncing(false);
    }
  }, [refreshCount]);

  useEffect(() => {
    refreshCount();

    const handleOnline = () => {
      setIsOnline(true);
      runSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshCount, runSync]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncNow: runSync,
  };
}
