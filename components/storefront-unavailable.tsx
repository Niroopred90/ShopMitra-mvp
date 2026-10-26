import Link from "next/link";

export function StorefrontUnavailable({ slug }: { slug: string }) {
  return <section className="mx-auto max-w-2xl rounded-3xl border border-stone-200 bg-white p-8"><h1 className="text-3xl font-bold">Shop temporarily unavailable</h1><p className="mt-4 text-stone-600">We couldn’t load this shop’s latest offers. Please try again shortly.</p><a href={`/s/${encodeURIComponent(slug)}`} className="mt-6 inline-block rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white">Try again</a><Link href="/" className="ml-5 inline-block underline">Back to home</Link></section>;
}
