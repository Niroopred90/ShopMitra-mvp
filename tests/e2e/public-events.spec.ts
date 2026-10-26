import { expect, test } from "@playwright/test";

test("public event ingestion terminates a stalled body within five seconds", async () => {
  const abort = new AbortController();
  const safety = setTimeout(() => abort.abort(), 9000);
  const body = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new TextEncoder().encode('{"shopId":"')); },
  });
  const init: RequestInit & { duplex: "half" } = {
    method: "POST", duplex: "half", body, signal: abort.signal,
    headers: { Origin: "http://127.0.0.1:3000", "Content-Type": "application/json" },
  };
  try {
    const response = await fetch("http://127.0.0.1:3000/api/public-events", init);
    expect(response.status).toBe(408);
  } finally {
    clearTimeout(safety);
    abort.abort();
  }
});

test("public event ingestion rejects oversized bodies", async ({ request }) => {
  const response = await request.post("/api/public-events", {
    headers: { Origin: "http://127.0.0.1:3000", "Content-Type": "application/json" },
    data: "x".repeat(513),
  });
  expect(response.status()).toBe(413);
});
