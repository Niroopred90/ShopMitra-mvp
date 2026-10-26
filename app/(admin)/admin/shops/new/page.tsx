import Link from "next/link";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/admin";
import { ShopSetupForm } from "../form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up a shop", robots: { index: false, follow: false } };

export default async function NewShopPage() {
  await requireAdmin();
  return <section className="mx-auto max-w-2xl"><Link href="/admin" className="underline">Back to administration</Link><h1 className="mt-6 text-3xl font-bold">Set up a verified shop</h1><p className="mt-4 text-stone-600">Prepare a storefront and grant access only after independently verifying an existing owner account.</p><ShopSetupForm shopId={randomUUID()} requestId={randomUUID()} /></section>;
}
