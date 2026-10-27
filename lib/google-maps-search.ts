export const businessCategories = {
  businesses: "Local businesses", grocery: "Grocery stores", bakery: "Bakeries", salon: "Salons", restaurant: "Restaurants",
} as const;

type SearchLocation = { mode: "pin"; pin: string } | { mode: "location"; latitude: number; longitude: number };

export function googleMapsSearchUrl(category: string, location: SearchLocation): string {
  if (!Object.hasOwn(businessCategories, category)) throw new Error("Choose a business category.");
  const business = businessCategories[category as keyof typeof businessCategories];
  let area: string;
  if (location.mode === "pin") {
    const pin = location.pin.trim();
    if (!/^[1-9]\d{5}$/.test(pin)) throw new Error("Enter a six-digit Indian PIN code, such as 500081.");
    area = `${pin}, India`;
  } else {
    if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)
      || location.latitude < -90 || location.latitude > 90 || location.longitude < -180 || location.longitude > 180) {
      throw new Error("Your location couldn’t be read. Try again or use a PIN code.");
    }
    area = `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
  }
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", `${business} near ${area}`);
  return url.href;
}
