import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseConfig } from "@/lib/supabase/config";

export const metadata = { title: "Administration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!supabaseConfig()) notFound();
  const { client } = await requireUser();
  const { data, error } = await client.rpc("current_user_is_admin");
  if (error || data !== true) notFound();
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-stone-200 bg-white p-8 md:p-12">
      <h1 className="text-3xl font-bold">Administration</h1>
      <p className="mt-4 text-stone-600">Administrator access verified. Moderation tools are coming in a later milestone.</p>
    </section>
  );
}
