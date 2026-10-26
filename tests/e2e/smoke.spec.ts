import { expect, test } from "@playwright/test";

test("customer can open the demo storefront on a mobile viewport", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Explore the demo shop" }).click();
  await expect(page).toHaveURL(/\/s\/demo-shop$/);
  await expect(page.getByRole("heading", { name: "Demo neighborhood shop" })).toBeVisible();
  await expect(page.getByText("No offers yet", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("unknown shops return 404 instead of displaying demo data", async ({ page }) => {
  const response = await page.goto("/s/unknown-shop");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page isn’t available" })).toBeVisible();
});

test("owner and admin previews expose no working controls", async ({ page }) => {
  for (const route of ["/owner", "/admin"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("input, textarea, button")).toHaveCount(0);
  }
});
