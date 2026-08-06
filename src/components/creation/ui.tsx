import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ReactNode } from "react";

const CUSTOM = "__custom__";

export interface PickOption {
  value: string;
  label: string;
}

/** Canonical pick-list select with a "Custom…" fallback that reveals a text
 *  input. The GM reads exactly the chosen strings — no typos, no free-text
 *  interpretation. Custom mode is explicit state so an empty custom value
 *  still shows the input (not the dropdown). */
export function PickField({
  label,
  value,
  onChange,
  options,
  placeholder = "Choose…",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: PickOption[];
  placeholder?: string;
}) {
  // Explicit custom-mode state: once "Custom…" is chosen (or a persisted value
  // is off-list), the text input stays on screen even while the value is empty.
  const [custom, setCustom] = useState<boolean>(
    () => value !== "" && !options.some((o) => o.value === value),
  );
  const inList = options.some((o) => o.value === value);
  const customMode = custom || (value !== "" && !inList);

  const fieldCls =
    "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400">
          {label}
        </label>
        {customMode && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
            Custom
          </span>
        )}
      </div>
      {customMode ? (
        <div className="relative">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your own…"
            autoFocus
            className={cn(fieldCls, "border-amber-400 pr-10")}
          />
          <button
            type="button"
            title="Clear and pick from the list"
            onClick={() => {
              setCustom(false);
              onChange("");
            }}
            className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => {
              const next = e.target.value;
              if (next === CUSTOM) {
                setCustom(true);
                onChange("");
              } else {
                setCustom(false);
                onChange(next);
              }
            }}
            className={cn(fieldCls, "cursor-pointer appearance-none pr-8", value === "" && "text-stone-400")}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((o) => (
              <option key={o.value} value={o.value} className="text-stone-900">
                {o.label}
              </option>
            ))}
            <option value={CUSTOM} className="text-stone-900">
              Custom…
            </option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
        </div>
      )}
    </div>
  );
}

export interface ChoiceItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: "default" | "tcoe" | "phb" | "xgte";
}

export function ChoiceGrid({
  items,
  selected,
  onSelect,
  columns = 3,
}: {
  items: ChoiceItem[];
  selected?: string | null;
  onSelect: (id: string) => void;
  columns?: 2 | 3 | 4;
}) {
  const colClass = columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={cn("grid grid-cols-1 gap-3", colClass)}>
      {items.map((item) => {
        const active = selected === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "group relative rounded-xl border p-4 text-left transition-all duration-150",
              active
                ? "border-amber-600/60 bg-amber-50 shadow-[0_0_0_1px_rgba(180,120,40,0.35),0_8px_24px_-12px_rgba(150,100,30,0.35)]"
                : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm",
            )}
          >
            {active && (
              <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-amber-600 text-white">
                <Check className="size-3" strokeWidth={3} />
              </span>
            )}
            <div className="pr-6">
              <p className="text-sm font-semibold text-stone-900">{item.title}</p>
              {item.subtitle && (
                <p className="mt-1 text-xs leading-relaxed text-stone-500">{item.subtitle}</p>
              )}
            </div>
            {item.badge && (
              <span
                className={cn(
                  "mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                  item.badgeTone === "tcoe"
                    ? "bg-violet-100 text-violet-700"
                    : item.badgeTone === "xgte"
                      ? "bg-teal-100 text-teal-700"
                      : "bg-stone-100 text-stone-600",
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-stone-900">
          {title}
        </h2>
        {subtitle && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-500">{subtitle}</p>}
      </header>
      {children}
    </div>
  );
}

export function SectionLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">{children}</p>
      {hint && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  );
}

export function WizardFooter({
  canContinue,
  onBack,
  onContinue,
  isLast,
  continueLabel,
  lockLabel,
}: {
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
  isLast: boolean;
  continueLabel?: string;
  lockLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-stone-200 bg-white/70 px-6 py-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
      >
        <ChevronLeft className="size-4" /> Back
      </button>
      <div className="flex items-center gap-3">
        {!canContinue && (
          <p className="hidden text-xs text-stone-400 sm:block">Make a selection to continue</p>
        )}
        {isLast ? (
          <button
            type="button"
            disabled={!canContinue}
            onClick={onContinue}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {lockLabel ?? "Lock & Start Adventure"}
          </button>
        ) : (
          <button
            type="button"
            disabled={!canContinue}
            onClick={onContinue}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue <ChevronRight className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
