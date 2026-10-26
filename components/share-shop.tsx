"use client";

import { useState } from "react";

export function ShareShop({ name, url }: { name: string; url: string | null }) {
  const [message, setMessage] = useState("");
  async function share() {
    const link = url ?? window.location.href.split(/[?#]/)[0];
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url: link });
        setMessage("Shop shared.");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        setMessage("Shop link copied.");
      } else setMessage(`Copy this shop link: ${link}`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage(`Copy this shop link: ${link}`);
    }
  }
  return <div><button onClick={share} className="rounded-xl border border-stone-300 bg-white px-5 py-3 font-semibold">Share shop</button><p role="status" className="mt-2 break-all text-sm text-stone-600">{message}</p></div>;
}
