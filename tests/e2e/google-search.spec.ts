import { expect, test } from "@playwright/test";
import { googleMapsSearchUrl } from "../../lib/google-maps-search";

test("Google search URLs validate input and always use the official Maps origin", () => {
  const url = new URL(googleMapsSearchUrl("grocery", { mode: "pin", pin: " 500081 " }));
  expect(url.origin).toBe("https://www.google.com");
  expect(url.pathname).toBe("/maps/search/");
  expect(url.searchParams.get("api")).toBe("1");
  expect(url.searchParams.get("query")).toBe("Grocery stores near 500081, India");
  for (const pin of ["", "50008", "000000", "5000817", "abcdef", "<script>"]) {
    expect(() => googleMapsSearchUrl("businesses", { mode: "pin", pin })).toThrow("PIN code");
  }
  expect(() => googleMapsSearchUrl("__proto__", { mode: "pin", pin: "500081" })).toThrow("category");
  for (const coordinates of [{ latitude: NaN, longitude: 1 }, { latitude: 91, longitude: 1 }, { latitude: 1, longitude: 181 }]) {
    expect(() => googleMapsSearchUrl("businesses", { mode: "location", ...coordinates })).toThrow("location");
  }
  expect(new URL(googleMapsSearchUrl("salon", { mode: "location", latitude: 0, longitude: 0 })).searchParams.get("query")).toContain("0.0000,0.0000");
});

test("PIN search opens an external Maps tab without contacting Google during tests", async ({ page, context }) => {
  await context.route("https://www.google.com/**", route => route.fulfill({ contentType: "text/html", body: "Mock Maps destination" }));
  await page.goto("/nearby");
  const panel = page.getByRole("region", { name: "Find businesses on Google Maps" });
  await panel.getByRole("button", { name: "Open Google Maps" }).click();
  await expect(panel.getByRole("alert")).toContainText("six-digit Indian PIN");
  await panel.getByLabel("Indian PIN code", { exact: true }).fill("500081");
  await panel.getByLabel("What are you looking for?", { exact: true }).selectOption("bakery");
  const popupEvent = page.waitForEvent("popup");
  await panel.getByRole("button", { name: "Open Google Maps" }).click();
  const popup = await popupEvent;
  await popup.waitForURL("https://www.google.com/maps/search/**");
  expect(new URL(popup.url()).searchParams.get("query")).toBe("Bakeries near 500081, India");
  await expect(panel.getByRole("link", { name: "open results here" })).toHaveAttribute("rel", "noopener noreferrer");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await popup.close();
});

test("Google location permission is requested only on click and denial leaves PIN fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as unknown as { locationRequests: number };
    state.locationRequests = 0;
    Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition: (_success: unknown, failure: () => void) => { state.locationRequests++; failure(); } } });
  });
  await page.goto("/nearby");
  const panel = page.getByRole("region", { name: "Find businesses on Google Maps" });
  await panel.getByRole("radio", { name: "Current location", exact: true }).check();
  expect(await page.evaluate(() => (window as unknown as { locationRequests: number }).locationRequests)).toBe(0);
  await panel.getByRole("button", { name: "Use current location", exact: true }).click();
  await expect(panel.getByRole("alert")).toContainText("unavailable or denied");
  expect(await page.evaluate(() => (window as unknown as { locationRequests: number }).locationRequests)).toBe(1);
  await panel.getByRole("radio", { name: "PIN code", exact: true }).check();
  await expect(panel.getByLabel("Indian PIN code", { exact: true })).toBeVisible();
});

test("current coordinates build a location-based business search after permission", async ({ page, context }) => {
  await context.route("https://www.google.com/**", route => route.fulfill({ body: "Mock Maps destination" }));
  await page.addInitScript(() => Object.defineProperty(navigator, "geolocation", {
    value: { getCurrentPosition: (success: (position: { coords: { latitude: number; longitude: number } }) => void) => success({ coords: { latitude: 17.385, longitude: 78.4867 } }) },
  }));
  await page.goto("/nearby");
  const panel = page.getByRole("region", { name: "Find businesses on Google Maps" });
  await panel.getByRole("radio", { name: "Current location", exact: true }).check();
  await panel.getByRole("button", { name: "Use current location", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText("Location ready");
  const popupEvent = page.waitForEvent("popup");
  await panel.getByRole("button", { name: "Open Google Maps" }).click();
  const popup = await popupEvent;
  await popup.waitForURL("https://www.google.com/maps/search/**");
  expect(new URL(popup.url()).searchParams.get("query")).toBe("Local businesses near 17.3850,78.4867");
  await popup.close();
});

test("switching away from a pending location request allows PIN search immediately", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition: () => {} } }));
  await page.goto("/nearby");
  const panel = page.getByRole("region", { name: "Find businesses on Google Maps" });
  await panel.getByRole("radio", { name: "Current location", exact: true }).check();
  await panel.getByRole("button", { name: "Use current location", exact: true }).click();
  await expect(panel.getByRole("button", { name: "Open Google Maps" })).toBeDisabled();
  await panel.getByRole("radio", { name: "PIN code", exact: true }).check();
  await expect(panel.getByRole("button", { name: "Open Google Maps" })).toBeEnabled();
});
