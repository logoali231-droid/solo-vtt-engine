import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Dices,
  FlaskConical,
  Languages,
  Lock,
  Shield,
  Sparkles,
  Swords,
  Wand2,
} from "lucide-react";
import { Link } from "react-router";

const SYSTEMS = [
  {
    icon: Dices,
    name: "Dungeons & Dragons 5e",
    accent: "text-red-700 bg-red-50 ring-red-100",
    points: ["Full core database + Tasha's Cauldron", "Artificer & all TCoE subclasses", "Advantage, DCs, spell slots & infusions"],
  },
  {
    icon: Shield,
    name: "Pathfinder 2e",
    accent: "text-teal-700 bg-teal-50 ring-teal-100",
    points: ["Three-action economy tracker", "T / E / M / L proficiency ranks", "Four degrees of success"],
  },
  {
    icon: FlaskConical,
    name: "GURPS 4e",
    accent: "text-amber-700 bg-amber-50 ring-amber-100",
    points: ["100-point attribute budgeting", "3d6 bell-curve resolution", "Margin of success & DR"],
  },
];

const PHASES = [
  {
    step: "Phase 01",
    title: "Character Creation",
    body: "A guided wizard with a strict 27-point buy or standard array, Tasha's Custom Origin ancestry, every class including Artificer, and the TCoE subclass catalog.",
    icon: Wand2,
  },
  {
    step: "Phase 02",
    title: "Solo Game Dashboard",
    body: "A dark-mode VTT morphs around your choices — a parchment 5e sheet, a PF2e tech grid, or a GURPS point ledger — all wired to a live dice engine.",
    icon: Swords,
  },
];

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Stochastic Rule Enforcer",
    body: "Click any ability, save or skill and the engine resolves the exact rule-compliant math — d20 + modifiers vs DC, 3d6 under target, or the PF2e success matrix.",
  },
  {
    icon: Languages,
    title: "Three Rulesets, One Engine",
    body: "Switch systems in the wizard and the whole pipeline — sheet, dice math and quick actions — rebuilds around the chosen ruleset.",
  },
  {
    icon: BookOpen,
    title: "Game Master, Local or Live",
    body: "An offline rule-aware narrator runs solo sessions with zero keys. Flip to Live GM to stream the session to an OpenAI completion endpoint.",
  },
  {
    icon: Lock,
    title: "Strict JSON API Layer",
    body: "Your character sheet — subclass data, modifiers and dice logs included — serializes into a versioned JSON payload for any LLM endpoint.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f7f5f0] text-stone-900">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-[#f7f5f0]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-stone-900 text-amber-400">
              <Dices className="size-5" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold leading-none tracking-tight">Oraculum</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                Solo TTRPG Engine
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium text-stone-600 md:flex">
            <a href="#systems" className="transition-colors hover:text-stone-900">Systems</a>
            <a href="#how" className="transition-colors hover:text-stone-900">How it works</a>
            <a href="#engine" className="transition-colors hover:text-stone-900">The engine</a>
          </nav>
          <Link
            to="/auth?returnTo=/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-700"
          >
            Enter the table <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(190,140,60,0.14),transparent)]" />
        <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              <Sparkles className="size-3.5" /> D&D 5e · Pathfinder 2e · GURPS
            </span>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Your solo adventures,
              <br />
              <span className="text-amber-700">by the rules.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-stone-600">
              Oraculum is a two-phase tabletop engine: craft a deep character with Tasha's
              Cauldron options, then play out a living solo campaign on a dark VTT where every
              click rolls the exact dice the rules demand.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/auth?returnTo=/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-700 hover:shadow-md"
              >
                Start your adventure <ArrowRight className="size-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-400"
              >
                See the two phases
              </a>
            </div>
            <p className="mt-4 text-xs text-stone-400">
              Free to play · No card required · Guest sign-in available
            </p>
          </motion.div>

          {/* Hero visual — dice card mock */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="relative rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_24px_60px_-24px_rgba(60,40,10,0.25)]">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-semibold">Sneak Attack vs AC 15</p>
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-widest text-emerald-700">
                  SUCCESS
                </span>
              </div>
              <div className="mt-4 flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="flex size-11 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 font-mono text-lg font-bold text-amber-800">
                    17
                  </span>
                  <span className="text-[10px] font-bold text-stone-400">⇡</span>
                  <span className="flex size-11 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 font-mono text-lg font-bold text-stone-400">
                    8
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] text-stone-400">2d20kh + 5 (Dex) + 2 (Prof)</p>
                  <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-stone-500">
                    17 + 7 = 24 vs DC 15 → SUCCESS
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400">total</p>
                  <p className="font-mono text-3xl font-bold text-stone-900">24</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 border-t border-stone-100 pt-3">
                <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500">⇡ Advantage</span>
                <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500">⇣ Disadvantage</span>
                <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                  ✦ Sneak Attack +2d6
                </span>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 hidden rotate-[-4deg] rounded-xl border border-stone-200 bg-[#f3e9d1] px-4 py-3 shadow-lg sm:block">
              <p className="font-display text-xs font-bold text-[#3b2f1b]">Artificer / Battle Smith</p>
              <p className="font-mono text-[10px] text-[#7a6436]">Flash of Genius · +4 to saves</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Systems */}
      <section id="systems" className="border-t border-stone-200/70 bg-white/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-amber-700">One engine, three rulebooks</p>
          <h2 className="mt-3 text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Pick your system. The engine rebuilds around it.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {SYSTEMS.map((s) => (
              <div key={s.name} className="rounded-2xl border border-stone-200 bg-white p-6 transition-shadow hover:shadow-lg">
                <div className={`inline-flex size-11 items-center justify-center rounded-xl ring-4 ${s.accent}`}>
                  <s.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{s.name}</h3>
                <ul className="mt-3 space-y-2">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-stone-600">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two phases */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-amber-700">The two-phase state machine</p>
          <h2 className="mt-3 text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Create. Lock. Play.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {PHASES.map((p, i) => (
              <motion.div
                key={p.step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border border-stone-200 bg-white p-7"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-stone-900 text-amber-400">
                    <p.icon className="size-5" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400">{p.step}</p>
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Engine features */}
      <section id="engine" className="border-t border-stone-200/70 bg-white/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Under the hood</p>
          <h2 className="mt-3 text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            A rules engine, not just a story teller
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-6">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <f.icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-24 pt-8">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-stone-900 px-8 py-14 text-center text-white">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500 text-stone-950">
            <Dices className="size-7" />
          </div>
          <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            The dice are waiting.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-400">
            Build a character with the full Tasha's catalog and walk into a solo campaign tonight.
            No party, no schedule — just you and the oracle.
          </p>
          <Link
            to="/auth?returnTo=/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-7 py-3 text-sm font-semibold text-stone-950 transition-all hover:bg-amber-400"
          >
            Begin Phase 1 — Character Creation <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200/70 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-xs text-stone-400 sm:flex-row">
          <p className="flex items-center gap-2">
            <Dices className="size-3.5" /> Oraculum — Solo Digital Tabletop Engine
          </p>
          <p>Rolled with Math.floor(Math.random()). Not affiliated with Wizards of the Coast, Paizo or Steve Jackson Games.</p>
        </div>
      </footer>
    </div>
  );
}
