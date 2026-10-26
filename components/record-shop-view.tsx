"use client";

import { useEffect } from "react";

export function RecordShopView({ shopId }: { shopId: string }) {
  useEffect(() => {
    // No cookies or visitor identifiers. Counts page displays, not scans, people, or sales.
    void fetch("/api/public-events", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shopId }),
      credentials: "omit", cache: "no-store", keepalive: true,
    }).catch(() => { /* Metrics must never interrupt browsing. */ });
  }, [shopId]);
  return null;
}
