import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { BrandMark } from "@/components/brand-art";

export const metadata: Metadata = {
  title: { default: "ShopMitra | Your neighborhood, connected", template: "%s | ShopMitra" },
  description: "A simple digital storefront for your neighborhood shop.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <header className="site-header">
          <div className="site-nav">
            <Link href="/" className="brand"><BrandMark className="brand-mark" /><span>ShopMitra<span className="brand-dot">.</span></span></Link>
            <nav aria-label="Main navigation" className="nav-links">
              <Link href="/nearby">Nearby shops</Link>
              <Link href="/s/demo-shop">Demo shop</Link>
              <Link href="/owner" className="nav-owner">For owners <span aria-hidden="true">↗</span></Link>
            </nav>
          </div>
        </header>
        <main id="main" className="site-main">{children}</main>
        <footer className="site-footer"><div><Link href="/" className="footer-brand">ShopMitra.</Link><p>Small shops. Stronger neighborhoods.</p></div><p>Made for local · Hyderabad pilot<br /><span>Local development preview</span></p></footer>
      </body>
    </html>
  );
}
