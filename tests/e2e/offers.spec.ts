import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

test.describe("owner-approved publishing", () => {
  test.skip(!process.env.TEST_LOCAL_AUTH, "Requires the seeded local Supabase stack");
  test("text draft requires approval, edits require reapproval, and withdrawal is immediate", async ({ page, browser }, testInfo) => {
    const title = `Lifecycle test ${randomUUID()}`;
    await page.goto("/owner/login");
    await page.getByLabel("Email", { exact: true }).fill("owner-a@example.test");
    await page.getByLabel("Password", { exact: true }).fill("ShopMitra-local-2026!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("link", { name: "Manage offers", exact: true }).click();
    await page.getByRole("link", { name: "Create text offer" }).click();
    await page.getByLabel("Offer title", { exact: true }).fill(title);
    await page.getByLabel("Price (INR)", { exact: true }).fill("99.99");
    await page.getByLabel("Quantity (optional)", { exact: true }).fill("1");
    await page.getByLabel("Unit (optional)", { exact: true }).fill("kg");
    await page.getByLabel("End date", { exact: true }).fill("2099-12-31");
    await page.getByRole("button", { name: "Save draft and review" }).click();
    await expect(page.getByRole("heading", { name: "Review offer" })).toBeVisible();
    const reviewUrl = page.url().split("?")[0];
    const customer = await browser.newPage({ viewport: { width: 393, height: 851 } });
    try {
      await customer.goto("/s/fixture-shop-a");
      await expect(customer.getByRole("heading", { name: title })).toHaveCount(0);
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "Publish reviewed offer" }).click();
      await expect(page.getByText("Offer published. Customers can see it during its validity dates.", { exact: true })).toBeVisible();
      await customer.reload();
      await expect(customer.getByRole("heading", { name: title })).toBeVisible();
      await expect(customer.getByRole("listitem").filter({ has: customer.getByRole("heading", { name: title, exact: true }) })).toContainText("₹99.99");
      await page.getByLabel("Price (INR)", { exact: true }).fill("120.50");
      await page.getByRole("button", { name: "Save draft and review" }).click();
      await expect(page.getByRole("button", { name: "Publish reviewed offer" })).toBeVisible();
      await customer.reload();
      await expect(customer.getByRole("heading", { name: title })).toHaveCount(0);
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "Publish reviewed offer" }).click();
      await expect(page.getByText("Offer published. Customers can see it during its validity dates.", { exact: true })).toBeVisible();
      await customer.reload();
      await expect(customer.getByRole("listitem").filter({ has: customer.getByRole("heading", { name: title, exact: true }) })).toContainText("₹120.50");
      await page.getByRole("button", { name: "Withdraw offer" }).click();
      await expect(page.getByText("Offer withdrawn from the customer page.", { exact: true })).toBeVisible();
      await customer.reload();
      await expect(customer.getByRole("heading", { name: title })).toHaveCount(0);
    } finally {
      // Failed assertions must not leave long-lived public test offers behind.
      // Cleanup errors are annotated without replacing the original failure.
      testInfo.setTimeout(testInfo.timeout + 15_000);
      try {
        await page.goto(reviewUrl, { timeout: 5000 });
        await expect(page.getByRole("heading", { name: "Review offer", exact: true })).toBeVisible({ timeout: 3000 });
        const withdraw = page.getByRole("button", { name: "Withdraw offer", exact: true });
        if (await withdraw.isVisible()) {
          await withdraw.click({ timeout: 5000 });
          await expect(page.getByText("Offer withdrawn from the customer page.", { exact: true })).toBeVisible({ timeout: 5000 });
        }
      } catch {
        testInfo.annotations.push({ type: "cleanup-warning", description: `Could not verify withdrawal of synthetic offer at ${reviewUrl}` });
      }
      try { await customer.close(); } catch {
        testInfo.annotations.push({ type: "cleanup-warning", description: "Could not close the isolated customer context." });
      }
    }
  });

  test("cross-shop edit URLs and viewer creation are denied", async ({ page }) => {
    await page.goto("/owner/login");
    await page.getByLabel("Email", { exact: true }).fill("owner-b@example.test");
    await page.getByLabel("Password", { exact: true }).fill("ShopMitra-local-2026!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Your shops" })).toBeVisible();
    expect((await page.goto("/owner/shops/20000000-0000-0000-0000-000000000001/offers/30000000-0000-0000-0000-000000000001"))?.status()).toBe(404);
    await page.goto("/owner");
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.getByLabel("Email", { exact: true }).fill("viewer@example.test");
    await page.getByLabel("Password", { exact: true }).fill("ShopMitra-local-2026!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Your shops" })).toBeVisible();
    expect((await page.goto("/owner/shops/20000000-0000-0000-0000-000000000001/offers/new"))?.status()).toBe(404);
  });
});
