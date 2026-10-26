import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ "store-slug": string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params)["store-slug"];
  return { title: slug === "demo-shop" ? "Demo neighborhood shop" : "Shop unavailable", robots: { index: false, follow: false } };
}

export default async function StorefrontPage({ params }: Props) {
  if ((await params)["store-slug"] !== "demo-shop") notFound();

  return (
    <article className="mx-auto max-w-2xl">
      <p className="mb-5 inline-block rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-900">Demo only · Not a real business</p>
      <section className="rounded-3xl bg-emerald-900 p-8 text-white md:p-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-100">Your neighborhood storefront</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Demo neighborhood shop</h1>
        <p className="mt-4 leading-relaxed text-emerald-50">A preview of the page your customers will see after scanning your shop’s QR.</p>
      </section>
      <section className="mt-10" aria-labelledby="offers-heading">
        <h2 id="offers-heading" className="text-2xl font-bold">Current offers</h2>
        <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white p-8">
          <p className="font-semibold">No offers yet</p>
          <p className="mt-2 text-stone-600">Published offers will appear here. This preview has no live shop data.</p>
        </div>
      </section>
    </article>
  );
}
