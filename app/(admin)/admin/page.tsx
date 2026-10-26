import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabaseConfig } from "@/lib/supabase/config";
import { moderateContent, reviewReport } from "./actions";

export const metadata = { title: "Administration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  if (!supabaseConfig()) notFound();
  const { client } = await requireUser();
  const { data, error } = await client.rpc("current_user_is_admin");
  if (error || data !== true) notFound();
  const params = await searchParams;
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 30);
  const since = cutoff.toISOString().slice(0, 10);
  const [shops, offers, reports, metrics] = await Promise.all([
    client.from("shops").select("id, name, slug, visibility").order("name").limit(100),
    client.from("offers").select("id, title, shop_id, moderation_status, status").order("created_at", { ascending: false }).limit(100),
    client.from("offer_reports").select("id, offer_id, shop_id, reason, status, created_at").eq("status", "open").order("created_at").limit(100),
    client.from("shop_daily_metrics").select("shop_id, day, page_views").gte("day", since).limit(3000),
  ]);
  const failed = [shops, offers, reports, metrics].some(result => result.error);
  const shopNames = new Map((shops.data ?? []).map(shop => [shop.id, shop.name]));
  return (
    <section className="mx-auto max-w-4xl space-y-10">
      <h1 className="text-3xl font-bold">Administration</h1>
      <Link href="/admin/shops/new" className="inline-block rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white">Set up a verified shop</Link>
      <p className="text-stone-600">Administrator access verified. Every moderation decision is recorded in the audit history.</p>
      {params.error && <p role="alert" className="text-red-800">The action could not be completed. Check the input and your access, then try again.</p>}
      {params.success && <p role="status" className="text-emerald-900">Action recorded.</p>}
      {failed && <p role="alert" className="text-red-800">Some administration data could not be loaded. Refresh before taking action.</p>}
      <section><h2 className="text-2xl font-bold">Last 30 days: page displays</h2><p className="mt-3 text-sm text-stone-600">Aggregated page displays only. These are not unique visitors, QR scans, returning visitors, or sales. Rate limits may reduce counts; no visitor identifiers are stored in these totals.</p><ul className="mt-4 space-y-2">{(shops.data ?? []).map(shop => <li key={shop.id} className="flex justify-between gap-5 rounded-xl bg-white p-4"><span>{shop.name}</span><strong>{(metrics.data ?? []).filter(metric => metric.shop_id === shop.id).reduce((sum, metric) => sum + metric.page_views, 0)}</strong></li>)}</ul></section>
      <section><h2 className="text-2xl font-bold">Open reports</h2>{reports.data?.length ? <ul className="mt-4 space-y-4">{reports.data.map(report => <li key={report.id} className="rounded-2xl border border-stone-200 bg-white p-5"><p className="font-semibold">{shopNames.get(report.shop_id) ?? "Shop"} · {report.reason.replaceAll("_", " ")}</p><p className="mt-2 break-all text-sm text-stone-600">Offer: {report.offer_id}</p><form action={reviewReport} className="mt-4 flex flex-wrap gap-3"><input type="hidden" name="id" value={report.id} /><button name="status" value="resolved" className="rounded-lg bg-emerald-900 px-4 py-2 text-white">Mark resolved</button><button name="status" value="dismissed" className="rounded-lg border border-stone-300 px-4 py-2">Dismiss report</button></form></li>)}</ul> : <p className="mt-4">No open reports.</p>}</section>
      <section><h2 className="text-2xl font-bold">Shops</h2><ul className="mt-4 space-y-4">{(shops.data ?? []).map(shop => <li key={shop.id} className="rounded-2xl border border-stone-200 bg-white p-5"><h3 className="font-bold">{shop.name}</h3><p className="mt-2 text-sm">{shop.visibility}</p><Link href={`/admin/shops/${shop.id}`} className="mt-3 inline-block font-semibold text-emerald-900 underline">Edit shop details</Link><ModerationForm id={shop.id} kind="shop" hidden={shop.visibility === "hidden"} /></li>)}</ul></section>
      <section><h2 className="text-2xl font-bold">Recent offers</h2><ul className="mt-4 space-y-4">{(offers.data ?? []).map(offer => <li key={offer.id} className="rounded-2xl border border-stone-200 bg-white p-5"><h3 className="font-bold">{offer.title}</h3><p className="mt-2 text-sm">{shopNames.get(offer.shop_id) ?? "Shop"} · {offer.status} · {offer.moderation_status}</p><ModerationForm id={offer.id} kind="offer" hidden={offer.moderation_status === "hidden"} /></li>)}</ul></section>
    </section>
  );
}

function ModerationForm({ id, kind, hidden }: { id: string; kind: "shop" | "offer"; hidden: boolean }) {
  return <form action={moderateContent} className="mt-4 flex flex-wrap items-end gap-3"><input type="hidden" name="id" value={id} /><input type="hidden" name="kind" value={kind} /><input type="hidden" name="visibility" value={hidden ? "restore" : "hide"} /><label className="flex-1 text-sm font-semibold">Decision reason<input name="reason" required minLength={3} maxLength={300} placeholder="Brief reason; no personal information" className="mt-2 block w-full rounded-lg border border-stone-400 p-3 font-normal" /></label><button className="rounded-lg bg-emerald-900 px-4 py-3 font-semibold text-white">{hidden ? "Restore visibility" : "Hide from public"}</button></form>;
}
