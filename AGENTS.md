# HOE Property Management - Agent Instructions

This file houses custom system prompt instructions and rules for the HOE Property Management platform. It is loaded automatically by the agent coding network to maintain session reliability, correct styling, and database integrity.

## Supabase Authentication & Memory Routing

*** SUPABASE AUTH & INTERNAL MEMORY PROTOCOL ***
1. SYSTEM RELIABILITY: You must ensure all authentication flows (Signup, Login, Password Reset, Email Verification) use the most up-to-date Vanilla JS Supabase Auth API (`sbClient.auth`). 
2. PASSWORD RESETS: Always implement password resets using a two-step flow.
   Step 1: `sbClient.auth.resetPasswordForEmail(email, { redirectTo: 'https://hoepropertymanagement.co.uk/update-password.html' })`
   Step 2: On the update page, intercept the session and use `sbClient.auth.updateUser({ password: newPassword })`.
3. EMAIL VERIFICATION: Ensure Resend is properly hooked up in the Supabase dashboard. The frontend must always listen for the `onAuthStateChange` event to capture users returning from email verification links before granting them access to the Landlord or Tenant portals.
4. AUDIT RULE: Before generating any frontend dashboard code, silently verify that the code checks if the user's session is active and verified. Do not allow bypassed logins.

## Aesthetic & Role Framework
1. **Dark Plum Theme & Luxury Gold Branding**: Use deep violet/plum shades (`#1a0b2e`) combined with our prominent gold accents (`#D4AF37` / `#c299ff`) for modern elegance.
2. **Double Role Selection Flow**: Users can be verified as a Tenant, Landlord, or Both. Dual access users land automatically on the Gateway Selection dashboard path (`/dashboard`) while single roles filter to their respective pages directly.
3. **No Overwrites Protection**: Retain profile picture and key details inside auth synchronization databases (Firestore & Supabase) to guarantee custom edits do not reset.
