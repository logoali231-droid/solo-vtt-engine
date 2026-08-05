// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import Google from "@auth/core/providers/google";
import { emailOtp } from "./auth/emailOtp";

// Google OAuth: credentials are read from the AUTH_GOOGLE_ID and
// AUTH_GOOGLE_SECRET environment variables (set via the project's API keys).
// The Google Cloud OAuth redirect URI must be
// `${CONVEX_SITE_URL}/api/auth/callback/google`.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [emailOtp, Anonymous, Google],
});