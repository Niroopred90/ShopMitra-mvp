import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { parseOwnerSignup } from "../../lib/owner-signup";
import { parseOwnerShopRequest } from "../../lib/owner-onboarding";

// Never record confirmation links, generated passwords, or session cookies in traces.
test.use({ trace: "off", screenshot: "off", video: "off", actionTimeout: 10_000 });

test("signup validation and shop consent are enforced before provider requests", () => {
  const form = new FormData();
  form.set("email", "invalid");
  expect(parseOwnerSignup(form).error).toContain("email");
  form.set("email", "fictional@example.test");
  form.set("password", "too-short");
  expect(parseOwnerSignup(form).error).toContain("12");
  form.set("password", "Synthetic-password-2026!");
  expect(parseOwnerSignup(form).error).toContain("match");
  form.set("confirmPassword", "Synthetic-password-2026!");
  expect(parseOwnerSignup(form)).not.toHaveProperty("error");
  const request = new FormData();
  for (const [key, value] of Object.entries({ requestId: randomUUID(), name: "Fictional", category: "Grocery", neighborhood: "Test" })) request.set(key, value);
  expect(parseOwnerShopRequest(request).error).toContain("authority");
  request.set("consent", "on");
  expect(parseOwnerShopRequest(request)).not.toHaveProperty("error");
});

test("confirmation callback ignores external redirect destinations", async ({ page }) => {
  await page.goto("/owner/auth/callback?next=https://example.com/steal");
  await expect(page).toHaveURL(/\/owner\/login\?error=confirmation$/);
  await expect(page.getByRole("alert").filter({ hasText: "confirmation link" })).toBeVisible();
});

test.describe("local owner registration and approval", () => {
  test.skip(!process.env.TEST_LOCAL_AUTH, "Requires local signup, email confirmation, and seeded admin");

  test("email confirmation precedes private request and verified admin approval", async ({ page, browser, request }, testInfo) => {
    test.setTimeout(90_000);
    const env = readFileSync(".env.local", "utf8");
    const url = env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)$/m)?.[1]?.trim();
    const key = env.match(/^SUPABASE_SECRET_KEY=(.*)$/m)?.[1]?.trim();
    expect(url).toBe("http://127.0.0.1:54321");
    expect(key).toBeTruthy();
    const local = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10_000) }) } });
    const suffix = randomUUID();
    const email = `signup-${suffix}@example.test`;
    const password = `Synthetic-${randomUUID()}!`;
    const name = `Fictional request ${suffix}`;
    const slug = `onboarding-${suffix}`;
    let userId: string | undefined;
    let shopId: string | undefined;
    const adminPage = await browser.newPage();
    try {
      await page.goto("/owner/login");
      await page.getByRole("link", { name: "Create an owner account", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Create owner account", exact: true })).toBeVisible();
      await page.getByLabel("Email", { exact: true }).fill(email);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page.getByLabel("Confirm password", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Create owner account", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Check your email", exact: true })).toBeVisible();
      const users = await local.auth.admin.listUsers({ page: 1, perPage: 1000 });
      userId = users.data.users.find(user => user.email === email)?.id;
      expect(userId).toBeTruthy();
      const unconfirmed = createClient(url!, env.match(/^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)$/m)![1].trim(), { auth: { persistSession: false } });
      expect((await unconfirmed.auth.signInWithPassword({ email, password })).error?.code).toBe("email_not_confirmed");
      let messageId: string | undefined;
      await expect.poll(async () => {
        const messages = await (await request.get("http://127.0.0.1:54324/api/v1/messages")).json();
        messageId = messages.messages?.find((message: { ID: string; To: { Address: string }[] }) => message.To.some(to => to.Address === email))?.ID;
        return Boolean(messageId);
      }).toBe(true);
      const message = await (await request.get(`http://127.0.0.1:54324/api/v1/message/${messageId}`)).json();
      const link = String(message.HTML ?? message.Text).match(/https?:\/\/[^\s"<>]+\/auth\/v1\/verify\?[^\s"<>]+/)?.[0]?.replaceAll("&amp;", "&");
      expect(Boolean(link), "Local confirmation email contains a verification link").toBe(true);
      // Confirmation tokens may only be sent to the explicitly local Auth endpoint.
      expect(new URL(link!).origin).toBe("http://127.0.0.1:54321");
      await page.goto(link!);
      await expect(page).toHaveURL(/\/owner\/onboarding$/);
      await page.getByLabel("Shop name", { exact: true }).fill(name);
      await page.getByLabel("Category", { exact: true }).fill("Grocery");
      await page.getByLabel("Neighborhood", { exact: true }).fill("Test neighborhood");
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "Submit shop for approval", exact: true }).click();
      await expect(page.getByRole("status")).toContainText("Awaiting ownership approval");
      expect((await local.from("shop_memberships").select("shop_id").eq("user_id", userId!)).data).toHaveLength(0);
      await adminPage.goto("/owner/login");
      await adminPage.getByLabel("Email", { exact: true }).fill("admin@example.test");
      await adminPage.getByLabel("Password", { exact: true }).fill("ShopMitra-local-2026!");
      await adminPage.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(adminPage).toHaveURL(/\/owner$/);
      await adminPage.goto("/admin");
      await adminPage.getByRole("listitem").filter({ has: adminPage.getByRole("heading", { name, exact: true }) }).getByRole("link", { name: "Review ownership request" }).click({ timeout: 10_000 });
      await expect(adminPage.getByRole("heading", { name: "Review shop request", exact: true })).toBeVisible();
      await adminPage.getByLabel("Permanent slug", { exact: true }).fill(slug);
      await adminPage.getByLabel("Verification method", { exact: true }).selectOption("in_person");
      await adminPage.getByRole("checkbox").check();
      await adminPage.getByRole("button", { name: "Approve verified shop", exact: true }).click({ timeout: 10_000 });
      await expect(adminPage.getByRole("status")).toContainText("Shop saved");
      shopId = (await local.from("shops").select("id").eq("slug", slug).single()).data?.id;
      expect(shopId).toBeTruthy();
      await page.goto("/owner");
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
      await page.getByRole("link", { name: "Manage offers", exact: true }).click();
      await expect(page.getByRole("link", { name: "Create text offer", exact: true })).toBeVisible();
      expect((await page.goto("/admin"))?.status()).toBe(404);
    } finally {
      // Delete only this test's local identity and fictional shop; never run on hosted data.
      testInfo.setTimeout(testInfo.timeout + 30_000);
      await adminPage.close().catch(() => {});
      if (!userId) userId = (await local.auth.admin.listUsers({ page: 1, perPage: 1000 })).data.users.find(user => user.email === email)?.id;
      if (userId) {
        const row = await local.from("owner_shop_requests").select("shop_id").eq("user_id", userId).maybeSingle();
        shopId ??= row.data?.shop_id ?? undefined;
        expect((await local.from("owner_shop_requests").delete().eq("user_id", userId)).error).toBeNull();
      }
      if (shopId) {
        expect((await local.from("audit_events").delete().eq("shop_id", shopId)).error).toBeNull();
        expect((await local.from("shops").delete().eq("id", shopId).eq("slug", slug)).error).toBeNull();
      }
      if (userId) expect((await local.auth.admin.deleteUser(userId)).error).toBeNull();
    }
  });
});
