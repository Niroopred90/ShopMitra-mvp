import Link from "next/link";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isUuid, offerDateInput } from "@/lib/offers";
import { OfferForm, PublicationForm } from "../offer-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review offer", robots: { index: false, follow: false } };
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const dates = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

export default async function ReviewOffer({ params, searchParams }: { params: Promise<{ shopId: string; offerId: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { shopId, offerId } = await params;
  if (!isUuid(shopId) || !isUuid(offerId)) notFound();
  const { client, user } = await requireUser();
  const { data: membership } = await client.from("shop_memberships").select("role").eq("shop_id", shopId).eq("user_id", user.id).maybeSingle();
  if (!membership) notFound();
  const { data: offer } = await client.from("offers").select("*").eq("id", offerId).eq("shop_id", shopId).maybeSingle();
  if (!offer) notFound();
  const { data: source } = await client.from("offer_sources").select("transcript, extracted_fields").eq("offer_id", offerId).maybeSingle();
  const sourceFields = source?.extracted_fields as { warnings?: unknown } | undefined;
  const warnings = Array.isArray(sourceFields?.warnings) ? sourceFields.warnings.filter((item): item is string => typeof item === "string") : [];
  const editing = membership.role !== "viewer";
  const saved = (await searchParams).saved;
  return <section className="mx-auto max-w-2xl"><Link href={`/owner/shops/${shopId}/offers`} className="underline">← Offers</Link><h1 className="mt-4 text-3xl font-bold">Review offer</h1>
    {(saved === "publish" || saved === "withdraw") && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-4">{saved === "publish" ? "Offer published. Customers can see it during its validity dates." : "Offer withdrawn from the customer page."}</p>}
    <article className="mt-6 rounded-2xl border border-stone-200 bg-white p-6"><p className="text-sm font-semibold capitalize">{offer.status} · {offer.moderation_status === "hidden" ? "Hidden by moderation" : "Not hidden by moderation"}</p><h2 className="mt-3 text-2xl font-bold">{offer.title}</h2><p className="mt-3 whitespace-pre-wrap">{offer.description}</p><dl className="mt-4 space-y-2"><div><dt className="font-semibold">Price</dt><dd>{offer.price_minor === null ? "Missing — enter before publishing" : money.format(offer.price_minor / 100)}</dd></div><div><dt className="font-semibold">Quantity</dt><dd>{offer.quantity === null ? "Not specified" : `${offer.quantity} ${offer.unit}`}</dd></div><div><dt className="font-semibold">Starts</dt><dd>{offer.starts_at ? `${dates.format(new Date(offer.starts_at))} IST` : "Immediately on publishing"}</dd></div><div><dt className="font-semibold">Ends (exclusive)</dt><dd>{offer.expires_at ? `${dates.format(new Date(offer.expires_at))} IST` : "Missing — enter before publishing"}</dd></div></dl>
    {warnings.length > 0 && <aside className="mt-5 rounded-xl bg-amber-50 p-4 text-amber-950"><h3 className="font-bold">Review these AI uncertainties</h3><ul className="mt-2 list-disc pl-5">{warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul></aside>}
    {source && <details className="mt-5 border-t border-stone-200 pt-4"><summary className="font-semibold">AI source and review notes</summary>{source.transcript && <p className="mt-3 whitespace-pre-wrap text-sm">{source.transcript}</p>}<p className="mt-3 text-sm">Correct ambiguous values below before approval. AI content has not been independently verified.</p></details>}
    {editing && offer.status === "draft" && <PublicationForm shopId={shopId} offerId={offerId} version={offer.version} requestId={randomUUID()} operation="publish" />}
    {editing && offer.status === "published" && <PublicationForm shopId={shopId} offerId={offerId} version={offer.version} requestId={randomUUID()} operation="withdraw" />}
    </article>
    {editing && <details className="mt-8" open={offer.status !== "draft"}><summary className="cursor-pointer text-xl font-bold">Edit offer details</summary><OfferForm shopId={shopId} offerId={offerId} version={offer.version} requestId={randomUUID()} values={{ title: offer.title, description: offer.description, price: offer.price_minor === null ? "" : (offer.price_minor / 100).toFixed(2), quantity: offer.quantity === null ? "" : String(offer.quantity), unit: offer.unit ?? "", start_date: offerDateInput(offer.starts_at), end_date: offerDateInput(offer.expires_at, true) }} /></details>}
  </section>;
}
