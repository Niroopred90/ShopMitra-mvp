export function parseOwnerShopRequest(form: FormData) {
  const text = (name: string) => String(form.get(name) ?? "").trim();
  const requestId = text("requestId");
  const payload = { name: text("name"), category: text("category"), neighborhood: text("neighborhood"), address: text("address"), description: text("description"), consent: form.get("consent") === "on" };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) return { error: "Reload the form before submitting." };
  if (!payload.name || payload.name.length > 120 || !payload.category || payload.category.length > 80 || !payload.neighborhood || payload.neighborhood.length > 120 || payload.address.length > 500 || payload.description.length > 2000) return { error: "Check the shop details and their length limits." };
  if (!payload.consent) return { error: "Confirm your authority to request this shop and publish its business details after approval." };
  return { requestId, payload };
}
