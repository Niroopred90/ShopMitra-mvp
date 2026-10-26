import Link from "next/link";
import { notFound } from "next/navigation";
import { discoveryClient, uuid } from "@/lib/discovery";
import { ingestionClient } from "@/lib/public-ingestion";
import { ReportForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Report an offer", robots: { index: false, follow: false } };

export default async function ReportPage({ params }: { params: Promise<{ "offer-id": string }> }) {
  const id = (await params)["offer-id"];
  if (!uuid(id)) notFound();
  const client = discoveryClient();
  if (!client) return <p>Reporting is temporarily unavailable. Please try again later.</p>;
  const { data: offer, error } = await client.from("public_offers").select("id, title, shop_id").eq("id", id).maybeSingle();
  if (error) return <p>Reporting is temporarily unavailable. Please try again later.</p>;
  if (!offer?.id) notFound();
  const { data: shop } = await client.from("public_shops").select("slug").eq("id", offer.shop_id!).maybeSingle();
  return <section className="mx-auto max-w-xl"><h1 className="text-3xl font-bold">Report an offer</h1><p className="mt-4 text-lg">{offer.title}</p><p className="mt-3 text-stone-600">Choose an issue for the pilot team to review. No name or contact details are collected.</p>{ingestionClient() ? <ReportForm offerId={id} /> : <p className="mt-6">Reporting is temporarily unavailable. Please try again later.</p>}{shop?.slug && <Link href={`/s/${shop.slug}`} className="mt-6 inline-block underline">Back to shop</Link>}</section>;
}
