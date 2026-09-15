import { test, expect } from "@playwright/test";

test.describe("Student Workflows E2E", () => {
  test("direct access to today workflow renders pre-start state and navigates to Oct 1 tasks", async ({
    page,
  }) => {
    await page.goto("/today");

    // Greeting and pre-start notice
    await expect(page.getByRole("heading", { name: /Merhaba,/i })).toBeVisible();
    await expect(page.getByText(/Plan 1 Ekim 2026 tarihinde başlıyor/i)).toBeVisible();

    // Verify shame-free language across the page
    const pageText = await page.locator("body").innerText();
    expect(pageText).not.toContain("geciktin");
    expect(pageText).not.toContain("başarısız");
    expect(pageText).not.toContain("seri bozuldu");

    // Click to view 1 October 2026 tasks
    await page.getByRole("link", { name: /1 Ekim 2026 Görevlerini İncele/i }).click();
    await page.waitForURL(/date=2026-10-01/);

    // Verify real Oct 1 plan tasks are visible
    await expect(page.getByText(/En az 20 paragraf sorusu/i).first()).toBeVisible();
    await expect(page.getByText(/Temel Kavramlar/i).first()).toBeVisible();
  });

  test("pair route cleanly redirects to today page in direct access mode", async ({ page }) => {
    await page.goto("/pair");

    // Server-side redirect to /today
    await page.waitForURL(/\/today/);
    await expect(page).toHaveURL(/\/today/);
    await expect(page.getByRole("heading", { name: /Merhaba,/i })).toBeVisible();
  });

  test("interacts with benchmark timer and verifies exact 20 questions modal validation", async ({
    page,
  }) => {
    // Navigate to Day 1 (2026-10-01) where 20-question timed tasks exist (bypassCutoff for nighttime test execution)
    await page.goto("/today?date=2026-10-01&bypassCutoff=true");

    // Click on Benchmark / Timed task "Başlat" button
    const startBtn = page.getByRole("button", { name: /başlat/i }).first();
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Timer modal should now be active
    const timerDialog = page.getByRole("dialog");
    await expect(timerDialog).toBeVisible();

    // Finish benchmark
    const finishBtn = page.getByRole("button", { name: /testi bitir/i });
    await expect(finishBtn).toBeVisible();
    await finishBtn.click();

    // Result modal should open with exact 20 question requirement
    await expect(page.getByText(/Sonuç Girişi/i)).toBeVisible();

    // Fill incorrect question counts (10 + 5 + 0 = 15 != 20)
    const correctInput = page.locator("#input-correct");
    const wrongInput = page.locator("#input-wrong");
    const blankInput = page.locator("#input-blank");

    await correctInput.fill("10");
    await wrongInput.fill("5");
    await blankInput.fill("0");

    // Warning text about remaining questions
    await expect(page.getByText(/soru daha girilmeli/i)).toBeVisible();

    // Save button must be disabled
    const saveBtn = page.getByRole("button", { name: /ölçümü kaydet/i });
    await expect(saveBtn).toBeDisabled();

    // Fix the count so it totals exact 20 (10 + 5 + 5 = 20)
    await blankInput.fill("5");
    await expect(page.getByText(/Tam 20 Soru/i)).toBeVisible();
    await expect(saveBtn).toBeEnabled();
  });
});
