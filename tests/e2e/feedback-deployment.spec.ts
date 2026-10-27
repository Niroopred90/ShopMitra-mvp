import { expect, test } from "@playwright/test";
import { validateFeedbackEnv } from "../../scripts/feedback-env.mjs";
import { aiConfig } from "../../lib/ai/provider";

const settings = {
  NEXT_PUBLIC_SUPABASE_URL: "https://feedback-example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_placeholder",
  SUPABASE_SECRET_KEY: "sb_secret_test_placeholder",
  SITE_URL: "https://shopmitra-feedback.netlify.app",
  PUBLIC_RATE_SECRET: "test-only-random-placeholder-string-32-characters",
};

test("feedback preflight accepts hosted shapes without connecting or printing credentials", () => {
  expect(validateFeedbackEnv(settings)).toEqual([]);
  expect(validateFeedbackEnv({ ...settings, SITE_URL: undefined, URL: settings.SITE_URL })).toEqual([]);
});

test("feedback preflight rejects localhost, private keys in public variables, and paid AI config", () => {
  for (const patch of [
    { NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" },
    { SITE_URL: "http://localhost:3000" }, { SITE_URL: "https://example.com/path" },
    { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: settings.SUPABASE_SECRET_KEY },
    { SUPABASE_SECRET_KEY: "" }, { PUBLIC_RATE_SECRET: "short" },
    { OPENAI_API_KEY: "test-only-do-not-call" },
  ]) expect(validateFeedbackEnv({ ...settings, ...patch }).length).toBeGreaterThan(0);
});

test("feedback mode disables AI even if provider keys are configured", () => {
  const previous = { mode: process.env.FEEDBACK_MODE, key: process.env.OPENAI_API_KEY, model: process.env.OPENAI_OFFER_MODEL };
  try {
    process.env.FEEDBACK_MODE = "true";
    process.env.OPENAI_API_KEY = "test-only-do-not-call";
    process.env.OPENAI_OFFER_MODEL = "test-model";
    expect(aiConfig()).toBeNull();
  } finally {
    for (const [key, value] of Object.entries({ FEEDBACK_MODE: previous.mode, OPENAI_API_KEY: previous.key, OPENAI_OFFER_MODEL: previous.model })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
