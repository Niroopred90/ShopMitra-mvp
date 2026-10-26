import { expect, test } from "@playwright/test";
import jsQR from "jsqr";
import { PNG } from "pngjs";

test.describe("database-backed storefront", () => {
  test.skip(!process.env.TEST_LOCAL_AUTH, "Requires the seeded local Supabase stack");

  test("customers see current public offers without signing in", async ({ page }) => {
    const response = await page.goto("/s/fixture-shop-a");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Fixture Shop A" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Visible offer" })).toBeVisible();
    await expect(page.getByText("₹89.00", { exact: true })).toBeVisible();
    await expect(page.getByText("Private draft A", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Expired offer", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Private source A", { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test("hidden shops and their QR downloads are unavailable", async ({ page, request }) => {
    await page.goto("/s/fixture-shop-b");
    await expect(page.getByRole("heading", { name: "This page isn’t available" })).toBeVisible();
    await expect(page.getByText("Private draft B", { exact: true })).toHaveCount(0);
    expect((await request.get("/s/fixture-shop-b/qr")).status()).toBe(404);
    expect((await request.get("/s/unknown-shop/qr")).status()).toBe(404);
    expect((await request.get("/s/demo-shop/qr")).status()).toBe(404);
  });

  test("downloaded QR decodes to the stable storefront and opens the correct shop", async ({ page, request }) => {
    await page.goto("/s/fixture-shop-a");
    await expect(page.getByRole("link", { name: "Download shop QR" })).toBeVisible();
    const response = await request.get("/s/fixture-shop-a/qr");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    expect(response.headers()["content-disposition"]).toContain("shopmitra-fixture-shop-a-qr.png");
    expect(response.headers()["cache-control"]).toBe("no-store");
    const png = PNG.sync.read(await response.body());
    const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    expect(code?.data).toBe("http://127.0.0.1:3000/s/fixture-shop-a");
    await page.goto(code!.data);
    await expect(page.getByRole("heading", { name: "Fixture Shop A" })).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toHaveCount(0);
  });

  test("share falls back to an explicit copyable shop link", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { value: undefined });
      Object.defineProperty(navigator, "clipboard", { value: undefined });
    });
    await page.goto("/s/fixture-shop-a?tracking=ignored");
    await page.getByRole("button", { name: "Share shop" }).click();
    await expect(page.getByRole("status")).toContainText("http://127.0.0.1:3000/s/fixture-shop-a");
    await expect(page.getByRole("status")).not.toContainText("tracking");
  });
});
