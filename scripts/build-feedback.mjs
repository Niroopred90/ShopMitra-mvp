import { spawnSync } from "node:child_process";
import { validateFeedbackEnv } from "./feedback-env.mjs";

const errors = validateFeedbackEnv(process.env);
if (errors.length) {
  console.error("Feedback deployment is not configured:\n" + errors.map(error => `- ${error}`).join("\n"));
  process.exit(1);
}
const result = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
  stdio: "inherit",
  env: {
    ...process.env, FEEDBACK_MODE: "true", SITE_URL: process.env.SITE_URL || process.env.URL,
    NEXT_TELEMETRY_DISABLED: "1", OPENAI_API_KEY: "", OPENAI_OFFER_MODEL: "", OPENAI_TRANSCRIPTION_MODEL: "",
  },
});
process.exit(result.status ?? 1);
