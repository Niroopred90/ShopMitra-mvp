import type { NextConfig } from "next";

const config: NextConfig = {
  // Only non-secret values: Next.js inlines these into the built artifact.
  env: { FEEDBACK_MODE: process.env.FEEDBACK_MODE ?? "", SITE_URL: process.env.SITE_URL ?? "" },
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "geolocation=(self), microphone=(self), camera=(self)" },
      { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'" },
    ] }];
  },
};
export default config;
