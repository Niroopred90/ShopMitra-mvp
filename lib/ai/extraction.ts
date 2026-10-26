export type ExtractedOffer = {
  title: string | null; description: string; price_minor: number | null;
  quantity: number | null; unit: string | null; starts_on: string | null;
  expires_on: string | null; warnings: string[];
};

export const extractionSchema = {
  type: "object", additionalProperties: false,
  properties: {
    title: { type: ["string", "null"] }, description: { type: "string" },
    price_minor: { type: ["integer", "null"] }, quantity: { type: ["number", "null"] },
    unit: { type: ["string", "null"] }, starts_on: { type: ["string", "null"] }, expires_on: { type: ["string", "null"] },
    warnings: { type: "array", items: { type: "string" } },
  },
  required: ["title", "description", "price_minor", "quantity", "unit", "starts_on", "expires_on", "warnings"],
};

export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseExtraction(value: unknown): ExtractedOffer {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid AI response");
  const data = value as Record<string, unknown>;
  if (Object.keys(data).some(key => !extractionSchema.required.includes(key)) || extractionSchema.required.some(key => !(key in data))) throw new Error("Invalid AI response");
  const nullableText = (v: unknown, max: number) => v === null || (typeof v === "string" && v.length > 0 && v.length <= max);
  if (!nullableText(data.title, 160) || typeof data.description !== "string" || data.description.length > 3000
    || !(data.price_minor === null || (Number.isInteger(data.price_minor) && Number(data.price_minor) >= 0 && Number(data.price_minor) <= 100000000))
    || !(data.quantity === null || (typeof data.quantity === "number" && Number.isFinite(data.quantity) && data.quantity > 0 && data.quantity <= 1000000 && Number.isInteger(data.quantity * 1000)))
    || !nullableText(data.unit, 40) || !(data.starts_on === null || validDate(data.starts_on)) || !(data.expires_on === null || validDate(data.expires_on))
    || !Array.isArray(data.warnings) || data.warnings.length > 10 || data.warnings.some(w => typeof w !== "string" || w.length > 300)) throw new Error("Invalid AI response");
  const result = data as ExtractedOffer;
  const warnings = new Set(result.warnings);
  if (!result.title?.trim()) warnings.add("Check the offer title.");
  if (result.price_minor === null) warnings.add("Price is missing or ambiguous. Enter it manually.");
  if (!result.expires_on) warnings.add("An end date is required before publishing.");
  if ((result.quantity === null) !== (result.unit === null)) warnings.add("Check quantity and unit together.");
  if (result.starts_on && result.expires_on && result.starts_on > result.expires_on) warnings.add("Validity dates need correction.");
  warnings.add("Verify all prices, quantities, and dates against the original input before publishing.");
  return { ...result, warnings: [...warnings] };
}

export function dateToIndiaBoundary(date: string | null, end = false): string | null {
  if (!date || !validDate(date)) return null;
  const timestamp = new Date(`${date}T00:00:00+05:30`).getTime() + (end ? 86400000 : 0);
  return new Date(timestamp).toISOString();
}

export const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
export function validateMedia(bytes: Uint8Array, claimedType: string, mode: "photo" | "voice"): string {
  if (!bytes.length || bytes.length > MAX_SOURCE_BYTES) throw new Error("Choose a non-empty file smaller than 2 MB.");
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  let type: string | null = null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) type = "image/jpeg";
  else if (bytes[0] === 0x89 && ascii(1, 4) === "PNG" && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10) type = "image/png";
  else if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") type = "image/webp";
  else if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) type = "audio/webm";
  else if (ascii(4, 8) === "ftyp") type = "audio/mp4";
  else if (ascii(0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) type = "audio/mpeg";
  else if (ascii(0, 4) === "OggS") type = "audio/ogg";
  const expected = claimedType.split(";")[0];
  if (!type || type !== expected || (mode === "photo" ? !type.startsWith("image/") : !type.startsWith("audio/"))) throw new Error("Unsupported file. Use JPEG/PNG/WebP photos or WebM/MP4/MP3/Ogg audio.");
  return type;
}
