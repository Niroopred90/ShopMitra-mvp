export function parseOwnerSignup(form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 12 || password.length > 128) return { error: "Use a password between 12 and 128 characters." };
  if (password !== String(form.get("confirmPassword") ?? "")) return { error: "The passwords do not match." };
  return { email, password };
}

export function signupCallbackUrl() {
  try {
    const origin = new URL(process.env.SITE_URL ?? "");
    if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) return null;
    if (origin.protocol !== "https:" && !(origin.protocol === "http:" && ["127.0.0.1", "localhost"].includes(origin.hostname))) return null;
    return new URL("/owner/auth/callback", origin.origin).href;
  } catch { return null; }
}
