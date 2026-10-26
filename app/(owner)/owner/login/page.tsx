import { supabaseConfig } from "@/lib/supabase/config";
import { signIn } from "./actions";

export const metadata = { title: "Owner sign-in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = Boolean(supabaseConfig());
  return (
    <section className="mx-auto max-w-md rounded-3xl border border-stone-200 bg-white p-8">
      <h1 className="text-3xl font-bold">Owner sign-in</h1>
      <p className="mt-4 text-stone-600">Sign in with your pilot account. Your shop must be verified before you can manage its offers.</p>
      {!configured ? <p className="mt-6 rounded-xl bg-stone-100 p-4">Sign-in is not configured yet. Please try again later.</p> : (
        <form action={signIn} className="mt-6 space-y-5">
          {error && <p role="alert" className="text-red-800">{error === "invalid" ? "Unable to sign in. Check your email and password." : "Sign-in is temporarily unavailable. Please try again."}</p>}
          <div><label htmlFor="email" className="block font-semibold">Email</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={254} className="mt-2 w-full rounded-lg border border-stone-400 p-3" /></div>
          <div><label htmlFor="password" className="block font-semibold">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={256} className="mt-2 w-full rounded-lg border border-stone-400 p-3" /></div>
          <button className="w-full rounded-xl bg-emerald-900 p-4 font-semibold text-white">Sign in</button>
        </form>
      )}
    </section>
  );
}
