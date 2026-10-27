import Link from "next/link";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { OwnerShopRequestForm } from "./form";

export const metadata = { title: "Request your shop", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OwnerOnboardingPage() {
  const { client, user } = await requireUser();
  const { data: request, error } = await client.from("owner_shop_requests").select("id,name,status,shop_id").eq("user_id", user.id).maybeSingle();
  return <section className="mx-auto max-w-xl"><Link href="/owner" className="underline">Back to your shops</Link><h1 className="page-title mt-6">Request your shop</h1>
    {!user.email_confirmed_at ? <p className="page-description">Confirm your email before submitting shop details.</p> : error ? <p role="alert" className="page-description">Unable to load your request. Please try again later.</p> : request ? <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6"><h2 className="text-xl font-bold">{request.name}</h2><p role="status" className="mt-4">{request.status === "pending" ? "Awaiting ownership approval. Your shop is private and publishing is unavailable until an organizer verifies your request." : request.status === "approved" ? "Your shop is approved. You can manage its offers from your dashboard." : "Your request was not approved. Contact the feedback organizer to review your details."}</p>{request.status === "approved" && <Link href="/owner" className="button-primary mt-6">Manage your shop</Link>}</div> : <><p className="page-description">Tell us about your shop. An organizer must independently verify ownership before creating the storefront and enabling publishing. One request per account is supported in this preview.</p><OwnerShopRequestForm requestId={randomUUID()} /></>}
  </section>;
}
