import { cn } from "@/lib/utils";
import type { DiceResult } from "@/lib/rpg/types";
import { formatMod } from "@/lib/rpg/dice";
import { RefreshCw, Vibrate } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const OUTCOME_STYLES: Record<DiceResult["outcome"], { label: string; cls: string }> = {
  "critical-success": { label: "CRITICAL SUCCESS", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
  success: { label: "SUCCESS", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  failure: { label: "FAILURE", cls: "bg-red-500/10 text-red-400 border-red-500/30" },
  "critical-failure": { label: "CRITICAL FAILURE", cls: "bg-red-500/15 text-red-300 border-red-500/40" },
};

interface Props {
  result: DiceResult;
  onReroll?: (opts: { advantage?: boolean; disadvantage?: boolean; dc?: number }) => void;
}

export default function DiceCard({ result, onReroll }: Props) {
  const style = OUTCOME_STYLES[result.outcome];
  const total = result.total;

  // Gyroscope tilt (mobile) — gentle 3D lean of the dice
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  useEffect(() => {
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
  }, []);

  // Shake-to-roll (mobile accelerometer)
  const lastShake = useRef(0);
  useEffect(() => {
    if (!onReroll || typeof window === "undefined" || !("DeviceMotionEvent" in window)) return;
    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.abs(a.x ?? 0) + Math.abs(a.y ?? 0) + Math.abs(a.z ?? 0);
      const now = Date.now();
      if (mag > 32 && now - lastShake.current > 2500) {
        lastShake.current = now;
        onReroll({});
      }
    };
    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [onReroll]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/80 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
        <p className="text-xs font-semibold text-slate-200">{result.label}</p>
        <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-widest", style.cls)}>
          {style.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:flex-nowrap sm:gap-4">
        {/* Dice faces — 3D tumble + gyro tilt */}
        <div
          className="flex flex-wrap items-center gap-1.5"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        >
          {(result.advantage || result.disadvantage) && result.rolls.length > 1 ? (
            <>
              <DieFace value={result.rolls[0]} dimmed={result.rolls[0] !== result.total} rollKey={result.id} />
              <span className="text-[10px] font-bold text-slate-500">{result.disadvantage ? "⇣" : "⇡"}</span>
              <DieFace value={result.rolls[1]} dimmed={result.rolls[1] !== result.total} rollKey={`${result.id}-b`} />
            </>
          ) : (
            result.rolls.map((r, i) => <DieFace key={i} value={r} rollKey={`${result.id}-${i}`} />)
          )}
        </div>

        <div className="min-w-0 flex-1 break-words">
          <p className="font-mono text-[10px] text-slate-400">{result.diceNotation}</p>
          <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-slate-500">{result.breakdown}</p>
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
        <div className="flex items-center gap-1.5 border-t border-slate-800 px-3 py-1.5">
          <button
            type="button"
            onClick={() => onReroll({ advantage: true })}
            className={cn(
              "rounded px-2 py-0.5 text-[10px] font-semibold transition-colors",
              result.advantage ? "bg-amber-500/20 text-amber-300" : "text-slate-500 hover:bg-slate-800 hover:text-slate-300",
            )}
          >
            ⇡ Advantage
          </button>
          <button
            type="button"
            onClick={() => onReroll({ disadvantage: true })}
            className={cn(
              "rounded px-2 py-0.5 text-[10px] font-semibold transition-colors",
              result.disadvantage ? "bg-red-500/20 text-red-300" : "text-slate-500 hover:bg-slate-800 hover:text-slate-300",
            )}
          >
            ⇣ Disadvantage
          </button>
          <button
            type="button"
            onClick={() => onReroll({})}
            className="ml-auto flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          >
            <RefreshCw className="size-3" /> Roll again
          </button>
          <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] text-slate-600 sm:hidden">
            <Vibrate className="size-3" /> shake to reroll
          </span>
        </div>
      )}
    </div>
  );
}

function DieFace({
  value,
  dimmed,
  rollKey,
}: {
  value: number;
  dimmed?: boolean;
  rollKey: string;
}) {
  const [rolling, setRolling] = useState(false);
  useEffect(() => {
    setRolling(true);
    const t = setTimeout(() => setRolling(false), 920);
    return () => clearTimeout(t);
  }, [rollKey]);

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
