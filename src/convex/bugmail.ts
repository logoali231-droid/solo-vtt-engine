import { action } from "./_generated/server.js";
import { v } from "convex/values";

/**
 * Bug-report emailer.
 *
 * Sends the formatted report to the developer inbox via Resend
 * (https://resend.com). The API key lives server-side only:
 *
 *   RESEND_API_KEY   — required (set in the Keys/API keys UI; free at
 *                      resend.com/api-keys). While testing without a verified
 *                      domain, Resend allows sending FROM "onboarding@resend.dev".
 *   BUG_REPORT_FROM  — optional "from" address override (default above).
 */

const RESEND_API = "https://api.resend.com/emails";
const DEV_INBOX = "logoali231@gmail.com";

export const sendBugReport = action({
  args: {
    report: v.string(),
    subject: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<{ ok: boolean; detail: string }> => {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      return {
        ok: false,
        detail:
          "Emailing is not configured yet — add a free Resend API key as RESEND_API_KEY in the project's Keys/API keys tab (resend.com/api-keys), then submit again.",
      };
    }
    const from = process.env.BUG_REPORT_FROM ?? "onboarding@resend.dev";
    try {
      const res = await fetch(RESEND_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [DEV_INBOX],
          subject: args.subject ?? "🐛 Oraculum bug report",
          text: args.report,
        }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) {
        return { ok: false, detail: body?.message ? `Resend: ${body.message}` : `Resend error ${res.status}.` };
      }
      return { ok: true, detail: `Report emailed to ${DEV_INBOX}.` };
    } catch (err) {
      return { ok: false, detail: err instanceof Error ? err.message : "Network error sending email." };
    }
  },
});
