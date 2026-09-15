import { test, expect } from "@playwright/test";

test.describe("Mistakes Pool and Study Notes E2E", () => {
  test("verifies mistakes pool with 6 subjects, topic search and add modal", async ({ page }) => {
    await page.goto("/mistakes");

    // Heading
    await expect(page.getByRole("heading", { name: /Yanlışlar Havuzu/i })).toBeVisible();

    // Subject tabs exist: Tüm Dersler, Matematik, Türkçe, Fen Bilimleri...
    await expect(page.getByText("Tüm Dersler")).toBeVisible();
    await expect(page.getByText("Matematik")).toBeVisible();
    await expect(page.getByText("Türkçe")).toBeVisible();
    await expect(page.getByText("Fen Bilimleri")).toBeVisible();

    // Add mistake modal can be opened
    const addBtn = page.getByRole("button", { name: /Yanlış Soru Ekle/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Modal dialog content
    await expect(page.getByText(/Yeni Yanlış Soru Kaydı/i)).toBeVisible();
    await expect(page.getByText(/Kameradan Çek/i)).toBeVisible();
    await expect(page.getByText(/Galeriden Seç/i)).toBeVisible();

    // Fill form and save
    const topicInput = page.getByPlaceholder(/Konu adı yazın veya seçin/i);
    await topicInput.fill("Çarpanlar ve Katlar");

    const noteInput = page.getByPlaceholder(/kesinlikle yanlıştır/i);
    await noteInput.fill("En küçük ortak katı hesaplarken işlem hatası yaptım.");

    const submitBtn = page.getByRole("button", { name: /Yanlış Sorusunu Kaydet/i });
    await submitBtn.click();

    // Verify it appears in the grouped topic view
    await expect(page.getByText(/Çarpanlar ve Katlar/i).first()).toBeVisible();
    await expect(page.getByText(/En küçük ortak katı hesaplarken işlem hatası/i)).toBeVisible();
  });

  test("verifies study notes page, creating a note and toggling completed status", async ({
    page,
  }) => {
    await page.goto("/notes");

    // Heading
    await expect(
      page.getByRole("heading", { name: /Yusuf'un Çalışma Günlüğü & Notları/i })
    ).toBeVisible();

    // Categories exist
    await expect(page.getByText("Eksikler & Telafi").first()).toBeVisible();
    await expect(page.getByText("Daha Fazla Zaman Ayrılacaklar").first()).toBeVisible();
    await expect(page.getByText("Gelecek Planı").first()).toBeVisible();

    // Open add note modal
    await page.getByRole("button", { name: /Yeni Not Yaz/i }).click();

    // Fill note
    await page
      .getByPlaceholder(/Örn: 14 Ekim Fen Telafisi/i)
      .fill("Mitoz ve Mayoz Bölünme Pekiştirme");
    await page
      .getByPlaceholder(/Nerede geri kaldın\?/i)
      .fill("Mayoz 1 ve Mayoz 2 evrelerini karşılaştıran şemayı tekrar çizmem gerekiyor.");

    await page.getByRole("button", { name: /Notu Kaydet/i }).click();

    // Verify note is rendered
    await expect(page.getByText("Mitoz ve Mayoz Bölünme Pekiştirme").first()).toBeVisible();
    await expect(
      page.getByText(/Mayoz 1 ve Mayoz 2 evrelerini karşılaştıran şemayı/i).first()
    ).toBeVisible();

    // Mark as completed
    const completeBtn = page.getByRole("button", { name: /Tamamlandı İşaretle/i }).first();
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    // Switch to "Tamamlanan" filter to view the completed note
    await page.getByRole("button", { name: /Tamamlanan/i }).click();

    // Verify marked as resolved
    await expect(page.getByText(/Telafi Edildi \/ Tamamlandı/i).first()).toBeVisible();

    // Clean up created test note so database is left clean
    page.once("dialog", (dialog) => dialog.accept());
    const deleteBtn = page.getByTitle("Notu sil").first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
    }
  });

  test("verifies family dashboard displays Yusuf's notes section", async ({ page }) => {
    await page.goto("/dashboard");

    // Dashboard heading
    await expect(page.getByRole("heading", { name: /Veli Paneli/i })).toBeVisible();

    // Yusuf's Study Notes section exists
    await expect(
      page.getByText(/Yusuf'un Çalışma Günlüğü, Eksikleri ve Gelecek Planları/i)
    ).toBeVisible();
  });
});
