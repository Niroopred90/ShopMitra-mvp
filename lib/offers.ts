// PostgreSQL accepts fixture UUIDs without RFC version bits too.
export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function dateBoundary(value: string, end: boolean) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Use a valid date.");
  const timestamp = Date.parse(`${value}T00:00:00+05:30`);
  if (!Number.isFinite(timestamp) || new Date(timestamp + 19_800_000).toISOString().slice(0, 10) !== value) throw new Error("Use a valid calendar date.");
  return new Date(timestamp + (end ? 86_400_000 : 0)).toISOString();
}
export function offerDateInput(timestamp: string | null, end = false) {
  return timestamp ? new Date(Date.parse(timestamp) + 19_800_000 - (end ? 1 : 0)).toISOString().slice(0, 10) : "";
}

export function offerPayload(form: FormData) {
  const get = (key: string) => String(form.get(key) ?? "").trim();
  const title = get("title");
  const description = get("description");
  if (!title || title.length > 160 || description.length > 3000) throw new Error("Enter a title of 1–160 characters and a description under 3,001 characters.");
  const price = get("price");
  let price_minor: number | null = null;
  if (price) {
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(price)) throw new Error("Enter a price in rupees with at most two decimal places.");
    const [whole, fraction = ""] = price.split(".");
    price_minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
    if (price_minor > 100_000_000) throw new Error("Price must not exceed ₹10,00,000.");
  }
  const rawQuantity = get("quantity");
  const unit = get("unit") || null;
  let quantity: number | null = null;
  if (rawQuantity) {
    if (!/^\d{1,7}(\.\d{1,3})?$/.test(rawQuantity)) throw new Error("Quantity allows up to three decimal places.");
    quantity = Number(rawQuantity);
    if (quantity <= 0 || quantity > 1_000_000) throw new Error("Quantity must be greater than zero and at most 10,00,000.");
  }
  if ((quantity === null) !== (unit === null) || (unit?.length ?? 0) > 40) throw new Error("Enter quantity and unit together, or leave both empty.");
  const starts_at = dateBoundary(get("start_date"), false);
  const expires_at = dateBoundary(get("end_date"), true);
  if (starts_at && expires_at && expires_at <= starts_at) throw new Error("The end date must not be before the start date.");
  return { title, description, price_minor, quantity, unit, starts_at, expires_at, source_type: "text" };
}
