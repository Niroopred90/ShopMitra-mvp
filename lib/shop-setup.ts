export type ShopProfile = {
  id: string; slug: string; name: string; category: string; neighborhood: string; address: string;
  description: string; visibility: string; profile_version: number; latitude: number | null; longitude: number | null;
};

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export function parseShopSetup(form: FormData) {
  const text = (name: string) => String(form.get(name) ?? "").trim();
  const shopId = text("shopId");
  const requestId = text("requestId");
  const version = Number(text("version"));
  const slug = text("slug");
  const name = text("name");
  const category = text("category");
  const neighborhood = text("neighborhood");
  const address = text("address");
  const description = text("description");
  const visibility = text("visibility");
  const ownerLookup = text("ownerLookup");
  const verified = form.get("verified") === "on";
  const method = text("verificationMethod");
  const rawLatitude = text("latitude");
  const rawLongitude = text("longitude");
  const latitude = rawLatitude ? Number(rawLatitude) : null;
  const longitude = rawLongitude ? Number(rawLongitude) : null;
  if (!isUuid(shopId) || !isUuid(requestId) || !Number.isSafeInteger(version) || version < 0) return { error: "Invalid form. Reload this page before saving." };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 100 || slug === "demo-shop") return { error: "Choose a permanent lowercase shop slug using letters, numbers, and hyphens." };
  if (!name || name.length > 120 || !category || category.length > 80 || !neighborhood || neighborhood.length > 120 || address.length > 500 || description.length > 2000 || !["public", "hidden"].includes(visibility)) return { error: "Check the shop's public fields and their length limits." };
  if ((latitude === null) !== (longitude === null) || (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude! < -180 || longitude! > 180))) return { error: "Supply both valid latitude and longitude, or leave both blank." };
  if ((version === 0 && !ownerLookup) || ownerLookup.length > 254) return { error: "An existing owner account email or UUID is required for a new shop." };
  if (ownerLookup && (!verified || !["in_person", "agreed_callback"].includes(method))) return { error: "Confirm independent ownership verification and its method before assigning access." };
  return {
    shopId, requestId, version, ownerLookup: ownerLookup || null, verified, method: ownerLookup ? method : null,
    payload: { slug, name, category, neighborhood, address, description, visibility, latitude, longitude },
  };
}
