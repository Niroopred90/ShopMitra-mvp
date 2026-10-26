"use client";

import Link, { useLinkStatus } from "next/link";

function Pending() {
  const { pending } = useLinkStatus();
  return pending ? <span role="status" className="ml-2 text-sm font-normal">Opening shop…</span> : null;
}

export function ShopLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  return <Link href={href} className={className}>{children}<Pending /></Link>;
}
