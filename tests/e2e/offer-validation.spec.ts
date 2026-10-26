import { expect, test } from "@playwright/test";
import { offerDateInput, offerPayload } from "@/lib/offers";

function input(values: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ title: "Test offer", ...values })) form.set(key, value);
  return form;
}

test("rupee prices convert exactly to paise without float rounding", () => {
  expect(offerPayload(input({ price: "0.10" })).price_minor).toBe(10);
  expect(offerPayload(input({ price: "999999.99" })).price_minor).toBe(99_999_999);
  expect(() => offerPayload(input({ price: "1.005" }))).toThrow();
  expect(() => offerPayload(input({ price: "-1" }))).toThrow();
  expect(() => offerPayload(input({ price: "1000000.01" }))).toThrow();
});

test("date-only expiry is the next India midnight, exclusive", () => {
  const result = offerPayload(input({ start_date: "2028-02-29", end_date: "2028-02-29" }));
  expect(result.starts_at).toBe("2028-02-28T18:30:00.000Z");
  expect(result.expires_at).toBe("2028-02-29T18:30:00.000Z");
  expect(offerDateInput(result.expires_at, true)).toBe("2028-02-29");
  expect(() => offerPayload(input({ end_date: "2027-02-29" }))).toThrow();
  expect(() => offerPayload(input({ start_date: "2028-03-02", end_date: "2028-03-01" }))).toThrow();
});

test("quantity requires a matching unit and limited decimal precision", () => {
  expect(offerPayload(input({ quantity: "1.125", unit: "kg" })).quantity).toBe(1.125);
  expect(() => offerPayload(input({ quantity: "1" }))).toThrow();
  expect(() => offerPayload(input({ unit: "kg" }))).toThrow();
  expect(() => offerPayload(input({ quantity: "1.0001", unit: "kg" }))).toThrow();
});
