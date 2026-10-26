export const metadata = { title: "For shop owners" };

export default function OwnerPage() {
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-stone-200 bg-white p-8 md:p-12">
      <p className="text-sm font-bold uppercase tracking-widest text-emerald-800">For shop owners</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">Your shop, ready to share.</h1>
      <p className="mt-5 leading-relaxed text-stone-600">Manage your shop’s page and review your offers before publishing.</p>
      <p className="mt-6 rounded-xl bg-stone-100 p-4 text-sm leading-relaxed">Owner sign-in and publishing are not available in this preview. They will be added after account access and shop ownership checks are in place.</p>
    </section>
  );
}
