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

test("unauthenticated owner/admin routes reveal no private data", async ({ page }) => {
  await page.goto("/owner");
  if (process.env.TEST_LOCAL_AUTH) await expect(page).toHaveURL(/\/owner\/login$/);
  await expect(page.getByText("Fixture Shop A", { exact: true })).toHaveCount(0);
  const response = await page.goto("/admin");
  if (new URL(page.url()).pathname === "/owner/login") {
    await expect(page.getByRole("heading", { name: "Owner sign-in" })).toBeVisible();
  } else expect(response?.status()).toBe(404);
});

test.describe("local seeded authentication", () => {
  test.skip(!process.env.TEST_LOCAL_AUTH, "Requires seeded local Supabase and .env.local");

  test("owner signs in, sees only own shop, cannot open admin, and signs out", async ({ page }) => {
    await page.goto("/owner/login");
    await page.getByLabel("Email", { exact: true }).fill("owner-a@example.test");
    await page.getByLabel("Password", { exact: true }).fill("ShopMitra-local-2026!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Your shops" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Fixture Shop A" })).toBeVisible();
    await expect(page.getByText("Fixture Shop B", { exact: true })).toHaveCount(0);
    const response = await page.goto("/admin");
    expect(response?.status()).toBe(404);
    await page.goto("/owner");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/owner\/login$/);
    await page.goto("/owner");
    await expect(page).toHaveURL(/\/owner\/login$/);
  });

  test("invalid credentials produce a generic error", async ({ page }) => {
    await page.goto("/owner/login");
    await page.getByLabel("Email", { exact: true }).fill("owner-a@example.test");
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Unable to sign in" })).toBeVisible();
  });

  test("signed-in account without verified membership sees no shops", async ({ page }) => {
    await page.goto("/owner/login");
    await page.getByLabel("Email", { exact: true }).fill("unassigned@example.test");
    await page.getByLabel("Password", { exact: true }).fill("ShopMitra-local-2026!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText(/No verified shops are linked/)).toBeVisible();
  });

  test("provisioned admin can access administration", async ({ page }) => {
    await page.goto("/owner/login");
    await page.getByLabel("Email", { exact: true }).fill("admin@example.test");
    await page.getByLabel("Password", { exact: true }).fill("ShopMitra-local-2026!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/owner$/);
    await page.goto("/admin");
    await expect(page.getByText(/Administrator access verified/)).toBeVisible();
  });
});
