import Link from "next/link";
import { SignupForm } from "./form";
import { supabaseConfig } from "@/lib/supabase/config";

export const metadata = { title: "Create owner account", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function SignupPage() {
  return <section className="login-card mx-auto max-w-xl"><p className="page-eyebrow">JOIN YOUR NEIGHBORHOOD</p><h1 className="page-title">Create owner account</h1><p className="page-description">Confirm your email, then request a shop. We’ll verify your ownership before you can publish offers. Please use fictional shop details during this feedback preview.</p>{supabaseConfig() ? <SignupForm /> : <p className="mt-6">Registration is temporarily unavailable.</p>}<p className="login-note">Already registered? <Link href="/owner/login" className="underline">Sign in</Link></p></section>;
}
