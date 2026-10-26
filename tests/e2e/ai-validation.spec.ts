import { expect, test } from "@playwright/test";
import { dateToIndiaBoundary, parseExtraction, validateMedia } from "../../lib/ai/extraction";
import { extractOffer } from "../../lib/ai/provider";

const fields = { title: "Rice offer", description: "Local rice", price_minor: 9900, quantity: 1, unit: "kg", starts_on: null, expires_on: "2027-01-01", warnings: [] };
const config = { apiKey: "test-only-not-a-key", offerModel: "test-model", transcriptionModel: "test-transcription" };
const modelResponse = (value: unknown) => new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(value) }] }] }), { status: 200 });

test("AI extraction rejects unsupported fields, invented approval, bad money, and invalid dates", () => {
  expect(() => parseExtraction({ ...fields, published: true })).toThrow();
  expect(() => parseExtraction({ ...fields, price_minor: 99.5 })).toThrow();
  expect(() => parseExtraction({ ...fields, price_minor: -1 })).toThrow();
  expect(() => parseExtraction({ ...fields, expires_on: "2026-02-30" })).toThrow();
  const ambiguous = parseExtraction({ ...fields, price_minor: null, expires_on: null });
  expect(ambiguous.warnings.join(" ")).toContain("Price is missing");
  expect(ambiguous.warnings.join(" ")).toContain("end date");
});

test("AI date boundaries use exclusive next midnight in India", () => {
  expect(dateToIndiaBoundary("2026-10-26", true)).toBe("2026-10-26T18:30:00.000Z");
  expect(dateToIndiaBoundary("2026-10-26")).toBe("2026-10-25T18:30:00.000Z");
  expect(dateToIndiaBoundary("2026-02-30", true)).toBeNull();
});

test("media upload validates both claimed type and magic bytes", () => {
  const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0]);
  expect(validateMedia(png, "image/png", "photo")).toBe("image/png");
  expect(() => validateMedia(png, "image/jpeg", "photo")).toThrow();
  expect(() => validateMedia(png, "image/png", "voice")).toThrow();
  expect(() => validateMedia(new Uint8Array(2 * 1024 * 1024 + 1), "image/png", "photo")).toThrow();
});

test("text adapter uses structured output and disables response storage", async () => {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  const request = (async (url, options) => { calls.push({ url: String(url), body: JSON.parse(String(options?.body)) }); return modelResponse(fields); }) as typeof fetch;
  const result = await extractOffer({ mode: "text", text: "Rice 99 rupees", language: "en" }, config, request);
  expect(result.fields.price_minor).toBe(9900);
  expect(calls[0].url).toBe("https://api.openai.com/v1/responses");
  expect(calls[0].body.store).toBe(false);
  expect(calls[0].body.max_output_tokens).toBe(1400);
  expect(JSON.stringify(calls[0].body)).toContain("json_schema");
});

test("photo adapter embeds image privately without a public media URL", async () => {
  let body = "";
  const request = (async (_url, options) => { body = String(options?.body); return modelResponse(fields); }) as typeof fetch;
  await extractOffer({ mode: "photo", text: "", language: "te", media: { bytes: new Uint8Array([255, 216, 255]), type: "image/jpeg" } }, config, request);
  expect(body).toContain("data:image/jpeg;base64,");
  expect(body).toContain("input_image");
});

test("voice transcribes in the selected language before structured extraction", async () => {
  const urls: string[] = [];
  const request = (async (url, options) => {
    urls.push(String(url));
    if (String(url).endsWith("transcriptions")) {
      expect((options?.body as FormData).get("language")).toBe("hi");
      return new Response(JSON.stringify({ text: "Rice 99 rupees" }), { status: 200 });
    }
    return modelResponse(fields);
  }) as typeof fetch;
  const result = await extractOffer({ mode: "voice", text: "", language: "hi", media: { bytes: new Uint8Array([1, 2, 3]), type: "audio/webm" } }, config, request);
  expect(urls).toEqual(["https://api.openai.com/v1/audio/transcriptions", "https://api.openai.com/v1/responses"]);
  expect(result.transcript).toBe("Rice 99 rupees");
});

test("provider failures and refusals never produce an offer draft", async () => {
  const failure = (async () => new Response("upstream details", { status: 429 })) as typeof fetch;
  await expect(extractOffer({ mode: "text", text: "offer", language: "en" }, config, failure)).rejects.toThrow("Type the offer instead");
  const refusal = (async () => new Response(JSON.stringify({ status: "completed", output: [{ content: [{ type: "refusal" }] }] }))) as typeof fetch;
  await expect(extractOffer({ mode: "text", text: "offer", language: "en" }, config, refusal)).rejects.toThrow();
});
