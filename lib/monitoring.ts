import "server-only";

// Deliberately accepts no request, payload, tokens, provider errors, or user identifiers.
export function logOperationalEvent(event: "storefront_read_failed" | "request_failed" | "health_read_failed") {
  console.error(JSON.stringify({ event, timestamp: new Date().toISOString() }));
}
