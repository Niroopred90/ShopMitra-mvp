import { ingestionClient, publicRateKey } from "@/lib/public-ingestion";
import { uuid } from "@/lib/discovery";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : new URL(request.url).origin;
  if (origin !== expected) return new Response(null, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return new Response(null, { status: 415 });
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  let text = "";
  let size = 0;
  let expired = false;
  const deadline = setTimeout(() => {
    expired = true;
    void reader.cancel().catch(() => { /* The client may already have disconnected. */ });
  }, 5000);
  const decoder = new TextDecoder();
  try {
    while (true) {
      const chunk = await reader.read();
      if (expired) return new Response(null, { status: 408 });
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 512) {
        void reader.cancel().catch(() => { /* Oversized requests need no further reads. */ });
        return new Response(null, { status: 413 });
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    clearTimeout(deadline);
    text += decoder.decode();
    const data: unknown = JSON.parse(text);
    if (!data || typeof data !== "object" || !("shopId" in data) || typeof data.shopId !== "string" || !uuid(data.shopId)) return new Response(null, { status: 400 });
    const client = ingestionClient();
    if (client) await client.rpc("record_shop_view", { p_shop_id: data.shopId, p_rate_key: await publicRateKey() });
  } catch {
    if (expired) return new Response(null, { status: 408 });
    // Invalid input or unavailable metrics has no effect on the storefront.
  } finally {
    clearTimeout(deadline);
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
