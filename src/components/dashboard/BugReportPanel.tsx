import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { listAdventures } from "@/lib/rpg/storage";
import { serializeAdventure } from "@/lib/rpg/serializer";
import type { AdventureRecord } from "@/lib/rpg/types";
import {
  Bug,
  Check,
  ClipboardCopy,
  Download,
  FileWarning,
  History,
  Loader2,
  Mail,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

/** Where emailed reports land. */
const DEV_INBOX = "logoali231@gmail.com";

/* ------------------------------------------------------------------------- */
/* Constants — the pick lists for each field                                 */
/* ------------------------------------------------------------------------- */

const AREAS = [
  { id: "wizard", label: "Character Creation Wizard" },
  { id: "setup", label: "Adventure Setup" },
  { id: "dice", label: "Dice Engine / Rolls" },
  { id: "sheet", label: "Character Sheet" },
  { id: "combat", label: "Combat / Enemies" },
  { id: "ai", label: "AI GM / Narration" },
  { id: "companion", label: "Companions" },
  { id: "conditions", label: "Conditions" },
  { id: "gear", label: "Gear / Inventory" },
  { id: "lorebook", label: "Lorebook" },
  { id: "settings", label: "Settings / AI Models" },
  { id: "dashboard", label: "Dashboard / Tabs" },
  { id: "pwa", label: "Install / PWA / Mobile" },
  { id: "other", label: "Something else" },
] as const;

const SYSTEMS = [
  { id: "dnd5e", label: "D&D 5e" },
  { id: "pf2e", label: "Pathfinder 2e" },
  { id: "gurps", label: "GURPS" },
  { id: "all", label: "All / not system-specific" },
] as const;

const SEVERITIES = [
  { id: "critical", label: "Critical", hint: "Blocks the game — can't continue", cls: "border-red-300 bg-red-50 text-red-700" },
  { id: "major", label: "Major", hint: "A core feature is broken", cls: "border-orange-300 bg-orange-50 text-orange-700" },
  { id: "minor", label: "Minor", hint: "Annoying, but a workaround exists", cls: "border-amber-300 bg-amber-50 text-amber-700" },
  { id: "cosmetic", label: "Cosmetic", hint: "Visual or wording only", cls: "border-stone-300 bg-stone-50 text-stone-600" },
] as const;

const FREQUENCIES = ["Always", "Often", "Sometimes", "Once", "Not sure"] as const;

const HISTORY_KEY = "oraculum.bugreports";

interface Report {
  id: string;
  createdAt: number;
  area: string;
  system: string;
  severity: string;
  frequency: string;
  what: string;
  expected: string;
  steps: string;
  device: string;
  sessionLabel: string;
  report: string;
}

/* ------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* ------------------------------------------------------------------------- */

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Auto-detect browser / OS / screen for the report's "device" field. */
function detectEnvironment(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  const parts: string[] = [];
  if (/iPhone|iPad|iPod/i.test(ua)) parts.push("iOS");
  else if (/Android/i.test(ua)) parts.push("Android");
  else if (/Macintosh|Mac OS X/i.test(ua)) parts.push("macOS");
  else if (/Windows/i.test(ua)) parts.push("Windows");
  else if (/Linux/i.test(ua)) parts.push("Linux");
  else parts.push("Unknown OS");
  if (/Edg\//.test(ua)) parts.push("Edge");
  else if (/Firefox\//.test(ua)) parts.push("Firefox");
  else if (/Chrome\//.test(ua)) parts.push("Chrome");
  else if (/Safari\//.test(ua)) parts.push("Safari");
  else if (/Chromium/.test(ua)) parts.push("Chromium");
  parts.push(`${window.innerWidth}×${window.innerHeight}`);
  parts.push(navigator.onLine ? "online" : "offline");
  return parts.join(" · ");
}

function loadHistory(): Report[] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(HISTORY_KEY) : null;
    return raw ? (JSON.parse(raw) as Report[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(reports: Report[]): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(HISTORY_KEY, JSON.stringify(reports));
  } catch {
    /* storage full/unavailable — in-memory only */
  }
}

function systemLabel(id: string): string {
  return SYSTEMS.find((s) => s.id === id)?.label ?? id;
}

/** Build a clean, paste-anywhere (GitHub-issue friendly) report body. */
function buildReport(f: {
  area: string;
  system: string;
  severity: string;
  frequency: string;
  what: string;
  expected: string;
  steps: string;
  device: string;
  session?: AdventureRecord;
}): string {
  const lines: string[] = [];
  lines.push("🐛 Bug report — Oraculum (Solo Tabletop VTT)");
  lines.push("=".repeat(48));
  lines.push(`Area:       ${f.area}`);
  lines.push(`System:     ${systemLabel(f.system)}`);
  lines.push(`Severity:   ${f.severity}`);
  lines.push(`Frequency:  ${f.frequency}`);
  lines.push(`Device:     ${f.device}`);
  lines.push(`Reported:   ${new Date().toLocaleString()}`);
  lines.push("=".repeat(48));
  lines.push("");
  lines.push("## What happened");
  lines.push(f.what.trim() || "(not provided)");
  lines.push("");
  lines.push("## Expected behavior");
  lines.push(f.expected.trim() || "(not provided)");
  lines.push("");
  lines.push("## Steps to reproduce");
  const steps = f.steps
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (steps.length === 0) {
    lines.push("(not provided)");
  } else {
    steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  }
  lines.push("");
  if (f.session) {
    lines.push("## Attached session");
    lines.push(`Campaign: ${f.session.label} · ${f.session.character.name} (${systemLabel(f.session.system)})`);
    lines.push("```json");
    lines.push(JSON.stringify(serializeAdventure(f.session.adventure)));
    lines.push("```");
  } else {
    lines.push("## Attached session");
    lines.push("(none)");
  }
  return lines.join("\n");
}

/* ------------------------------------------------------------------------- */
/* Panel                                                                      */
/* ------------------------------------------------------------------------- */

export default function BugReportPanel() {
  const adventures = useMemo(() => listAdventures(), []);
  const [device] = useState(detectEnvironment);

  const [area, setArea] = useState<string>("");
  const [system, setSystem] = useState<string>("dnd5e");
  const [severity, setSeverity] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("");
  const [what, setWhat] = useState("");
  const [expected, setExpected] = useState("");
  const [steps, setSteps] = useState("");
  const [deviceOverride, setDeviceOverride] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [error, setError] = useState("");

  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<Report[]>(() => loadHistory());
  const [saving, setSaving] = useState(false);

  // Email bridge — sends the report to the developer inbox via Resend
  // (see src/convex/bugmail.ts; key: RESEND_API_KEY in Keys/API keys).
  const sendEmail = useAction(api.bugmail.sendBugReport);
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailDetail, setEmailDetail] = useState("");

  const emailReport = async (text: string) => {
    setEmailState("sending");
    try {
      const res = await sendEmail({ report: text });
      if (res.ok) {
        setEmailState("sent");
        toast.success(`Bug report emailed to ${DEV_INBOX}.`);
      } else {
        setEmailState("error");
        setEmailDetail(res.detail);
        toast.error(res.detail);
      }
    } catch (err) {
      setEmailState("error");
      const msg = err instanceof Error ? err.message.slice(0, 200) : "Could not send email.";
      setEmailDetail(msg);
      toast.error(msg);
    }
  };

  const session = adventures.find((a) => a.id === sessionId) ?? undefined;

  const resetForm = () => {
    setArea("");
    setSystem("dnd5e");
    setSeverity("");
    setFrequency("");
    setWhat("");
    setExpected("");
    setSteps("");
    setDeviceOverride("");
    setSessionId("");
    setError("");
    setPreview(null);
    setCopied(false);
    setEmailState("idle");
    setEmailDetail("");
  };

  const handleSubmit = () => {
    // The only hard requirements: where it happened and what happened.
    if (!area) return setError("Pick the area where the bug happened.");
    if (!what.trim()) return setError("Describe what happened — the more detail, the better.");
    setError("");

    const report = buildReport({
      area: AREAS.find((a) => a.id === area)?.label ?? area,
      system,
      severity: severity ? SEVERITIES.find((s) => s.id === severity)!.label : "Not specified",
      frequency: frequency || "Not specified",
      what,
      expected,
      steps,
      device: deviceOverride.trim() || device,
      session,
    });

    const entry: Report = {
      id: uid(),
      createdAt: Date.now(),
      area,
      system,
      severity,
      frequency,
      what,
      expected,
      steps,
      device: deviceOverride.trim() || device,
      sessionLabel: session ? session.label : "",
      report,
    };

    setSaving(true);
    // Small delay so the button shows a beat of feedback.
    setTimeout(() => {
      const next = [entry, ...history].slice(0, 12);
      setHistory(next);
      saveHistory(next);
      setPreview(report);
      setSaving(false);
      toast.success("Bug report saved to this browser.");
      // Automatically email the report to the developer inbox.
      void emailReport(report);
    }, 350);
  };

  const copyPreview = async () => {
    if (!preview) return;
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      toast.success("Report copied to clipboard.");
    } catch {
      // Fallback for older browsers / non-secure contexts.
      const ta = document.createElement("textarea");
      ta.value = preview;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast.success("Report copied to clipboard.");
    }
  };

  const downloadPreview = () => {
    if (!preview) return;
    const blob = new Blob([preview], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oraculum-bug-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded.");
  };

  const removeReport = (id: string) => {
    const next = history.filter((r) => r.id !== id);
    setHistory(next);
    saveHistory(next);
    if (preview && next.length > 0) setPreview(null);
  };

  const label = (id: string, kind: "area" | "severity"): string => {
    const table = kind === "area" ? AREAS : SEVERITIES;
    return table.find((t) => t.id === id)?.label ?? id;
  };

  const inputCls =
    "w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,1.1fr)]">
      {/* ---------------------------------------------------------------- */}
      {/* Form column                                                       */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col gap-5">
        {/* Area */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Where did it happen?
          </p>
          <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {AREAS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setArea(a.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs font-semibold transition-colors",
                  area === a.id
                    ? "border-stone-900 bg-stone-900 text-amber-300"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50",
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full border text-[9px]",
                    area === a.id ? "border-amber-400 text-amber-300" : "border-stone-300 text-transparent",
                  )}
                >
                  ✓
                </span>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* System + severity + frequency */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Game system</p>
            <select value={system} onChange={(e) => setSystem(e.target.value)} className={cn(inputCls, "mt-2")}>
              {SYSTEMS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">How often?</p>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={cn(inputCls, "mt-2")}>
              <option value="">Pick one…</option>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Severity</p>
            <div className="mt-2 flex flex-col gap-1">
              {SEVERITIES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeverity(s.id)}
                  title={s.hint}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-left text-xs font-semibold transition-all",
                    severity === s.id ? cn(s.cls, "ring-2 ring-amber-500/40") : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Behavior fields */}
        <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              What happened? <span className="text-red-400">*</span>
            </label>
            <textarea
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              rows={3}
              placeholder="Describe the bug behavior — what you saw, what the dice/sheet/AI did wrong…"
              className={cn(inputCls, "mt-1.5 resize-y")}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">What should have happened?</label>
            <textarea
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              rows={2}
              placeholder="What did you expect instead?"
              className={cn(inputCls, "mt-1.5 resize-y")}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Steps to reproduce</label>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              rows={3}
              placeholder={"One step per line, e.g.\n1. Attack with advantage as a hidden rogue\n2. The dice card shows…"}
              className={cn(inputCls, "mt-1.5 resize-y")}
            />
          </div>
        </div>

        {/* Device + session */}
        <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Device & browser</label>
            <input
              value={deviceOverride}
              onChange={(e) => setDeviceOverride(e.target.value)}
              placeholder={`Auto-detected: ${device}`}
              className={cn(inputCls, "mt-1.5")}
            />
            <p className="mt-1 text-[10px] text-stone-400">Leave blank to use the auto-detected environment.</p>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Attach a saved session</label>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className={cn(inputCls, "mt-1.5")}
            >
              <option value="">None — just describe the bug</option>
              {adventures.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} · {a.character.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-stone-400">
              Embeds the full serialized campaign (character, log, rolls) so the developer can reproduce it.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
            <FileWarning className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-bold text-amber-300 transition-colors hover:bg-stone-800 disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Generate report
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-800"
          >
            <RotateCcw className="size-3.5" />
            Clear
          </button>
          <p className="w-full text-[11px] text-stone-400 sm:w-auto sm:max-w-sm">
            Submitting also emails the report to {DEV_INBOX} automatically.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Output column — preview + history                                */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex min-w-0 flex-col gap-5">
        {preview ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Generated report</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => preview && emailReport(preview)}
                  disabled={emailState === "sending"}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50",
                    emailState === "sent"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : emailState === "error"
                        ? "border-red-300 bg-red-50 text-red-600"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900",
                  )}
                >
                  {emailState === "sending" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : emailState === "sent" ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Mail className="size-3.5" />
                  )}
                  {emailState === "sending" ? "Sending…" : emailState === "sent" ? "Emailed" : "Email to developer"}
                </button>
                <button
                  type="button"
                  onClick={copyPreview}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
                >
                  {copied ? <Check className="size-3.5 text-emerald-500" /> : <ClipboardCopy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={downloadPreview}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
                >
                  <Download className="size-3.5" />
                  Download .txt
                </button>
              </div>
            </div>
            {emailState === "sent" && (
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                <Check className="size-3.5" />
                Report emailed to {DEV_INBOX}.
              </p>
            )}
            {emailState === "error" && emailDetail && (
              <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium leading-relaxed text-red-600">
                <FileWarning className="mt-0.5 size-3.5 shrink-0" />
                <span>{emailDetail}</span>
              </p>
            )}
            <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-stone-200 bg-stone-50 p-4 font-mono text-[11px] leading-relaxed text-stone-700">
              {preview}
            </pre>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white/50 p-10 text-center">
            <Bug className="size-7 text-stone-300" />
            <p className="text-sm font-bold text-stone-700">No report yet</p>
            <p className="max-w-xs text-xs leading-relaxed text-stone-400">
              Fill in the form and hit “Generate report” — the full, formatted report appears here, ready to copy or download.
            </p>
          </div>
        )}

        {history.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
              <History className="size-3.5" />
              Past reports ({history.length})
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {history.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5"
                >
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                      r.severity === "critical"
                        ? "bg-red-100 text-red-600"
                        : r.severity === "major"
                          ? "bg-orange-100 text-orange-600"
                          : r.severity === "minor"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-stone-100 text-stone-500",
                    )}
                  >
                    {label(r.severity, "severity")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-stone-800">
                      {label(r.area, "area")}
                      {r.sessionLabel && <span className="ml-1.5 font-normal text-stone-400">· {r.sessionLabel}</span>}
                    </p>
                    <p className="truncate text-[11px] text-stone-400">
                      {r.what.slice(0, 90)}
                      {r.what.length > 90 ? "…" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreview(r.report)}
                      className="rounded-md px-2 py-1 text-[10px] font-bold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => removeReport(r.id)}
                      title="Delete report"
                      aria-label="Delete report"
                      className="flex size-7 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
