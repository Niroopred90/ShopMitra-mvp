import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

// WebKit + iPhone viewport emulation; not a physical iOS device or Safari certification.
export default defineConfig({
  ...base,
  testMatch: ["smoke.spec.ts", "storefront.spec.ts", "offers.spec.ts", "google-search.spec.ts"],
  workers: 1,
  projects: [{ name: "mobile-webkit", use: { ...devices["iPhone 13"] } }],
});
