# Owner self-signup setup

The new app flow is: create account → confirm email → submit one shop request → independent admin ownership verification → approved shop and owner access. Requests are private, and registration alone grants no shop membership. This feedback preview still requires fictional shop details and keeps live AI disabled.

Implementation validation: lint, types, production build, all 176 local database assertions, 13 Chromium owner/admin/onboarding checks, and 3 WebKit onboarding checks passed. Confirmation emails were delivered only to the local mail viewer. Hosted migration 008 is installed. The user committed/pushed the changes as `8159b12`, but Netlify blocked that deployment with an exposed-secrets scanning finding; its exact cause is not yet verified. The tracked working tree was checked for the actual private Supabase key and rate-limit secret; neither value was present. Do not disable scanning or assume the finding is harmless without reviewing the deploy log.

SMTP setup: Gmail custom SMTP is enabled at `smtp.gmail.com:587`, with sender name `ShopMitra Feedback`. The user entered the Google App Password directly and saved it; Supabase displayed “Successfully updated settings.” No SMTP password was read, copied into the repository, or sent through chat. Real external email delivery remains unverified. Public signup is still disabled until the updated deployment succeeds and a consenting tester verifies delivery.

## Email delivery prerequisite

Supabase's default email sender sends only to addresses belonging to project team members, so it cannot deliver confirmation emails to arbitrary testers. Use an SMTP provider and an authorized sender before enabling hosted signup. Do not invite testers into the Supabase organization as a workaround. Providers that require your own domain need DNS verification; Gmail SMTP can instead use the Gmail account as its sender for a small feedback test, subject to Google account eligibility and sending limits.

### Gmail option for small feedback tests

1. Use a Gmail account you control, preferably dedicated to feedback mail. In your Google Account, enable 2-Step Verification yourself if needed.
2. Open [Google App Passwords](https://myaccount.google.com/apppasswords), create an app password named `ShopMitra Feedback`, and keep it private. If the option is unavailable, account/security policy may prevent this method; use another supported SMTP provider instead. Do not weaken account protections to make it available.
3. In Supabase Authentication → Email → SMTP settings, enter the following directly and save:

   | Field | Value |
   | --- | --- |
   | Sender email | Your Gmail address |
   | Sender name | ShopMitra Feedback |
   | Host | `smtp.gmail.com` |
   | Port | `587` (TLS/STARTTLS) |
   | Username | The same Gmail address |
   | Password | The generated Google app password, not your normal Google password |

4. Keep confirmation enabled. Do not send a real test message to someone without their consent. Email delivery is still unverified until a tester registers and receives the confirmation.

Create and enter this new credential yourself; do not send it in chat. This grants Supabase the ability to send mail through that Google account. Revoke the app password when you retire the feedback deployment.

Google references: [Supabase Google SMTP setup](https://supabase.com/kb/troubleshooting/using-google-smtp-with-supabase-custom-smtp-ZZzU4Y), [Gmail SMTP protocol](https://developers.google.com/workspace/gmail/imap/imap-smtp), [Google app password help](https://support.google.com/mail/answer/185833).

### Provider and deployment checklist

1. Use an email service you control that supports SMTP. Confirm its free quota and sender requirements; do not enable paid billing without authorization. If it requires a domain, use a domain you already control. Domain purchase is a separate decision.
2. Verify the sender/domain with the provider's exact DNS records. Only the domain owner should apply them. Copy the provider's SMTP hostname, port, username, password, and allowed From address privately.
3. Open Supabase project `sstpxieasmnvvebplyvb` → Authentication → Email → SMTP settings. Enable custom SMTP and enter those values directly. Never put SMTP credentials in Git, the app's public variables, or chat.
4. Use a recognizable sender name such as `ShopMitra Feedback`. Keep email confirmation enabled and provider rate limits in place. Do not use autoconfirm to bypass email ownership verification.
5. Set Auth Site URL to `https://shopmartn.netlify.app` and add the exact redirect URL `https://shopmartn.netlify.app/owner/auth/callback`. The app uses the standard Supabase confirmation link and exchanges the returned PKCE code for a cookie session. Tell testers to open the link in the browser where they registered. If a different device confirms the email but cannot finish the session, they can return to sign-in.
6. After the app changes are manually committed/pushed and Netlify deployment passes, enable email signup in Supabase Auth. Migration 008 is already installed on the feedback project. No automatic email invitations or tester messages are sent during setup.
7. Have a consenting tester register themselves. Check delivery, confirmation, sign-in, pending-request privacy, independent approval, owner-only access, and offer publication/withdrawal. Do not claim SMTP delivery works before that real test.

The user handles commits and pushes. Hosted signup must remain disabled until these prerequisites are complete. Existing provisioned owner login continues to work while signup is being prepared.

## Review and approval

An existing private administrator reviews requests in `/admin`. Approval requires a permanent unique slug, a verification method, and an explicit confirmation of independently verified authority. Approval atomically creates a public shop, grants that confirmed account owner membership, and records the existing private setup audit event. Rejection grants no access. The preview supports one request per account; corrections and rejected requests are handled by the organizer.

Do not grant administrator access to ordinary testers. An administrator must be bootstrapped separately through a trusted operator; public signup never creates administrators.

Local signup is enabled with email confirmation through the local mail viewer. This does not configure a hosted SMTP sender or turn on hosted signup.

References: [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [password authentication](https://supabase.com/docs/guides/auth/passwords).
