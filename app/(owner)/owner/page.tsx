import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabaseConfig } from "@/lib/supabase/config";
import { signOut } from "./login/actions";
import { ShopLink } from "@/components/shop-link";

export const metadata = { title: "Your shops", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OwnerPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!supabaseConfig()) return <section><h1 className="text-3xl font-bold">For shop owners</h1><p className="mt-4">Owner sign-in is not configured yet.</p><Link href="/owner/login" className="mt-4 inline-block underline">Owner sign-in</Link></section>;
  const { client, user } = await requireUser();
  const { data: memberships, error } = await client.from("shop_memberships").select("shop_id, role, shops(name, neighborhood, slug, visibility)").eq("user_id", user.id);
  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Your shops</h1>
      {(await searchParams).error === "signout" && <p role="alert" className="mt-4 text-red-800">Unable to sign out. Please try again.</p>}
      {error ? <p role="alert" className="mt-6">Unable to load your shops. Please try again later.</p> : memberships?.length ? (
        <ul className="mt-6 space-y-4">{memberships.map(membership => {
          const shop = membership.shops;
          return <li key={membership.shop_id} className="rounded-2xl border border-stone-200 bg-white p-6"><h2 className="text-xl font-bold">{shop?.name}</h2><p className="mt-2 text-stone-600">{shop?.neighborhood}</p>{shop?.visibility === "public" ? <ShopLink href={`/s/${shop.slug}`} className="mt-4 inline-block font-semibold text-emerald-900 underline">View storefront and QR</ShopLink> : <p className="mt-4 text-sm">This shop is not publicly available.</p>}<p className="mt-3 text-sm">Offer publishing is coming next.</p></li>;
        })}</ul>
      ) : <p className="mt-6 rounded-xl bg-white p-6">No verified shops are linked to your account. Contact the pilot lead to verify your shop.</p>}
      <form action={signOut} className="mt-8"><button className="rounded-lg border border-stone-400 px-5 py-3 font-semibold">Sign out</button></form>
    </section>
  );
}
