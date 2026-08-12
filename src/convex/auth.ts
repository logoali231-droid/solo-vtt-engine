// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import Google from "@auth/core/providers/google";
import { emailOtp } from "./auth/emailOtp";

/**
 * OAuth return-path guard (the documented `callbacks.redirect` hook).
 *
 * The deployed SPA is served from a Freebuff-managed origin, while Convex
 * Auth's OAuth handshake runs on the backend's `.convex.site` domain. By
 * default Convex Auth only redirects back to SITE_URL (relative redirectTo
 * values are resolved against it; absolute ones must share its origin), so a
 * Google sign-in would land the browser on the backend domain and hit
 * "No matching routes found". This keeps that default behaviour and
 * additionally allows the app's own origin via the AUTH_APP_ORIGIN
 * environment variable (set it in the project's Keys/API keys tab, e.g.
 * `https://my-app.example.com`). Anything else falls back to SITE_URL — never
 * an unlisted origin — so this can't be abused as an open redirect.
 */
function resolveRedirectTarget(redirectTo: string): string {
  const siteUrl = (process.env.SITE_URL ?? "").replace(/\/+$/, "");
  const appOrigin = (process.env.AUTH_APP_ORIGIN ?? "").replace(/\/+$/, "");
  if (redirectTo.startsWith("?") || redirectTo.startsWith("/")) {
    return redirectTo;
  }
  for (const origin of [siteUrl, appOrigin]) {
    if (
      origin &&
      (redirectTo === origin ||
        redirectTo.startsWith(`${origin}/`) ||
        redirectTo.startsWith(`${origin}?`))
    ) {
      return redirectTo;
    }
  }
  return siteUrl;
}

// Google OAuth: credentials are read from the AUTH_GOOGLE_ID and
// AUTH_GOOGLE_SECRET environment variables (set via the project's API keys).
// The Google Cloud OAuth redirect URI must be
// `${CONVEX_SITE_URL}/api/auth/callback/google`.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [emailOtp, Anonymous, Google],
  callbacks: {
    redirect: ({ redirectTo }) =>
      Promise.resolve(resolveRedirectTarget(redirectTo)),
  },
});
