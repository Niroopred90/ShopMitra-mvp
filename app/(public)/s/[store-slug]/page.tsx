import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadStorefront, storefrontUrl } from "@/lib/storefront";
import { ShareShop } from "@/components/share-shop";
import { StorefrontUnavailable } from "@/components/storefront-unavailable";
import Link from "next/link";
import { RecordShopView } from "@/components/record-shop-view";

type Props = { params: Promise<{ "store-slug": string }> };
export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const dates = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params)["store-slug"];
  const result = await loadStorefront(slug);
  const canonical = storefrontUrl(slug);
  return {
    title: result.status === "found" ? result.shop.name : "Shop unavailable",
    robots: { index: false, follow: false },
    ...(result.status === "found" && !result.demo && canonical ? { alternates: { canonical } } : {}),
  };
}

export default async function StorefrontPage({ params }: Props) {
  const slug = (await params)["store-slug"];
  const result = await loadStorefront(slug);
  if (result.status === "missing") notFound();
  if (result.status !== "found") return <StorefrontUnavailable slug={slug} />;
  const { shop, offers, demo } = result;
  const url = storefrontUrl(slug);
  const directions = shop.address?.trim()
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${shop.name}, ${shop.address}, ${shop.neighborhood}`)}` : null;
  return (
    <article className="mx-auto max-w-2xl break-words">
      {!demo && <RecordShopView shopId={shop.id} />}
      {demo && <p className="mb-5 inline-block rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-900">Demo only · Not a real business</p>}
      <section className="rounded-3xl bg-emerald-900 p-8 text-white md:p-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-100">{shop.category} · {shop.neighborhood}</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">{shop.name}</h1>
        {shop.description && <p className="mt-4 whitespace-pre-line leading-relaxed text-emerald-50">{shop.description}</p>}
        {shop.address && <p className="mt-5 text-sm text-emerald-100">{shop.address}</p>}
      </section>
      <div className="mt-6 flex flex-wrap items-start gap-4">
        {directions && <a href={directions} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white">Get directions</a>}
        <ShareShop name={shop.name ?? "Shop"} url={url} />
      </div>
      <section className="mt-10" aria-labelledby="offers-heading">
        <h2 id="offers-heading" className="text-2xl font-bold">Current offers</h2>
        {offers.length ? <ul className="mt-4 space-y-4">{offers.map(offer => <li key={offer.id} className="rounded-2xl border border-stone-200 bg-white p-6">
          <h3 className="text-xl font-bold">{offer.title}</h3>
          {offer.description && <p className="mt-3 whitespace-pre-line text-stone-600">{offer.description}</p>}
          {offer.price_minor !== null && <p className="mt-4 text-2xl font-bold text-emerald-900">{money.format(offer.price_minor / 100)}{offer.quantity !== null && offer.unit && <span className="ml-2 text-sm font-normal text-stone-600">for {offer.quantity} {offer.unit}</span>}</p>}
          {offer.expires_at && <p className="mt-4 text-sm text-stone-600">Ends <time dateTime={offer.expires_at}>{dates.format(new Date(offer.expires_at))}</time></p>}
          <Link href={`/report/${offer.id}`} className="mt-4 inline-block text-sm text-stone-600 underline">Report this offer</Link>
        </li>)}</ul> : <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white p-8">
          <p className="font-semibold">No offers yet</p>
          <p className="mt-2 text-stone-600">{demo ? "Published offers will appear here. This preview has no live shop data." : "There are no current offers. Check back for updates from the shop."}</p>
        </div>}
      </section>
      {!demo && url && <section className="mt-10 border-t border-stone-200 pt-6" aria-labelledby="qr-heading">
        <h2 id="qr-heading" className="text-lg font-bold">Keep this shop handy</h2>
        <a href={`/s/${slug}/qr`} download className="mt-3 inline-block font-semibold text-emerald-900 underline">Download shop QR</a>
        {["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname) && <p className="mt-2 text-sm text-stone-600">Local preview QR. This link works only on this computer; don’t print it for customers.</p>}
      </section>}
    </article>
  );
}
