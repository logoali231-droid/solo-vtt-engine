import { cn } from "@/lib/utils";
import type { DiceResult } from "@/lib/rpg/types";
import { formatMod } from "@/lib/rpg/dice";
import { Move, RefreshCw, Vibrate, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { isSfxMuted, toggleSfxMuted } from "@/lib/rpg/sfx";

const OUTCOME_STYLES: Record<DiceResult["outcome"], { label: string; cls: string }> = {
  "critical-success": { label: "CRITICAL SUCCESS", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
  success: { label: "SUCCESS", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  failure: { label: "FAILURE", cls: "bg-red-500/10 text-red-400 border-red-500/30" },
  "critical-failure": { label: "CRITICAL FAILURE", cls: "bg-red-500/15 text-red-300 border-red-500/40" },
};

/** Modifier chip colors — tinted by where the bonus comes from so the math
 *  reads at a glance (ability = sky, proficiency/tier = emerald, conditions =
 *  red, features = violet, equipment = amber). */
const MOD_CHIP_CLS: Record<string, string> = {
  ability: "bg-sky-500/10 text-sky-300 border-sky-500/25",
  proficiency: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  tier: "bg-teal-500/10 text-teal-300 border-teal-500/25",
  condition: "bg-red-500/10 text-red-300 border-red-500/25",
  feature: "bg-violet-500/10 text-violet-300 border-violet-500/25",
  equipment: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  other: "bg-slate-500/10 text-slate-300 border-slate-500/25",
};

const ADV_CHIP: Record<"adv" | "dis" | "both", { label: string; cls: string }> = {
  adv: { label: "⇡ ADVANTAGE", cls: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
  dis: { label: "⇣ DISADVANTAGE", cls: "bg-red-500/15 text-red-300 border-red-500/40" },
  both: { label: "⇡⇣ ADV + DIS", cls: "bg-slate-500/15 text-slate-300 border-slate-500/40" },
};

interface Props {
  result: DiceResult;
  onReroll?: () => void;
  /** Only the most recent dice card is gesture-interactive. History cards are
   *  read-only: without this, every card would attach gyro/shake listeners and
   *  a single shake would reroll the entire log at once. */
  live?: boolean;
}

/** iOS 13+ requires a one-time user gesture before `devicemotion` /
 *  `deviceorientation` fire at all. Android and desktop don't need it. */
function needsMotionPermission() {
  return (
    typeof window !== "undefined" &&
    typeof DeviceMotionEvent !== "undefined" &&
    typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission ===
      "function"
  );
}

/** Minimum fling speed (px per ms) for a drag release to count as a throw. */
const FLING_SPEED = 0.9;
const FLING_DISTANCE = 12;

export default function DiceCard({ result, onReroll, live = false }: Props) {
  const style = OUTCOME_STYLES[result.outcome];
  const total = result.total;
  const advChip =
    result.advantage && result.disadvantage
      ? ADV_CHIP.both
      : result.advantage
        ? ADV_CHIP.adv
        : result.disadvantage
          ? ADV_CHIP.dis
          : null;
  const dcLabel = result.system === "gurps" ? "target" : "DC";

  // The die that was actually kept: max with advantage, min with disadvantage,
  // otherwise the single rolled die. Used to dim the discarded die face.
  const kept =
    result.advantage && !result.disadvantage
      ? Math.max(...result.rolls)
      : result.disadvantage && !result.advantage
        ? Math.min(...result.rolls)
        : result.rolls[0];

  // -------------------------------------------------------------------------
  // Physical dice: motion permission (iOS) + gyro tilt + shake + fling
  // -------------------------------------------------------------------------

  // Sound on/off — persisted across sessions (see sfx.ts).
  const [muted, setMuted] = useState(isSfxMuted);

  const [motionState, setMotionState] = useState<"unknown" | "granted" | "denied">(() =>
    needsMotionPermission() ? "unknown" : "granted",
  );
  const requestMotion = async () => {
    try {
      const api = (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission;
      const res = await api.call(DeviceMotionEvent);
      setMotionState(res === "granted" ? "granted" : "denied");
    } catch {
      setMotionState("denied");
    }
  };

  // Gyroscope tilt (mobile) — gentle 3D lean of the dice
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!live || motionState !== "granted") return;
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return;
    const handler = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      setTilt({
        x: Math.max(-10, Math.min(10, (e.beta - 45) * 0.3)),
        y: Math.max(-12, Math.min(12, e.gamma * 0.4)),
      });
    };
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, [motionState, live]);

  // Shake-to-roll (mobile accelerometer — the same sensor family as a
  // speedometer: it measures proper acceleration along X/Y/Z)
  const lastShake = useRef(0);
  useEffect(() => {
    if (!live || !onReroll || motionState !== "granted") return;
    if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) return;
    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.abs(a.x ?? 0) + Math.abs(a.y ?? 0) + Math.abs(a.z ?? 0);
      const now = Date.now();
      if (mag > 32 && now - lastShake.current > 2500) {
        lastShake.current = now;
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(50);
        onReroll?.();
      }
    };
    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [onReroll, motionState, live]);

  // Fling-to-roll (mouse + touch) — grab the dice, drag, and release with
  // enough speed to "throw" them. Works on desktop, where there is no
  // accelerometer.
  const dragRef = useRef({ active: false, startX: 0, startY: 0, lastX: 0, lastY: 0, lastT: 0 });
  const [throwPos, setThrowPos] = useState({ x: 0, y: 0, dragging: false });

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!live || !onReroll) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const now = performance.now();
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      lastT: now,
    };
    setThrowPos({ x: 0, y: 0, dragging: true });
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.active) return;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.lastT = performance.now();
    setThrowPos({ x: e.clientX - d.startX, y: e.clientY - d.startY, dragging: true });
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    const now = performance.now();
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    const dist = Math.hypot(dx, dy);
    const speed = now - d.lastT > 0 ? dist / (now - d.lastT) : 0;
    setThrowPos({ x: 0, y: 0, dragging: false });
    if (speed > FLING_SPEED && dist > FLING_DISTANCE) {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(30);
      onReroll?.();
    }
  };
  const onPointerCancel = () => {
    dragRef.current.active = false;
    setThrowPos({ x: 0, y: 0, dragging: false });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/80 shadow-lg">
      <span className="sr-only">
        {result.label} — {result.diceNotation} — total {total} — {style.label}
      </span>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-slate-800 px-3 py-2">
        <p className="min-w-0 truncate text-xs font-semibold text-slate-200">{result.label}</p>
        <span className="flex flex-wrap items-center gap-1.5">
          {advChip && (
            <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-widest", advChip.cls)}>
              {advChip.label}
            </span>
          )}
          {(result.advSources?.length ?? 0) > 0 && (
            <span className="rounded-full border border-amber-500/25 bg-amber-500/5 px-2 py-0.5 text-[8px] font-medium text-amber-300/90">
              {result.advSources!.join(" · ")}
            </span>
          )}
          {(result.disSources?.length ?? 0) > 0 && (
            <span className="rounded-full border border-red-500/25 bg-red-500/5 px-2 py-0.5 text-[8px] font-medium text-red-300/90">
              {result.disSources!.join(" · ")}
            </span>
          )}
          {result.target !== undefined && (
            <span className="rounded-full border border-slate-600/60 bg-slate-800/80 px-2 py-0.5 text-[9px] font-bold tracking-widest text-slate-300">
              vs {dcLabel} {result.target}
            </span>
          )}
          <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-widest", style.cls)}>
            {style.label}
          </span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:flex-nowrap sm:gap-4">
        {/* Dice faces — 3D tumble + gyro tilt + grab-and-fling */}
        <div
          className="flex cursor-grab touch-none select-none flex-wrap items-center gap-1.5 active:cursor-grabbing"
          style={{
            transform: `translate(${throwPos.x}px, ${throwPos.y}px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: throwPos.dragging
              ? "none"
              : "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
            willChange: "transform",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          title={live && onReroll ? "Drag and fling the dice to roll" : undefined}
        >
          {(result.advantage || result.disadvantage) && result.rolls.length > 1 ? (
            <>
              <DieFace key={result.id} value={result.rolls[0]} dimmed={result.rolls[0] !== kept} />
              <span className="text-[10px] font-bold text-slate-500">{result.disadvantage ? "⇣" : "⇡"}</span>
              <DieFace key={`${result.id}-b`} value={result.rolls[1]} dimmed={result.rolls[1] !== kept} />
            </>
          ) : (
            result.rolls.map((r, i) => <DieFace key={`${result.id}-${i}`} value={r} />)
          )}
        </div>

        <div className="min-w-0 flex-1 break-words">
          <p className="font-mono text-[10px] text-slate-400">{result.diceNotation}</p>
          <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-slate-500">{result.breakdown}</p>
          {result.modifiers.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {result.modifiers.map((m, i) => (
                <span
                  key={`${result.id}-mod-${i}`}
                  className={cn(
                    "rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold",
                    MOD_CHIP_CLS[m.source] ?? MOD_CHIP_CLS.other,
                  )}
                >
                  {formatMod(m.value)} {m.label}
                </span>
              ))}
            </div>
          )}
          {result.featureUsed && (
            <p className="mt-1 inline-flex rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300">
              ✦ {result.featureUsed}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">total</p>
          <p className={cn("font-mono text-2xl font-bold leading-none", result.critical ? "text-amber-300" : "text-slate-100")}>
            {total}
          </p>
          {result.margin !== undefined && (
            <p className="mt-0.5 font-mono text-[10px] text-slate-400">
              margin {formatMod(result.margin)}
            </p>
          )}
        </div>
      </div>

      {onReroll && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-800 px-3 py-1.5">
          <span className="text-[9px] text-slate-600">Advantage / disadvantage follow the situation automatically.</span>
          {live && (
            <span className="hidden items-center gap-1 rounded px-1.5 py-0.5 text-[9px] text-slate-600 md:flex">
              <Move className="size-3" /> drag &amp; fling to roll
            </span>
          )}
          {live && (
            <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] text-slate-600 md:hidden">
              <Vibrate className="size-3" /> shake to roll
            </span>
          )}
          {live && motionState === "unknown" && (
            <button
              type="button"
              onClick={requestMotion}
              className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-300 transition-colors hover:bg-amber-500/20"
            >
              Enable shake-to-roll
            </button>
          )}
          <button
            type="button"
            onClick={() => setMuted(toggleSfxMuted())}
            title={muted ? "Unmute dice sounds" : "Mute dice sounds"}
            aria-label={muted ? "Unmute dice sounds" : "Mute dice sounds"}
            aria-pressed={muted}
            className={cn(
              "flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold transition-colors",
              muted ? "text-slate-600 hover:text-slate-400" : "text-slate-400 hover:text-slate-200",
            )}
          >
            {muted ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
            <span className="hidden sm:inline">{muted ? "sound off" : "sound on"}</span>
          </button>
          <button
            type="button"
            onClick={() => onReroll()}
            className="ml-auto flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          >
            <RefreshCw className="size-3" /> Roll again
          </button>
        </div>
      )}
    </div>
  );
}

function DieFace({
  value,
  dimmed,
}: {
  value: number;
  dimmed?: boolean;
}) {
  // The parent keys each face by rollKey, so a new roll remounts this face:
  // start rolling on mount and settle after the tumble animation duration.
  const [rolling, setRolling] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setRolling(false), 920);
    return () => clearTimeout(t);
  }, []);

  return (
    <span
      className={cn(
        "die3d flex size-9 items-center justify-center rounded-md border font-mono text-base font-bold",
        rolling && "die3d-rolling",
        dimmed
          ? "border-slate-700/60 text-slate-600"
          : value === 20
            ? "border-amber-400/70 bg-amber-400/15 text-amber-300"
            : value === 1
              ? "border-red-500/60 bg-red-500/10 text-red-400"
              : "border-slate-600 bg-slate-800 text-slate-100",
      )}
    >
      {value}
    </span>
  );
}
