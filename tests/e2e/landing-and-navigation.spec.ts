import { test, expect } from "@playwright/test";

test.describe("Landing & Navigation E2E", () => {
  test("renders home portal with student and adult entry points", async ({ page }) => {
    await page.goto("/");

    // Verify title and main headings
    await expect(page).toHaveTitle(/LGS 2027/);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("LGS 2027");

    // Verify student and adult entry buttons exist and have 44px min height
    const studentBtn = page.getByRole("link", { name: /öğrenci girişi/i });
    const adultBtn = page.getByRole("link", { name: /aile girişi/i });

    await expect(studentBtn).toBeVisible();
    await expect(adultBtn).toBeVisible();

    const studentBox = await studentBtn.boundingBox();
    expect(studentBox?.height).toBeGreaterThanOrEqual(44);

    const adultBox = await adultBtn.boundingBox();
    expect(adultBox?.height).toBeGreaterThanOrEqual(44);
  });

  test("navigates directly to student today workflow without login or pairing", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /öğrenci girişi/i }).click();

    // Verify directly navigated to /today
    await page.waitForURL(/\/today/);
    await expect(page).toHaveURL(/\/today/);

    // Verify today's plan heading is visible
    await expect(page.getByRole("heading", { name: /Merhaba,/i })).toBeVisible();
  });

  test("navigates directly to family dashboard in view-only mode", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /aile girişi/i }).click();

    // Verify directly navigated to /dashboard
    await page.waitForURL(/\/dashboard/);
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify dashboard header and badge are visible
    await expect(page.getByRole("heading", { name: /Veli Paneli/i })).toBeVisible();
    await expect(page.locator("#main-content").getByText(/Bugünkü Tamamlama/i)).toBeVisible();
  });

  test("verifies PWA manifest linkage and theme color meta tags", async ({ page }) => {
    await page.goto("/");

    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute("href", /\/manifest\.(json|webmanifest)/);

    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute("content", "#2563eb");
  });
});
