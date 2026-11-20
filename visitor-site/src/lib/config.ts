// This visitor site is a fully separate app from the main Plantiful web app
// (which has sign-in, Explore, Species, Map, Records, etc.). A few links here
// point visitors to that app's public, no-login-required pages. Since the two
// apps run on their own servers, that base URL is configurable rather than
// hardcoded — set NEXT_PUBLIC_PLANTIFUL_APP_URL in production to wherever the
// main app is deployed. Defaults to the main app's local dev port.
export const PLANTIFUL_APP_URL =
  process.env.NEXT_PUBLIC_PLANTIFUL_APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";
