import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabaseConfig } from "@/lib/supabase/config";
import { signOut } from "./login/actions";
import { SmallIcon } from "@/components/brand-art";
import { ShopLink } from "@/components/shop-link";

export const metadata = { title: "Your shops", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OwnerPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!supabaseConfig()) return <section><h1 className="text-3xl font-bold">For shop owners</h1><p className="mt-4">Owner sign-in is not configured yet.</p><Link href="/owner/login" className="mt-4 inline-block underline">Owner sign-in</Link></section>;
  const { client, user } = await requireUser();
  const { data: memberships, error } = await client.from("shop_memberships").select("shop_id, role, shops(name, neighborhood, slug, visibility)").eq("user_id", user.id);
  return (
    <section className="mx-auto max-w-2xl">
      <p className="page-eyebrow">YOUR NEIGHBORHOOD, CONNECTED</p><h1 className="page-title">Your shops</h1><p className="page-description">A little update can bring your shop a little closer.</p>
      {(await searchParams).error === "signout" && <p role="alert" className="mt-4 text-red-800">Unable to sign out. Please try again.</p>}
      {error ? <p role="alert" className="mt-6">Unable to load your shops. Please try again later.</p> : memberships?.length ? (
        <ul className="mt-8 space-y-4">{memberships.map(membership => {
          const shop = membership.shops;
          return <li key={membership.shop_id} className="owner-shop-card"><div className="owner-shop-top"><span className="owner-shop-icon"><SmallIcon kind="bag" /></span><div><h2 className="text-xl font-bold">{shop?.name}</h2><p className="mt-2 text-stone-600">{shop?.neighborhood}</p></div></div><div className="owner-shop-actions">{shop?.visibility === "public" ? <ShopLink href={`/s/${shop.slug}`} className="button-text">View storefront and QR</ShopLink> : <p className="mt-4 text-sm">This shop is not publicly available.</p>}<Link href={`/owner/shops/${membership.shop_id}/offers`} className="button-primary">Manage offers <SmallIcon kind="arrow" /></Link></div></li>;
        })}</ul>
      ) : <p className="mt-6 rounded-xl bg-white p-6">No verified shops are linked to your account. Contact the pilot lead to verify your shop.</p>}
      <form action={signOut} className="mt-8"><button className="rounded-lg border border-stone-400 px-5 py-3 font-semibold">Sign out</button></form>
    </section>
  );
}
