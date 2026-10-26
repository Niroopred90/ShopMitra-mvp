import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ShopMitra | Your neighborhood, connected", template: "%s | ShopMitra" },
  description: "A simple digital storefront for your neighborhood shop.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-5">
            <Link href="/" className="text-2xl font-extrabold tracking-tight text-emerald-900">ShopMitra<span className="text-orange-600">.</span></Link>
            <nav aria-label="Main navigation" className="flex gap-5 text-sm font-semibold">
              <Link href="/s/demo-shop">Demo shop</Link>
              <Link href="/owner">For owners</Link>
            </nav>
          </div>
        </header>
        <main id="main" className="mx-auto min-h-[75vh] max-w-5xl px-5 py-12">{children}</main>
        <footer className="mx-auto max-w-5xl border-t border-stone-200 px-5 py-6 text-sm text-stone-600">ShopMitra · Hyderabad pilot · Development preview</footer>
      </body>
    </html>
  );
}
