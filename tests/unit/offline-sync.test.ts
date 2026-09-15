/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { queueOfflineMutation, getPendingMutations, removeMutation } from "@/lib/offline-sync";

describe("Offline-First Synchronization Queue", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("queues an offline mutation and retrieves it", async () => {
    const id = await queueOfflineMutation("COMPLETE_TASK", { taskId: "task-123" });
    expect(id).toBeDefined();

    const pending = await getPendingMutations();
    expect(pending.length).toBeGreaterThanOrEqual(1);

    const match = pending.find((m) => m.id === id);
    expect(match).toBeDefined();
    expect(match?.type).toBe("COMPLETE_TASK");
    expect(match?.payload.taskId).toBe("task-123");
  });

  it("removes a mutation cleanly after sync", async () => {
    const id = await queueOfflineMutation("FINISH_BENCHMARK", {
      sessionId: "session-456",
      durationSeconds: 1200,
      correct: 18,
      wrong: 2,
      blank: 0,
    });

    await removeMutation(id);
    const pending = await getPendingMutations();
    const match = pending.find((m) => m.id === id);
    expect(match).toBeUndefined();
  });
});
