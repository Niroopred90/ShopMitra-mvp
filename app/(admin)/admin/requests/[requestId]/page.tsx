import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { reviewOwnerRequest } from "../actions";

export const metadata = { title: "Review shop request", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ReviewRequestPage({ params, searchParams }: { params: Promise<{ requestId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { client } = await requireAdmin();
  const { requestId } = await params;
  const { data: request, error } = await client.from("owner_shop_requests").select("*").eq("id", requestId).maybeSingle();
  if (error || !request) notFound();
  const inputClass = "mt-2 block w-full rounded-lg border border-stone-400 p-3";
  return <section className="mx-auto max-w-2xl"><Link href="/admin" className="underline">Back to administration</Link><h1 className="page-title mt-6">Review shop request</h1><div className="mt-6 space-y-3 rounded-2xl bg-white p-6"><h2 className="text-2xl font-bold">{request.name}</h2><p>{request.category} · {request.neighborhood}</p><p>{request.address}</p><p className="whitespace-pre-wrap">{request.description}</p><p className="break-all text-sm">Owner account: {request.user_id}</p><p>Status: {request.status}</p></div>
    {(await searchParams).error && <p role="alert" className="mt-6 text-red-800">Review could not be saved. Check the permanent slug, ownership verification, and current request status.</p>}
    {request.status === "pending" && <><form action={reviewOwnerRequest} className="mt-8 space-y-5"><input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="decision" value="approve" /><label className="block font-semibold">Permanent slug<input name="slug" required minLength={3} maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" className={inputClass} /></label><p className="text-sm">Approval makes these business details public and grants this account owner access. Slugs cannot be changed.</p><div className="block font-semibold"><label htmlFor="request-verification-method">Verification method</label><select id="request-verification-method" name="method" required className={inputClass}><option value="">Choose a method</option><option value="in_person">In-person confirmation</option><option value="agreed_callback">Previously agreed owner callback</option></select></div><label className="flex items-start gap-3"><input name="verified" type="checkbox" required className="mt-1 h-5 w-5 shrink-0" /><span>I independently verified this account’s authority to control this business and its consent to publishing these details.</span></label><button className="button-primary">Approve verified shop</button></form><form action={reviewOwnerRequest} className="mt-8"><input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="decision" value="reject" /><button className="rounded-xl border border-stone-400 px-5 py-3">Reject request</button></form></>}
  </section>;
}
