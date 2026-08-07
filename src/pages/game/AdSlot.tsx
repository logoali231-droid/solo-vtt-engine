import { AnimatePresence, motion } from "framer-motion";
import { Eye, Megaphone, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AdsSettings } from "@/lib/rpg/types";

/**
 * Screen-time ad unit ("Ad Refresh" model, like Freebuff).
 *
 * - A compact strip that sits on screen the whole session.
 * - While the player is actively playing, the slot refreshes every
 *   `refreshSeconds` (30–90s) → one long session yields many impressions.
 * - Refreshing only happens while the slot is actually visible
 *   (IntersectionObserver), so impressions are honest/viewable.
 *
 * Modes:
 *  - demo:    built-in themed sponsor cards — works with zero accounts.
 *  - adsense: Google AdSense slot (static; Google policy forbids forced refresh).
 *  - iframe:  any ad network display/iframe URL (PropellerAds, Venatus, Setupad…),
 *             auto-refreshed on the screen-time interval.
 *  - script:  paste any ad network's <script> tag (Adsterra, Monetag, PropellerAds…),
 *             executed safely in a dedicated slot and auto-refreshed while visible.
 */

const DEMO_ADS = [
  {
    icon: "🐉",
    title: "D&D Beyond",
    text: "Official digital tools for Dungeons & Dragons — character builder, dice & rulebooks.",
    tag: "Official digital tools",
  },
  {
    icon: "🎲",
    title: "Roll20",
    text: "Play the world's most popular virtual tabletop — free to start, browser-based.",
    tag: "Virtual tabletop",
  },
  {
    icon: "🗺️",
    title: "Inkarnate",
    text: "Craft gorgeous fantasy maps in minutes with the pro map-making tool.",
    tag: "Map maker",
  },
  {
    icon: "📚",
    title: "DriveThruRPG",
    text: "200,000+ tabletop PDFs — adventures, sourcebooks, miniatures & more.",
    tag: "RPG marketplace",
  },
  {
    icon: "⚔️",
    title: "Fantasy Grounds",
    text: "The ultimate VTT with deep automation for D&D 5e and dozens of systems.",
    tag: "Virtual tabletop",
  },
  {
    icon: "🧙",
    title: "Kobold Tools",
    text: "Encounter builders & NPC generators that cut your prep time in half.",
    tag: "DM tools",
  },
];

const STATS_KEY = "oraculum.adsStats.v1";
const AD_SENSE_SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Inject a raw ad-network HTML snippet (Adsterra/Monetag/PropellerAds-style tags)
 * into a container. Placeholder HTML is set first, then every <script> inside is
 * cloned as a real element so the network code actually executes.
 */
function injectAdTag(container: HTMLElement, html: string): void {
  container.innerHTML = html;
  const scripts = Array.from(container.querySelectorAll("script"));
  for (const old of scripts) {
    const fresh = document.createElement("script");
    for (const attr of Array.from(old.attributes)) {
      fresh.setAttribute(attr.name, attr.value);
    }
    fresh.textContent = old.textContent ?? "";
    old.replaceWith(fresh);
  }
}

export interface AdsStats {
  impressions: number;
  startedAt: number;
}

function readStatsRaw(): AdsStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { impressions: 0, startedAt: Date.now() };
    const parsed = JSON.parse(raw) as Partial<AdsStats>;
    return {
      impressions: typeof parsed.impressions === "number" ? parsed.impressions : 0,
      startedAt: typeof parsed.startedAt === "number" ? parsed.startedAt : Date.now(),
    };
  } catch {
    return { impressions: 0, startedAt: Date.now() };
  }
}

function bumpImpression(): void {
  try {
    const stats = readStatsRaw();
    localStorage.setItem(
      STATS_KEY,
      JSON.stringify({ impressions: stats.impressions + 1, startedAt: stats.startedAt }),
    );
  } catch {
    // storage unavailable — non-fatal
  }
}

/** Read the running session's impression/revenue stats (for the settings dialog). */
export function readAdsStats(): AdsStats {
  return readStatsRaw();
}

export function estimatedRevenue(stats: AdsStats, eCpm = 1.25): number {
  return (stats.impressions * eCpm) / 1000;
}

interface Props {
  settings: AdsSettings;
}

