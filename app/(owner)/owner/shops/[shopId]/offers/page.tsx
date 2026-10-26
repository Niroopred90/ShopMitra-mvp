import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/offers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage offers", robots: { index: false, follow: false } };

export default async function OffersPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  if (!isUuid(shopId)) notFound();
  const { client, user } = await requireUser();
  const { data: membership } = await client.from("shop_memberships").select("role").eq("shop_id", shopId).eq("user_id", user.id).maybeSingle();
  if (!membership) notFound();
  const { data: shop } = await client.from("shops").select("name, slug").eq("id", shopId).single();
  const { data: offers, error } = await client.from("offers").select("id, title, status, moderation_status, price_minor, expires_at").eq("shop_id", shopId).order("updated_at", { ascending: false });
  const editing = membership.role !== "viewer";
  return <section className="mx-auto max-w-2xl">
    <Link href="/owner" className="text-sm underline">← Your shops</Link><h1 className="mt-4 text-3xl font-bold">{shop?.name}: offers</h1>
    {editing && <div className="mt-6 flex flex-wrap gap-4"><Link href={`/owner/shops/${shopId}/offers/new`} className="rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white">Create text offer</Link><Link href={`/owner/shops/${shopId}/ai`} className="rounded-xl border border-stone-400 px-5 py-3 font-semibold">AI-assisted draft</Link></div>}
    {error ? <p role="alert" className="mt-6">Unable to load offers. Please refresh.</p> : !offers?.length ? <p className="mt-6 rounded-xl bg-white p-6">No offers yet. Create your first draft.</p> : <ul className="mt-6 space-y-4">{offers.map(offer => <li key={offer.id} className="rounded-2xl border border-stone-200 bg-white p-6"><Link href={`/owner/shops/${shopId}/offers/${offer.id}`} className="text-xl font-bold underline">{offer.title}</Link><p className="mt-2 capitalize">{offer.status}{offer.moderation_status === "hidden" ? " · Hidden by moderation" : ""}</p></li>)}</ul>}
    {shop && <Link href={`/s/${shop.slug}`} className="mt-8 inline-block underline">View customer storefront</Link>}
  </section>;
}
