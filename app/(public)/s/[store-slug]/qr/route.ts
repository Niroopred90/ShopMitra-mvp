import QRCode from "qrcode";
import { loadStorefront, storefrontUrl } from "@/lib/storefront";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ "store-slug": string }> }) {
  const slug = (await params)["store-slug"];
  const result = await loadStorefront(slug);
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (result.status === "missing" || (result.status === "found" && result.demo)) return new Response("Shop unavailable", { status: 404, headers });
  if (result.status !== "found") return new Response("Shop temporarily unavailable", { status: 503, headers });
  const url = storefrontUrl(slug);
  if (!url) return new Response("QR download is not available yet.", { status: 503, headers });
  const png = await QRCode.toBuffer(url, { type: "png", width: 1024, margin: 4, errorCorrectionLevel: "M" });
  return new Response(new Uint8Array(png), { headers: {
    ...headers, "Content-Type": "image/png", "Content-Disposition": `attachment; filename="shopmitra-${slug}-qr.png"`,
  } });
}