export default function AdSlot({ settings }: Props) {
  const [visible, setVisible] = useState(false);
  const [demoIdx, setDemoIdx] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [scriptKey, setScriptKey] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);
  const scriptSlotRef = useRef<HTMLDivElement>(null);
  const injectedRef = useRef<string | null>(null);
  const visibleRef = useRef(false);
  const countedRef = useRef(false);
  const settingsRef = useRef(settings);
  visibleRef.current = visible;
  settingsRef.current = settings;

  // Track real viewability — impressions only count while the strip is on screen.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting ?? false;
        setVisible(isVisible);
        if (isVisible && !countedRef.current) {
          countedRef.current = true;
          bumpImpression();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Screen-time refresh loop. AdSense is deliberately excluded: Google policy
  // forbids auto-refreshing standard AdSense units without approval.
  useEffect(() => {
    if (!settings.enabled || settings.provider === "adsense") return;
    const secs = Math.max(10, settings.refreshSeconds);
    const id = window.setInterval(() => {
      if (!visibleRef.current) return;
      if (settingsRef.current.provider === "demo") {
        setDemoIdx((i) => (i + 1) % DEMO_ADS.length);
      } else if (settingsRef.current.provider === "iframe") {
        setIframeKey((k) => k + 1);
      } else if (settingsRef.current.provider === "script") {
        setScriptKey((k) => k + 1);
      }
      bumpImpression();
    }, secs * 1000);
    return () => window.clearInterval(id);
  }, [settings.enabled, settings.provider, settings.refreshSeconds]);

  // Script-tag mode: (re)inject the network tag whenever it changes or refreshes.
  useEffect(() => {
    if (settings.provider !== "script" || !settings.adScript) return;
    const slot = scriptSlotRef.current;
    if (!slot) return;
    const key = `${settings.adScript}:${scriptKey}`;
    if (injectedRef.current === key) return;
    injectedRef.current = key;
    slot.innerHTML = "";
    injectAdTag(slot, settings.adScript);
  }, [settings.provider, settings.adScript, scriptKey]);

  // AdSense: inject the loader script once and push each slot render.
  useEffect(() => {
    if (settings.provider !== "adsense" || !settings.adsenseClient) return;
    if (!document.getElementById("oraculum-adsense-loader")) {
      const s = document.createElement("script");
      s.id = "oraculum-adsense-loader";
      s.async = true;
      s.src = `${AD_SENSE_SRC}?client=${encodeURIComponent(settings.adsenseClient)}`;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not ready — the slot fills on its own once loaded.
    }
  }, [settings.provider, settings.adsenseClient, settings.adsenseSlot]);

  if (!settings.enabled) return null;

  const isDemo = settings.provider === "demo";
  const isAdSense = settings.provider === "adsense";
  const isIframe = settings.provider === "iframe";
  const isScript = settings.provider === "script";
  const ad = DEMO_ADS[demoIdx];

  return (
    <div
      ref={hostRef}
      className="relative flex h-[64px] shrink-0 items-stretch overflow-hidden border-t border-slate-800/80 bg-slate-950/70 sm:h-[76px]"
      aria-label="Sponsored"
    >
      <div className="flex w-full items-center gap-3 px-3 py-2">
        <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
          <Megaphone className="size-3 text-amber-400/80" />
          Sponsored
        </span>

        <div className="min-w-0 flex-1">
          {isDemo && (
            <AnimatePresence mode="wait">
              <motion.a
                key={demoIdx}
                href="#"
                onClick={(e) => e.preventDefault()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="group flex min-w-0 items-center gap-3"
                title="Demo sponsor card — connect a real ad network in Settings"
              >
                <span className="text-2xl leading-none transition-transform duration-300 group-hover:scale-110">
                  {ad.icon}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-xs font-bold text-slate-200 group-hover:text-amber-300">
                      {ad.title}
                    </span>
                    <span className="hidden rounded-full bg-slate-900 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-slate-500 sm:inline">
                      {ad.tag}
                    </span>
                  </span>
                  <span className="block truncate text-[11px] text-slate-500">{ad.text}</span>
                </span>
              </motion.a>
            </AnimatePresence>
          )}

          {isAdSense && (
            <div className="flex min-h-[56px] items-center">
              {settings.adsenseClient && settings.adsenseSlot ? (
                <ins
                  className="adsbygoogle"
                  style={{ display: "block", width: "100%", minHeight: "56px" }}
                  data-ad-client={settings.adsenseClient}
                  data-ad-slot={settings.adsenseSlot}
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                />
              ) : (
                <p className="text-[11px] text-slate-500">
                  AdSense mode — paste your <span className="font-mono text-sky-300/80">ca-pub-…</span> client
                  and slot IDs in Settings. Slot stays static (Google policy).
                </p>
              )}
            </div>
          )}

          {isIframe && (
            <div className="flex h-full min-h-[56px] w-full items-center overflow-hidden">
              {settings.iframeUrl ? (
                <iframe
                  key={iframeKey}
                  title="Ad"
                  src={`${settings.iframeUrl}${settings.iframeUrl.includes("?") ? "&" : "?"}r=${iframeKey}`}
                  className="h-[60px] w-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  loading="eager"
                />
              ) : (
                <p className="text-[11px] text-slate-500">
                  iframe mode — paste any ad network's display URL in Settings. It auto-refreshes on
                  the screen-time interval.
                </p>
              )}
            </div>
          )}

          {isScript && (
            <div className="flex h-full min-h-[56px] w-full items-center overflow-hidden">
              {settings.adScript ? (
                <div ref={scriptSlotRef} className="flex min-h-[56px] w-full items-center justify-center" />
              ) : (
                <p className="text-[11px] text-slate-500">
                  Custom tag mode — paste an ad network's script snippet in Settings (Adsterra,
                  Monetag, PropellerAds…). It auto-refreshes on the screen-time interval.
                </p>
              )}
            </div>
          )}
        </div>

        <span className="hidden shrink-0 items-center gap-1.5 text-[10px] font-medium text-slate-600 sm:flex">
          {visible ? (
            <>
              <Eye className="size-3 text-emerald-500/70" />
              <span className="font-mono">{readStatsRaw().impressions} impressions</span>
            </>
          ) : (
            <ShieldCheck className="size-3" />
          )}
        </span>
      </div>
    </div>
  );
}
