import { expect, test } from "@playwright/test";

test.describe("discovery and reporting", () => {
  test.skip(!process.env.TEST_LOCAL_AUTH, "Requires seeded local Supabase");

  test("location denial leaves neighborhood discovery available", async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: (_success: unknown, failure: () => void) => failure() },
    }));
    await page.goto("/nearby");
    await page.getByRole("button", { name: "Use my location" }).click();
    await expect(page.getByRole("status")).toContainText("Choose a neighborhood");
    await page.getByLabel("Neighborhood", { exact: true }).selectOption("Test neighborhood");
    await page.getByRole("button", { name: "Find shops", exact: true }).click();
    await expect(page.getByRole("link", { name: "Fixture Shop A", exact: true })).toBeVisible();
    await expect(page.getByText("Fixture Shop B", { exact: true })).toHaveCount(0);
    await page.getByRole("link", { name: "Fixture Shop A", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Fixture Shop A", exact: true })).toBeVisible();
  });

  test("report pages never expose drafts", async ({ page }) => {
    const response = await page.goto("/report/30000000-0000-0000-0000-000000000001");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("Private draft A", { exact: true })).toHaveCount(0);
  });

  test("reporting a public offer uses bounded reason choices", async ({ page }) => {
    await page.goto("/report/30000000-0000-0000-0000-000000000003");
    await expect(page.getByRole("heading", { name: "Report an offer", exact: true })).toBeVisible();
    const reason = page.getByLabel("What is the issue?");
    if (await reason.count()) {
      await reason.selectOption("incorrect_price");
      await page.getByRole("button", { name: "Send report", exact: true }).click();
      await expect(page.getByRole("status")).toContainText("sent for review");
    } else await expect(page.getByText(/Reporting is temporarily unavailable/)).toBeVisible();
  });
});
