import Link from "next/link";

export const metadata = { title: "Check your email", robots: { index: false, follow: false } };
export default function CheckEmailPage() {
  return <section className="login-card mx-auto max-w-xl"><h1 className="page-title">Check your email</h1><p className="page-description">If your registration is eligible, you’ll receive a confirmation link. Open it in the same browser where you registered, then sign in to request your shop.</p><p className="mt-5">Already confirmed, or opened the link on another device? Try signing in. If no email arrives, check spam or contact the feedback organizer before retrying.</p><Link href="/owner/login" className="button-primary mt-6">Return to sign-in</Link></section>;
}
