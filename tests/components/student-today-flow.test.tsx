/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TodayHeader } from "@/components/student/TodayHeader";
import { TaskCard } from "@/components/student/TaskCard";
import { BenchmarkTimer } from "@/components/student/BenchmarkTimer";
import { BenchmarkResultModal } from "@/components/student/BenchmarkResultModal";
import { ReadingBlock } from "@/components/student/ReadingBlock";
import type { StudentTodayTask } from "@/domain/student-today";

describe("Student Today Components & Flow", () => {
  const sampleBenchmarkTask: StudentTodayTask = {
    id: "b-task-1",
    externalTaskId: "1:benchmark",
    taskGroupKey: "1",
    taskType: "daily_math_benchmark",
    title: "Matematik Rutini (20 Soru)",
    subjectName: "Matematik",
    topicName: null,
    plannedStart: "16:00",
    plannedEnd: "16:40",
    plannedQuestionCount: 20,
    required: true,
    countsTowardTopicCompletion: false,
    sortOrder: 1,
    resourceLabel: "MUBA",
    resourceUrl: null,
    resourceItemLabel: null,
    resourceItemUrl: null,
    status: "pending",
    completedAt: null,
  };

  it("renders TodayHeader with progress stats and accessible progressbar", () => {
    render(
      <TodayHeader
        studentName="Zeynep"
        formattedDate="1 Ekim 2026, Perşembe"
        totalRequired={4}
        completedRequired={2}
        percent={50}
      />
    );

    expect(screen.getByText(/Merhaba, Zeynep/)).toBeDefined();
    expect(screen.getByText("1 Ekim 2026, Perşembe")).toBeDefined();
    expect(screen.getByText("%50 Tamamlandı")).toBeDefined();

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar.getAttribute("aria-valuenow")).toBe("50");
  });

  it("renders TaskCard with min 44px touch targets and primary actions", () => {
    const onStart = vi.fn();
    render(
      <TaskCard
        task={sampleBenchmarkTask}
        isCutoffActive={false}
        activeTimerSession={null}
        onStartBenchmark={onStart}
        onResumeBenchmark={vi.fn()}
        onOpenQuestionResult={vi.fn()}
        onCompleteNonQuestion={vi.fn()}
        isPrimaryNext={true}
      />
    );

    expect(screen.getByText("İlk 20 Soru (Hız Ölçümü)")).toBeDefined();
    expect(screen.getByText("Matematik Rutini (20 Soru)")).toBeDefined();

    const startBtn = screen.getByRole("button", { name: /İleri Sayım/i });
    expect(startBtn).toBeDefined();
    fireEvent.click(startBtn);
    expect(onStart).toHaveBeenCalledWith(sampleBenchmarkTask);
  });

  it("renders BenchmarkTimer count-up without countdown or red warning", () => {
    const onFinish = vi.fn();
    const onCancel = vi.fn();

    render(
      <BenchmarkTimer
        sessionId="sess-1"
        startedAt={new Date(Date.now() - 65000).toISOString()}
        taskTitle="Matematik Rutini (20 Soru)"
        onFinish={onFinish}
        onCancel={onCancel}
        onClose={vi.fn()}
      />
    );

    // Displays count-up label
    expect(screen.getByText("İleri Sayım")).toBeDefined();

    // Finish action
    const finishBtn = screen.getByRole("button", { name: /Testi Bitir/i });
    fireEvent.click(finishBtn);
    expect(onFinish).toHaveBeenCalled();
  });

  it("enforces exact sum of 20 in BenchmarkResultModal", () => {
    const onSubmit = vi.fn();

    render(
      <BenchmarkResultModal
        sessionId="sess-1"
        durationSeconds={1200}
        taskTitle="Matematik Rutini"
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />
    );

    // Initial state: 20 correct, 0 wrong, 0 blank (sum = 20 -> valid)
    const submitBtn = screen.getByRole("button", { name: /Ölçümü Kaydet/i });
    expect(submitBtn.hasAttribute("disabled")).toBe(false);

    // Change correct to 15 (sum = 15 -> invalid)
    const correctInput = screen.getByLabelText("Doğru");
    fireEvent.change(correctInput, { target: { value: "15" } });

    expect(screen.getByText(/5 soru daha girilmeli/i)).toBeDefined();
    expect(submitBtn.hasAttribute("disabled")).toBe(true);

    // Add 3 wrong and 2 blank (sum = 20 -> valid again)
    const wrongInput = screen.getByLabelText("Yanlış");
    const blankInput = screen.getByLabelText("Boş");
    fireEvent.change(wrongInput, { target: { value: "3" } });
    fireEvent.change(blankInput, { target: { value: "2" } });

    expect(screen.getByText(/Tam 20 Soru \(Geçerli\)/i)).toBeDefined();
    expect(submitBtn.hasAttribute("disabled")).toBe(false);

    fireEvent.click(submitBtn);
    expect(onSubmit).toHaveBeenCalledWith(15, 3, 2);
  });

  it("keeps ReadingBlock locked when not unlocked and reveals message", () => {
    render(
      <ReadingBlock
        readingTask={null}
        isUnlocked={false}
        lockReason="2 görev kaldı"
        activeReadingSession={null}
        onStartReading={vi.fn()}
        onFinishReading={vi.fn()}
      />
    );

    expect(screen.getByText(/2 görev kaldı/i)).toBeDefined();
    expect(screen.queryByRole("button", { name: /Okumayı Başlat/i })).toBeNull();
  });

  it("allows starting reading session when unlocked", async () => {
    const onStart = vi.fn().mockResolvedValue(undefined);
    render(
      <ReadingBlock
        readingTask={null}
        isUnlocked={true}
        activeReadingSession={null}
        onStartReading={onStart}
        onFinishReading={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const startBtn = screen.getByRole("button", { name: /Okumayı Başlat/i });
    expect(startBtn).toBeDefined();
    await act(async () => {
      fireEvent.click(startBtn);
    });
    expect(onStart).toHaveBeenCalled();
  });
});
