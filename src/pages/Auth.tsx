import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import { useConvex } from "convex/react";
import logo from "@/assets/logo.svg";
import { ArrowRight, Loader2, Mail, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

// OAuth runs inside a popup and the user may take a while in Google's account
// picker, so give the flow a generous window before re-enabling the buttons.
const GOOGLE_FLOW_TIMEOUT_MS = 60000;

/** Key used to carry the post-OAuth destination across a full-page navigation
 *  back to the app root. Google sign-in's OAuth round-trip lands on the app's
 *  own origin (the backend's .convex.site domain never serves the SPA);
 *  Landing.tsx reads this stash to route to the intended screen once the
 *  session token is exchanged. */
export const OAUTH_RETURN_KEY = "oraculum.oauthReturn";

/** Map common OAuth errors to actionable guidance (credentials live in the
 *  project's API Keys tab — the client can't read them directly). */
function googleSignInHint(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (/client id|clientId|client secret|client_secret|missing credential|oauth_client/i.test(raw)) {
    return "Google sign-in isn't configured yet. Add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in the project's API Keys tab, and register <CONVEX_SITE_URL>/api/auth/callback/google as an authorized redirect URI in your Google Cloud OAuth client.";
  }
  if (/redirect_uri|redirect uri|invalid_request|origin/i.test(raw)) {
    return "Google rejected the sign-in request. Verify that <CONVEX_SITE_URL>/api/auth/callback/google is registered as an authorized redirect URI in your Google Cloud OAuth client.";
  }
  return raw
    ? `Google sign-in failed: ${raw}`
    : "Google sign-in failed. Please try again.";
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const convex = useConvex();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);
  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);

      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);

      setError("The verification code you entered is incorrect.");
      setIsLoading(false);

      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      setError(`Failed to sign in as guest: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);

    // The Freebuff host serves this app cross-origin-isolated (COEP:
    // require-corp), and Firefox blocks cross-origin top-level navigations to
    // targets that don't send a CORP header — which is exactly the case for
    // the Convex OAuth pages on *.convex.site (NS_ERROR_DOM_COEP_FAILED). So
    // instead of navigating this tab, we run the OAuth round-trip inside a
    // same-origin popup opened synchronously from the click (so popup blockers
    // allow it). The popup is a fresh browsing context, so it is not subject
    // to this page's COEP. Convex Auth stores the session in localStorage,
    // which the provider in THIS tab watches via storage events — when the
    // popup finishes, this tab authenticates and navigates to the destination.
    let popup: Window | null = null;
    try {
      popup = window.open(
        "",
        "oraculum_google_oauth",
        "popup,width=520,height=680",
      );
    } catch {
      popup = null;
    }

    // Watchdog so the button never spins forever if the user abandons the
    // popup without completing the sign-in.
    const watchdog = window.setTimeout(() => {
      setIsLoading(false);
      setError(
        "Google sign-in is taking a while. If the popup closed without completing, click again — or use the email code or guest options.",
      );
    }, GOOGLE_FLOW_TIMEOUT_MS);

    try {
      // Stash the real destination so the main tab continues into it once the
      // session token lands (the popup has its own per-tab sessionStorage).
      try {
        sessionStorage.setItem(OAUTH_RETURN_KEY, redirect);
      } catch {
        // storage unavailable — fall back to the default destination
      }

      // Request the OAuth authorize URL directly instead of the library's
      // signIn (which would navigate THIS tab). The backend redirect callback
      // (convex/auth.ts) allows the app's own absolute origin as the return
      // target, so the round-trip comes back to the app instead of the
      // backend's "No matching routes found" 404.
      const result = (await (
        convex as unknown as {
          action: (
            name: string,
            args: Record<string, unknown>,
          ) => Promise<{ redirect?: string; verifier?: string }>;
        }
      ).action("auth:signIn", {
        provider: "google",
        params: { redirectTo: `${window.location.origin}/` },
      })) as { redirect?: string; verifier?: string } | undefined;

      const oauthUrl = result?.redirect;
      if (!oauthUrl) {
        // Not an OAuth flow — the auth-state effect handles navigation.
        window.clearTimeout(watchdog);
        setIsLoading(false);
        return;
      }

      // Persist the PKCE verifier under the exact key the popup's
      // ConvexAuthProvider reads when it exchanges the ?code= session token.
      // The provider namespaces its storage by the client's address.
      try {
        const namespace = (convex as unknown as { address: string }).address.replace(
          /[^a-zA-Z0-9]/g,
          "",
        );
        localStorage.setItem(
          `__convexAuthOAuthVerifier_${namespace}`,
          result.verifier ?? "",
        );
      } catch {
        popup?.close();
        window.clearTimeout(watchdog);
        setIsLoading(false);
        setError(
          "Browser storage is unavailable, so Google sign-in can't complete here. Use the email code or guest options instead.",
        );
        return;
      }

      if (popup && !popup.closed) {
        // Navigate the popup through the handshake. When it finishes it writes
        // the session to localStorage; this tab's provider syncs it and the
        // auth-state effect below navigates to the destination.
        try {
          popup.location.href = oauthUrl;
        } catch {
          window.clearTimeout(watchdog);
          setIsLoading(false);
          setError(
            "Couldn't start the Google sign-in popup. Use the email code or guest options instead.",
          );
        }
        return;
      }

      // The popup was blocked (e.g. a sandboxed preview iframe). If this
      // document is NOT cross-origin-isolated, a plain top-level navigation
      // still works — use it as a last resort (Landing.tsx continues via the
      // stash once the session is established).
      if (!window.crossOriginIsolated) {
        window.location.href = oauthUrl;
        return;
      }

      window.clearTimeout(watchdog);
      setIsLoading(false);
      setError(
        "This embedded preview blocked the Google sign-in popup. Open the app in a full browser tab to sign in with Google, or use the email code or guest options here.",
      );
    } catch (error) {
      window.clearTimeout(watchdog);
      popup?.close();
      console.error("Google sign-in error:", error);
      setError(googleSignInHint(error));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">

      
      {/* Auth Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center justify-center h-full flex-col">
        <Card className="min-w-[350px] pb-0 border shadow-md">
          {step === "signIn" ? (
            <>
              <CardHeader className="text-center">
              <div className="flex justify-center">
                    <img
                      src={logo}
                      alt="Lock Icon"
                      width={64}
                      height={64}
                      className="rounded-lg mb-4 mt-4 cursor-pointer"
                      onClick={() => navigate("/")}
                    />
                  </div>
                <CardTitle className="text-xl">Get Started</CardTitle>
                <CardDescription>
                  Enter your email to log in or sign up
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSubmit}>
                <CardContent>
                  
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        name="email"
                        placeholder="name@example.com"
                        type="email"
                        className="pl-9"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      size="icon"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-500">{error}</p>
                  )}
                  
                  <div className="mt-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-4 hover:bg-muted/60 hover:border-foreground/20 transition-colors"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                    >
                      <GoogleIcon className="mr-2 h-4 w-4 shrink-0" />
                      Continue with Google
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full mt-2 text-muted-foreground hover:text-foreground"
                      onClick={handleGuestLogin}
                      disabled={isLoading}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Continue as Guest
                    </Button>
                  </div>
                </CardContent>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="text-center mt-4">
                <CardTitle>Check your email</CardTitle>
                <CardDescription>
                  We've sent a code to {step.email}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleOtpSubmit}>
                <CardContent className="pb-4">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />

                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                          // Find the closest form and submit it
                          const form = (e.target as HTMLElement).closest("form");
                          if (form) {
                            form.requestSubmit();
                          }
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-500 text-center">
                      {error}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Didn't receive a code?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => setStep("signIn")}
                    >
                      Try again
                    </Button>
                  </p>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify code
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("signIn")}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Use different email
                  </Button>
                </CardFooter>
              </form>
            </>
          )}

          <div className="py-4 px-6 text-xs text-center text-muted-foreground bg-muted border-t rounded-b-lg">
            Secured by{" "}
            <a
              href="https://freebuff.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary transition-colors"
            >
              freebuff.com
            </a>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
