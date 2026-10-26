import { NeighborhoodArt, SmallIcon } from "@/components/brand-art";
import { supabaseConfig } from "@/lib/supabase/config";
import { signIn } from "./actions";

export const metadata = { title: "Owner sign-in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = Boolean(supabaseConfig());
  return (
    <div className="login-layout"><aside className="login-story"><p className="page-eyebrow">A LITTLE MORE CONNECTED</p><h2>Your shop deserves<br />a place online.</h2><NeighborhoodArt /><p className="page-description">Create an offer. Review the details. Share something good with your neighborhood.</p></aside><section className="login-card">
      <p className="page-eyebrow"><SmallIcon kind="bag" /> Welcome back</p>
      <h1 className="page-title">Owner sign-in</h1>
      <p className="page-description">Sign in with your pilot account. Your shop must be verified before you can manage its offers.</p>
      {!configured ? <p className="mt-6 rounded-xl bg-stone-100 p-4">Sign-in is not configured yet. Please try again later.</p> : (
        <form action={signIn} className="mt-6 space-y-5">
          {error && <p role="alert" className="text-red-800">{error === "invalid" ? "Unable to sign in. Check your email and password." : "Sign-in is temporarily unavailable. Please try again."}</p>}
          <div><label htmlFor="email" className="block font-semibold">Email</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={254} className="mt-2 w-full rounded-lg border border-stone-400 p-3" /></div>
          <div><label htmlFor="password" className="block font-semibold">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={256} className="mt-2 w-full rounded-lg border border-stone-400 p-3" /></div>
          <button className="w-full rounded-xl bg-emerald-900 p-4 font-semibold text-white">Sign in</button>
        </form>
      )}
      <p className="login-note">Your shop. Your offers. Always reviewed by you before they go live.</p>
    </section></div>
  );
}
