"use client";

export default function StorefrontError({ reset }: { reset: () => void }) {
  return <section className="mx-auto max-w-2xl"><h1 className="text-3xl font-bold">Shop temporarily unavailable</h1><p className="mt-4">We couldn’t load the latest shop information.</p><button onClick={reset} className="mt-6 rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white">Try again</button></section>;
}
