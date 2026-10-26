import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

const shopId = "20000000-0000-0000-0000-000000000001";
const offersPath = `/owner/shops/${shopId}/offers`;

async function signIn(page: Page) {
  await page.goto("/owner/login");
  await page.getByLabel("Email", { exact: true }).fill("owner-a@example.test");
  await page.getByLabel("Password", { exact: true }).fill("ShopMitra-local-2026!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your shops", exact: true })).toBeVisible();
}

async function fillDraft(page: Page, title: string) {
  await page.goto(`${offersPath}/new`);
  await page.getByLabel("Offer title", { exact: true }).fill(title);
  await page.getByLabel("Price (INR)", { exact: true }).fill("42.10");
  await page.getByLabel("End date", { exact: true }).fill("2099-12-31");
}

test.describe("simulated owner network and session interruptions", () => {
  test.skip(!process.env.TEST_LOCAL_AUTH, "Requires the seeded local Supabase stack");

  test("a delayed save stays pending and a retransmitted committed request creates one draft", async ({ page }) => {
    const title = `Retry draft ${randomUUID()}`;
    await signIn(page);
    await fillDraft(page, title);
    const offerId = await page.locator('input[name="offer_id"]').inputValue();
    let releaseResponse: () => void = () => {};
    let notifyCommitted: () => void = () => {};
    const responseGate = new Promise<void>(resolve => { releaseResponse = resolve; });
    const committed = new Promise<void>(resolve => { notifyCommitted = resolve; });
    const upstreamStatuses: number[] = [];

    await page.route(`**${offersPath}/new`, async route => {
      if (route.request().method() !== "POST" || !route.request().headers()["next-action"]) {
        await route.continue();
        return;
      }
      // Hold the browser response after the server commits, then retransmit the
      // identical action body/token as a network retry. No timed sleeps needed.
      const first = await route.fetch({ maxRedirects: 0 });
      upstreamStatuses.push(first.status());
      notifyCommitted();
      await responseGate;
      const retried = await route.fetch({ maxRedirects: 0 });
      upstreamStatuses.push(retried.status());
      await route.fulfill({ response: retried });
    });

    try {
      await page.getByRole("button", { name: "Save draft and review", exact: true }).click();
      await committed;
      await expect(page.getByRole("button", { name: "Saving…", exact: true })).toBeDisabled();
      await expect(page.getByLabel("Offer title", { exact: true })).toHaveValue(title);
      await expect(page.getByLabel("Price (INR)", { exact: true })).toHaveValue("42.10");
      releaseResponse();
      await expect(page).toHaveURL(`${page.url().split("/owner/")[0]}${offersPath}/${offerId}`);
      await expect(page.getByRole("heading", { name: "Review offer", exact: true })).toBeVisible();
      expect(upstreamStatuses).toHaveLength(2);
      expect(upstreamStatuses.every(status => status >= 200 && status < 400)).toBe(true);
      // Version 1 proves the repeated save did not perform a second mutation.
      const versions = await page.locator('input[name="version"]').evaluateAll(nodes => nodes.map(node => (node as HTMLInputElement).value));
      expect(versions.length).toBeGreaterThan(0);
      expect(versions.every(version => version === "1")).toBe(true);
      await page.goto(offersPath);
      await expect(page.getByRole("link", { name: title, exact: true })).toHaveCount(1);
      await page.goto("/s/fixture-shop-a");
      await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(0);
    } finally {
      releaseResponse();
      await page.unroute(`**${offersPath}/new`);
    }
  });

  test("an interrupted session redirects to login without saving and manual entry resumes after sign-in", async ({ page, context }) => {
    const interruptedTitle = `Interrupted draft ${randomUUID()}`;
    const resumedTitle = `Resumed draft ${randomUUID()}`;
    await signIn(page);
    await fillDraft(page, interruptedTitle);
    // Clearing the session cookies models expiration while an owner is editing.
    await context.clearCookies();
    await page.getByRole("button", { name: "Save draft and review", exact: true }).click();
    await expect(page).toHaveURL(/\/owner\/login$/);
    await expect(page.getByRole("heading", { name: "Owner sign-in", exact: true })).toBeVisible();
    await expect(page.getByText(interruptedTitle, { exact: true })).toHaveCount(0);
    await expect(page.getByText("Fixture Shop A", { exact: true })).toHaveCount(0);

    await signIn(page);
    await page.goto(offersPath);
    await expect(page.getByRole("link", { name: interruptedTitle, exact: true })).toHaveCount(0);
    await fillDraft(page, resumedTitle);
    await page.getByRole("button", { name: "Save draft and review", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Review offer", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: resumedTitle, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish reviewed offer", exact: true })).toBeVisible();
    await page.goto("/s/fixture-shop-a");
    await expect(page.getByRole("heading", { name: resumedTitle, exact: true })).toHaveCount(0);
  });
});
