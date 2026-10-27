"use client";

import { useActionState } from "react";
import { signUp, type SignupState } from "./actions";

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, {} as SignupState);
  const inputClass = "mt-2 block w-full rounded-lg border border-stone-400 p-3";
  return <form action={action} className="mt-6 space-y-5">
    {state.error && <p role="alert" className="text-red-800">{state.error}</p>}
    <label className="block font-semibold">Email<input name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass} /></label>
    <label className="block font-semibold">Password<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} aria-describedby="password-help" className={inputClass} /></label>
    <p id="password-help" className="text-sm text-stone-600">Use at least 12 characters and a password you don’t use elsewhere.</p>
    <label className="block font-semibold">Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className={inputClass} /></label>
    <button disabled={pending} className="w-full rounded-xl bg-emerald-900 p-4 font-semibold text-white disabled:opacity-60">{pending ? "Creating account…" : "Create owner account"}</button>
  </form>;
}
