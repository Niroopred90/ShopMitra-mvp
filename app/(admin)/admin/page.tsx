export const metadata = { title: "Administration", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-stone-200 bg-white p-8 md:p-12">
      <h1 className="text-3xl font-bold">Administration</h1>
      <p className="mt-4 text-stone-600">Administrative access is not available in this preview.</p>
    </section>
  );
}
