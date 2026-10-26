import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { parseShopSetup } from "../../lib/shop-setup";

test("shop setup validation refuses membership without verification", () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ shopId: randomUUID(), requestId: randomUUID(), version: "0", slug: "synthetic-shop", name: "Synthetic", category: "Kirana", neighborhood: "Synthetic locality", visibility: "hidden", ownerLookup: "owner-a@example.test" })) form.set(key, value);
  expect(parseShopSetup(form).error).toContain("independent ownership verification");
  form.set("verified", "on");
  form.set("verificationMethod", "in_person");
  expect(parseShopSetup(form)).not.toHaveProperty("error");
  form.set("latitude", "17.385");
  expect(parseShopSetup(form).error).toContain("both valid latitude and longitude");
});

test.describe("local administrator shop setup", () => {
  test.skip(!process.env.TEST_LOCAL_AUTH, "Requires seeded local Supabase");

  test("ordinary owners cannot open shop setup", async ({ page }) => {
    await page.goto("/owner/login");
    await page.getByLabel("Email", { exact: true }).fill("owner-a@example.test");
    await page.getByLabel("Password", { exact: true }).fill("ShopMitra-local-2026!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/owner$/);
    const response = await page.goto("/admin/shops/new");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("button", { name: "Create verified shop" })).toHaveCount(0);
  });

  test("admin creates a synthetic hidden shop and edits its name without changing its slug", async ({ page }) => {
    const suffix = randomUUID().slice(0, 8);
    const name = `Synthetic setup ${suffix}`;
    const slug = `synthetic-setup-${suffix}`;
    await page.goto("/owner/login");
    await page.getByLabel("Email", { exact: true }).fill("admin@example.test");
    await page.getByLabel("Password", { exact: true }).fill("ShopMitra-local-2026!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/owner$/);
    await page.goto("/admin/shops/new");
    const shopId = await page.locator('input[name="shopId"]').inputValue();
    // Cleanup is restricted to this synthetic shop in the explicitly local database.
    const env = readFileSync(".env.local", "utf8");
    const url = env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)$/m)?.[1]?.trim();
    const key = env.match(/^SUPABASE_SECRET_KEY=(.*)$/m)?.[1]?.trim();
    expect(url).toBe("http://127.0.0.1:54321");
    expect(key).toBeTruthy();
    const local = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
    try {
      await page.getByLabel("Shop name", { exact: true }).fill(name);
      await page.getByLabel("Permanent slug", { exact: true }).fill(slug);
      await page.getByLabel("Category", { exact: true }).fill("Kirana");
      await page.getByLabel("Neighborhood", { exact: true }).fill("Synthetic setup locality");
      await page.getByLabel("Existing owner account email or UUID", { exact: true }).fill("admin@example.test");
      await page.getByLabel("Verification method", { exact: true }).selectOption("in_person");
      // Simulated verification for fictional local data only; no real owner is contacted.
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "Create verified shop", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Edit shop details", exact: true })).toBeVisible();
      await expect(page.getByRole("status")).toContainText("Shop saved");
      await expect(page.locator('input[name="version"]')).toHaveValue("1");
      await expect(page.getByLabel("Permanent slug", { exact: true })).toHaveValue(slug);
      await expect(page.getByLabel("Permanent slug", { exact: true })).toHaveAttribute("readonly", "");
      await page.getByLabel("Shop name", { exact: true }).fill(`${name} renamed`);
      await page.getByRole("button", { name: "Save shop details", exact: true }).click();
      await expect(page.locator('input[name="version"]')).toHaveValue("2");
      await expect(page.getByRole("status")).toContainText("Shop saved");
      await expect(page.getByLabel("Shop name", { exact: true })).toHaveValue(`${name} renamed`);
      await expect(page.getByLabel("Permanent slug", { exact: true })).toHaveValue(slug);
    } finally {
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      const audit = await local.from("audit_events").delete().eq("shop_id", shopId);
      expect(audit.error, "Synthetic setup audit cleanup failed").toBeNull();
      const cleanup = await local.from("shops").delete().eq("id", shopId).eq("slug", slug);
      expect(cleanup.error, "Synthetic setup shop cleanup failed").toBeNull();
    }
  });
});
