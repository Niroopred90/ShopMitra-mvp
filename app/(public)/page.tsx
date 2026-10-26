import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid items-center gap-12 py-6 md:grid-cols-[1.3fr_1fr] md:py-16">
      <section>
        <p className="mb-5 text-sm font-bold uppercase tracking-widest text-emerald-800">Made for neighborhood shops</p>
        <h1 className="max-w-xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">Your local shop.<br />One simple link.</h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-600">Scan a QR. Visit your shop’s page. See what’s on offer, straight from the owner. No app or customer login needed.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/s/demo-shop" className="rounded-xl bg-emerald-900 px-6 py-4 font-semibold text-white">Explore the demo shop →</Link>
          <Link href="/owner" className="rounded-xl border border-stone-300 bg-white px-6 py-4 font-semibold">I’m a shop owner</Link>
        </div>
      </section>
      <aside className="rounded-3xl border border-emerald-900/10 bg-emerald-50 p-8">
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-800">Simple by design</p>
        <ol className="mt-6 space-y-6">
          <li><strong className="text-lg">01 · A page for your shop</strong><p className="mt-1 text-stone-600">A permanent home customers can open on their phone.</p></li>
          <li><strong className="text-lg">02 · Offers you control</strong><p className="mt-1 text-stone-600">Review the details before anything is published.</p></li>
          <li><strong className="text-lg">03 · Connected to your neighborhood</strong><p className="mt-1 text-stone-600">Built for the shops around the corner.</p></li>
        </ol>
        <p className="mt-8 border-t border-emerald-900/10 pt-5 text-sm text-stone-600">Early preview. Shop setup and publishing are coming next.</p>
      </aside>
    </div>
  );
}
