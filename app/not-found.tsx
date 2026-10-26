import Link from "next/link";

export default function NotFound() {
  return (
    <section className="py-12">
      <h1 className="text-3xl font-bold">This page isn’t available</h1>
      <p className="mt-4 text-stone-600">Check the shop link or return to ShopMitra.</p>
      <Link href="/" className="mt-6 inline-block font-semibold text-emerald-800 underline">Back to home</Link>
    </section>
  );
}
