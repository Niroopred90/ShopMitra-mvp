import Link from "next/link";
import { requireShopAccess } from "@/lib/auth";
import { aiConfig } from "@/lib/ai/provider";
import { AiDraftForm } from "./form";

export const metadata = { title: "Offer assistant", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const maxDuration = 90;

export default async function AiPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  await requireShopAccess(shopId, true);
  const config = aiConfig();
  return <section className="mx-auto max-w-xl"><h1 className="text-3xl font-bold">Offer assistant</h1><p className="mt-4 text-stone-600">Turn text, a photo, or a short voice recording into a draft. You remain in control of every published offer.</p>{config ? <AiDraftForm shopId={shopId} requestId={crypto.randomUUID()} offerId={crypto.randomUUID()} voiceEnabled={Boolean(config.transcriptionModel)} /> : <p className="mt-6 rounded-xl bg-orange-50 p-5">The AI assistant is not configured yet. You can still create and publish an offer manually.</p>}<Link href={`/owner/shops/${shopId}/offers/new`} className="mt-6 inline-block font-semibold text-emerald-900 underline">Use manual offer entry</Link></section>;
}
