import { test, expect } from "@playwright/test";

test.describe("WCAG 2.2 AA & Responsive E2E Tests", () => {
  test("verifies focus visible indicators and keyboard navigability", async ({ page }) => {
    await page.goto("/");

    // Press Tab and verify focus indicator
    await page.keyboard.press("Tab");

    // The focused element should have visible focus
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();

    // Check computed outline style
    const outline = await focusedElement.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.outlineStyle || style.outline;
    });
    expect(outline).not.toBe("none");
  });

  test("verifies mobile touch targets on landing page", async ({ page }) => {
    await page.goto("/");

    // Check primary navigation links
    const studentLink = page.getByRole("link", { name: /öğrenci girişi/i });
    const adultLink = page.getByRole("link", { name: /aile girişi/i });

    const studentBox = await studentLink.boundingBox();
    expect(studentBox?.height).toBeGreaterThanOrEqual(44);

    const adultBox = await adultLink.boundingBox();
    expect(adultBox?.height).toBeGreaterThanOrEqual(44);
  });
});
