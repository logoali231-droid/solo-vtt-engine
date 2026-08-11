// ============================================================================
// Oraculum — GURPS "Life & Livelihood" free-text resolver.
//
// FULL MECHANICS, NO AI REQUIRED. When the player types a life action
// ("I work the month", "I hack the corporate mainframe", "I study for my
// exam", "I attend the ball"…) this module:
//   1. detects the intent from the words,
//   2. computes the exact 3d6 target through the real skill math,
//   3. resolves the outcome against the original extension tables
//      (gurps-extensions.ts) — pay, profit, study progress, reputation,
//      relationship stages, cyber trace-defense, …,
//   4. returns a deterministic bilingual narration plus the exact
//      mechanical changes (wallet delta + ext state patch).
//
// The GameBoard applies those changes directly, so the mechanics work with
// or without an AI configured. The AI, when present, only adds flavor on top.
// ============================================================================

import type {
  DiceResult,
  GmLanguage,
  GurpsCharacter,
  GurpsExtensionState,
  Wallet,
} from "./types";
import { gurpsLifeModeOf, walletToSp, spToWallet } from "./types";
import { getGurpsDerived } from "./character";
import {
  GURPS_BUSINESS_MAP,
  GURPS_CORP_LADDER,
  GURPS_CORP_RANK_MAP,
  GURPS_COURT_POSITION_MAP,
  GURPS_CYBERWARE_MAP,
  GURPS_DEGREE_MAP,
  GURPS_HACK_TARGETS,
  GURPS_HOLDING_MAP,
  GURPS_JOB_MAP,
  GURPS_NETDECK_MAP,
  GURPS_PROGRAM_MAP,
  GURPS_RELATIONSHIP_STAGES,
  GURPS_SOCIAL_CIRCLE_MAP,
  GURPS_SOCIAL_EVENT_MAP,
  GURPS_TITLE_MAP,
  GURPS_UNIVERSITY_MAP,
  GURPS_WEALTH_MAP,
  gurpsBusinessResult,
  gurpsBusinessesFor,
  gurpsCorpSalary,
  gurpsCostOfLiving,
  gurpsCourtSalary,
  gurpsCyberLayer,
  gurpsEventRep,
  gurpsHackBonus,
  gurpsJobPay,
  gurpsJobsFor,
  gurpsMedievalLayer,
  gurpsModeHas,
  gurpsMonthlyIncome,
  gurpsReactionModifiers,
  gurpsStudyGain,
  gurpsTitleIncome,
  gurpsTraceDefense,
} from "./data/gurps-extensions";

export interface LifeOutcome {
  /** Deterministic bilingual narration of the result. */
  narration: string;
  /** Mechanical wallet change in gp (positive = credit). */
  walletDelta?: number;
  /** Mechanical extension-state change. */
  extPatch?: Partial<GurpsExtensionState>;
}

export interface RolledLifeCommand {
  kind: "rolled";
  /** Dice-card label. */
  label: string;
  /** 3d6 target for the roll. */
  gurpsTarget: number;
  /** Turn the resolved dice into the mechanical outcome. */
  resolve: (dice: DiceResult, lang: GmLanguage) => LifeOutcome;
}

export type LifeCommand =
  | RolledLifeCommand
  | { kind: "flat"; outcome: LifeOutcome }
  | { kind: "blocked"; narration: string };

type Attr = "st" | "dx" | "iq" | "ht";
type Lang = GmLanguage;

const EMPTY_EXT: GurpsExtensionState = {
  jobId: undefined,
  wealthTierId: undefined,
  businessId: undefined,
  cyberware: [],
  relationshipStage: undefined,
  relationshipName: undefined,
  holdingId: undefined,
  universityId: undefined,
  degreeId: undefined,
  studyProgress: 0,
  graduated: false,
  studentDebt: 0,
  scholarship: false,
  reputation: 0,
  socialCircleId: undefined,
  contacts: [],
  titleId: undefined,
  courtPositionId: undefined,
  netdeckId: undefined,
  programs: [],
  corpPositionId: undefined,
};

function extOf(c: GurpsCharacter): GurpsExtensionState {
  return { ...EMPTY_EXT, ...c.ext };
}

/** Exact skill level from the derived sheet (core + extension skills). */
function skillLevel(c: GurpsCharacter, id: string, fallback: Attr): number {
  const d = getGurpsDerived(c);
  const trained = d.skills.find((s) => s.id === id);
  return trained ? trained.level : c.attributes[fallback] - 5;
}

function fmtGp(n: number): string {
  return `${n >= 0 ? "+" : ""}${n} gp`;
}

function loc(en: string, pt?: string) {
  return (lang: Lang) => (lang === "pt-BR" && pt ? pt : en);
}

/** Whether the text names one of the given keywords (case-insensitive). */
function has(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

/** Word-boundary match on whole words/phrases (avoids "corp" hitting "corpse"). */
function hasWord(text: string, patterns: string[]): boolean {
  return patterns.some((p) => new RegExp(`\\b${p}\\b`, "i").test(text));
}

/** True for success or critical-success (narrows the outcome type). */
function isOk(outcome: string): outcome is "success" | "critical-success" {
  return outcome === "success" || outcome === "critical-success";
}
const CRIT_OK = "critical-success" as const;
const CRIT_FAIL = "critical-failure" as const;

/** Wallet after a gp delta (normalized; clamped at zero). */
export function walletDelta(wallet: Wallet | undefined, gp: number): Wallet | undefined {
  if (!wallet) return undefined;
  return spToWallet(walletToSp(wallet) + Math.round(gp * 100));
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

export function resolveLifeCommand(
  text: string,
  character: GurpsCharacter,
  wallet: Wallet | undefined,
  lang: Lang = "en",
): LifeCommand | null {
  const t = text.toLowerCase();
  const c = character;
  const ext = extOf(c);
  const L = (en: string, pt?: string) => loc(en, pt)(lang);

  // Life Mode tag (set at Adventure Setup, changeable in the Life panel) — the
  // world frame of the whole life-sim. Content outside the tagged era does not
  // exist and gets a plain "world block" answer instead of a generic roll.
  const mode = gurpsLifeModeOf(c.adventurePrefs);
  const modeName =
    mode === "medieval"
      ? "Fantasy / Medieval"
      : mode === "modern"
        ? "Modern / Social"
        : mode === "cyber"
          ? "Cyberpunk"
          : "Everything / Mixed";
  const worldBlock = (thing: string): LifeCommand => ({
    kind: "flat",
    outcome: {
      narration: L(
        `${thing} does not exist in this world — your Life Mode tag is ${modeName}. Change the tag in the Life panel to open up other eras.`,
        `${thing} não existe neste mundo — sua tag de Life Mode é ${modeName}. Mude a tag no painel Vida para abrir outras eras.`,
      ),
    },
  });

  // -------------------------------------------------------------------------
  // Shop — buy / install / start / acquire anything with a price tag.
  // -------------------------------------------------------------------------
  if (has(t, ["buy ", "purchase ", "install ", "acquire ", "get myself ", "order ", "start a ", "open a ", "open the ", "open an "])) {
    // Cyberware ("install dermal plating", "buy a datajack")
    for (const w of Object.values(GURPS_CYBERWARE_MAP)) {
      if (t.includes(w.name.toLowerCase()) && !ext.cyberware.includes(w.id)) {
        if (!gurpsCyberLayer(mode)) return worldBlock(w.name);
        const afford = wallet && walletToSp(wallet) >= w.cost * 100;
        if (!afford) {
          return {
            kind: "flat",
            outcome: {
              narration: L(
                `You cannot afford ${w.name} — it costs ${w.cost} gp.`,
                `Você não pode pagar ${w.name} — custa ${w.cost} gp.`,
              ),
            },
          };
        }
        return {
          kind: "flat",
          outcome: {
            narration: L(
              `${w.name} installed${w.dr ? ` (+${w.dr} DR)` : ""} — ${fmtGp(-w.cost)}.`,
              `${w.name} instalado${w.dr ? ` (+${w.dr} DR)` : ""} — ${fmtGp(-w.cost)}.`,
            ),
            walletDelta: -w.cost,
            extPatch: { cyberware: [...ext.cyberware, w.id] },
          },
        };
      }
    }
    // Netdecks ("buy a runner deck")
    for (const nd of Object.values(GURPS_NETDECK_MAP)) {
      if (t.includes(nd.name.toLowerCase())) {
        if (!gurpsCyberLayer(mode)) return worldBlock(nd.name);
        const afford = wallet && walletToSp(wallet) >= nd.cost * 100;
        if (!afford) {
          return {
            kind: "flat",
            outcome: {
              narration: L(
                `You cannot afford the ${nd.name} — it costs ${nd.cost} gp.`,
                `Você não pode pagar o ${nd.name} — custa ${nd.cost} gp.`,
              ),
            },
          };
        }
        return {
          kind: "flat",
          outcome: {
            narration: L(
              `${nd.name} acquired${nd.hackBonus > 0 ? ` (+${nd.hackBonus} Hacking)` : ""} — ${fmtGp(-nd.cost)}.`,
              `${nd.name} adquirido${nd.hackBonus > 0 ? ` (+${nd.hackBonus} Hacking)` : ""} — ${fmtGp(-nd.cost)}.`,
            ),
            walletDelta: -nd.cost,
            extPatch: { netdeckId: nd.id },
          },
        };
      }
    }
    // Programs ("buy the icebreaker")
    for (const p of Object.values(GURPS_PROGRAM_MAP)) {
      if (t.includes(p.name.toLowerCase())) {
        if (!gurpsCyberLayer(mode)) return worldBlock(p.name);
        if (ext.programs.includes(p.id)) {
          return {
            kind: "flat",
            outcome: {
              narration: L(`${p.name} is already loaded.`, `${p.name} já está carregado.`),
            },
          };
        }
        const afford = wallet && walletToSp(wallet) >= p.cost * 100;
        if (!afford) {
          return {
            kind: "flat",
            outcome: {
              narration: L(
                `You cannot afford ${p.name} — it costs ${p.cost} gp.`,
                `Você não pode pagar ${p.name} — custa ${p.cost} gp.`,
              ),
            },
          };
        }
        return {
          kind: "flat",
          outcome: {
            narration: L(
              `${p.name} loaded${p.hackBonus ? ` (+${p.hackBonus} Hacking)` : ""}${p.defenseBonus ? ` (+${p.defenseBonus} trace defense)` : ""} — ${fmtGp(-p.cost)}.`,
              `${p.name} carregado${p.hackBonus ? ` (+${p.hackBonus} Hacking)` : ""}${p.defenseBonus ? ` (+${p.defenseBonus} defesa contra rastreio)` : ""} — ${fmtGp(-p.cost)}.`,
            ),
            walletDelta: -p.cost,
            extPatch: { programs: [...ext.programs, p.id] },
          },
        };
      }
    }
    // Noble titles ("buy the title of baron", "purchase knighthood")
    for (const tl of Object.values(GURPS_TITLE_MAP)) {
      if (t.includes(tl.name.toLowerCase())) {
        if (!gurpsMedievalLayer(mode)) return worldBlock(`the rank of ${tl.name}`);
        const afford = wallet && walletToSp(wallet) >= tl.cost * 100;
        if (!afford) {
          return {
            kind: "flat",
            outcome: {
              narration: L(
                `The rank of ${tl.name} costs ${tl.cost} gp — beyond your purse.`,
                `O título de ${tl.name} custa ${tl.cost} gp — além da sua bolsa.`,
              ),
            },
          };
        }
        return {
          kind: "flat",
          outcome: {
            narration: L(
              `You are granted the title of ${tl.name} — ${fmtGp(-tl.cost)}.`,
              `Você recebe o título de ${tl.name} — ${fmtGp(-tl.cost)}.`,
            ),
            walletDelta: -tl.cost,
            extPatch: { titleId: tl.id },
          },
        };
      }
    }
    // Businesses ("start a market stall", "open a tavern") — require an
    // explicit business-intent verb so "buy a drink at the tavern" doesn't
    // accidentally acquire the tavern.
    if (has(t, ["start", "open ", "open a", "open an", "invest in", "set up", "found "])) {
      for (const b of Object.values(GURPS_BUSINESS_MAP)) {
        const bizWords = b.name.toLowerCase().split(" / ")[0].split(" ");
        const bizMatch =
          t.includes(b.name.toLowerCase()) ||
          bizWords.some((w) => w.length >= 4 && t.includes(w)) ||
          t.includes(b.id.replace(/-/g, " "));
        if (bizMatch) {
        if (!gurpsBusinessesFor(mode).some((x) => x.id === b.id)) {
          return worldBlock(b.name);
        }
        const afford = wallet && walletToSp(wallet) >= b.startupCost * 100;
        if (!afford) {
          return {
            kind: "flat",
            outcome: {
              narration: L(
                `${b.name} needs ${b.startupCost} gp to start — you cannot afford it.`,
                `${b.name} precisa de ${b.startupCost} gp para começar — você não pode pagar.`,
              ),
            },
          };
        }
        return {
          kind: "flat",
          outcome: {
            narration: L(
              `You open ${b.name} — ${fmtGp(-b.startupCost)} invested.`,
              `Você abre ${b.name} — ${fmtGp(-b.startupCost)} investidos.`,
            ),
            walletDelta: -b.startupCost,
            extPatch: { businessId: b.id },
          },
        };
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Take a job ("work as a smith", "become a town guard", "take the job of…")
  // -------------------------------------------------------------------------
  if (has(t, ["work as ", "become a ", "become an ", "take the job", "get a job", "find work as", "be a ", "be an ", "hire on as "])) {
    for (const j of Object.values(GURPS_JOB_MAP)) {
      if (t.includes(j.name.toLowerCase()) || t.includes(j.id.replace(/-/g, " "))) {
        if (!gurpsJobsFor(mode).some((x) => x.id === j.id)) {
          return worldBlock(`the job of ${j.name}`);
        }
        return {
          kind: "flat",
          outcome: {
            narration: L(
              `You take work as ${/^[aeiou]/i.test(j.name) ? "an" : "a"} ${j.name}. Say "work the month" to roll your pay.`,
              `Você arruma trabalho como ${j.name}. Diga "work the month" para rolar seu pagamento.`,
            ),
            extPatch: { jobId: j.id },
          },
        };
      }
    }
    return {
      kind: "blocked",
      narration: L(
        "I don't know that job. Take one from the Jobs & Work section of the Life panel — or just say \"work the month\" with one active.",
        "Não conheço esse trabalho. Escolha um na seção Jobs & Work do painel Vida — ou diga \"work the month\" com um ativo.",
      ),
    };
  }

  // -------------------------------------------------------------------------
  // Work the month — roll vs the job's skill; the margin sets the pay.
  // -------------------------------------------------------------------------
  if (has(t, ["work the month", "work a month", "work the week", "work a shift", "work a day", "do my job", "do the job", "earn my keep", "earn my wage", "collect my wage", "collect my pay", "payday", "do a shift", "work for a living"])) {
    const job = ext.jobId ? GURPS_JOB_MAP[ext.jobId] : undefined;
    if (!job) {
      return {
        kind: "blocked",
        narration: L(
          "You have no job — take one from the Jobs & Work section of the Life panel first.",
          "Você não tem emprego — escolha um na seção Jobs & Work do painel Vida primeiro.",
        ),
      };
    }
    const target = skillLevel(c, job.skill, job.fallbackStat);
    return {
      kind: "rolled",
      label: `Job: ${job.name} (skill ${target})`,
      gurpsTarget: target,
      resolve: (dice) => {
        const { pay, label, kept } = gurpsJobPay(job, dice.margin ?? 0, dice.outcome, ext.wealthTierId);
        const payLine =
          pay > 0
            ? L(`You earn ${fmtGp(pay)} this month.`, `Você ganha ${fmtGp(pay)} este mês.`)
            : kept
              ? L("You earn nothing this month.", "Você não ganha nada este mês.")
              : L("You are fired — no pay.", "Você é demitido — sem pagamento.");
        return {
          narration: L(
            `${label} — ${payLine}`,
            `${label} — ${payLine}`,
          ),
          walletDelta: pay,
          extPatch: kept ? undefined : { jobId: undefined },
        };
      },
    };
  }

  // -------------------------------------------------------------------------
  // Run the business — profit or loss from the monthly roll.
  // -------------------------------------------------------------------------
  if (has(t, ["run the business", "run my business", "run the shop", "run the store", "run the tavern", "business month", "monthly business", "close the shop", "work the stall", "business report", "how is business", "check on the business", "run the stall", "run the tavern", "run the workshop", "run the trading house", "run the startup", "run the smuggling"])) {
    const biz = ext.businessId ? GURPS_BUSINESS_MAP[ext.businessId] : undefined;
    if (!biz) {
      return {
        kind: "blocked",
        narration: L(
          "You own no business — start one from the Business section of the Life panel (or say \"start a market stall\").",
          "Você não tem um negócio — abra um na seção Business do painel Vida (ou diga \"start a market stall\").",
        ),
      };
    }
    const target = skillLevel(c, biz.skill, "iq");
    return {
      kind: "rolled",
      label: `Business: ${biz.name} (skill ${target})`,
      gurpsTarget: target,
      resolve: (dice) => {
        const { profit, label } = gurpsBusinessResult(biz, dice.margin ?? 0, dice.outcome);
        if (profit >= 0) {
          return {
            narration: L(
              `${label} — ${biz.name} nets ${fmtGp(profit)}.`,
              `${label} — ${biz.name} rende ${fmtGp(profit)}.`,
            ),
            walletDelta: profit,
          };
        }
        const available = wallet ? Math.floor(walletToSp(wallet) / 100) : 0;
        const paid = Math.min(available, -profit);
        const debt = -profit - paid;
        return {
          narration: L(
            `${label} — the books close at ${profit} gp${debt > 0 ? ` (${debt} gp of debt carried)` : ""}.`,
            `${label} — o balanço fecha em ${profit} gp${debt > 0 ? ` (${debt} gp de dívida carregada)` : ""}.`,
          ),
          walletDelta: -paid,
        };
      },
    };
  }

  // -------------------------------------------------------------------------
  // Wealth tier — a player-authored CHOICE that mirrors the Economics panel
  // buttons (the tier is free to set; only the income that flows from it is
  // mechanical). "Make me rich" stays blocked by the cheat guard — this
  // handles the legitimate framing "set my wealth tier to …".
  // -------------------------------------------------------------------------
  if (has(t, ["set my wealth", "set my wealth tier", "choose my wealth", "my wealth tier", "make my wealth"])) {
    for (const tierDef of Object.values(GURPS_WEALTH_MAP)) {
      if (t.includes(tierDef.name.toLowerCase()) || t.includes(tierDef.id.replace(/-/g, " "))) {
        return {
          kind: "flat",
          outcome: {
            narration: L(
              `Your economic footing is now ${tierDef.name} — ${tierDef.summary}`,
              `Seu padrão econômico agora é ${tierDef.name} — ${tierDef.summary}`,
            ),
            extPatch: { wealthTierId: tierDef.id },
          },
        };
      }
    }
    return {
      kind: "flat",
      outcome: {
        narration: L(
          "Pick a wealth tier: Dead Broke, Poor, Struggling, Average, Comfortable, Wealthy, Very Wealthy, Filthy Rich or Multimillionaire.",
          "Escolha um nível de riqueza: Dead Broke, Poor, Struggling, Average, Comfortable, Wealthy, Very Wealthy, Filthy Rich ou Multimillionaire.",
        ),
      },
    };
  }

  // -------------------------------------------------------------------------
  // Collect income / pay living (flat, no roll).
  // -------------------------------------------------------------------------
  if (has(t, ["collect income", "collect my income", "collect my stipend", "monthly income", "receive income", "receive my income", "receive my pay", "payday money", "gather my income", "collect the stipend"])) {
    const income = gurpsMonthlyIncome(ext.wealthTierId);
    const title = gurpsTitleIncome(ext.titleId);
    const total = income + title;
    if (total === 0) {
      return {
        kind: "flat",
        outcome: {
          narration: L(
            "You have no income to collect — set a wealth tier in the Economics section first.",
            "Você não tem renda para receber — defina um nível de riqueza na seção Economics primeiro.",
          ),
        },
      };
    }
    return {
      kind: "flat",
      outcome: {
        narration: L(
          `Monthly income collected: ${fmtGp(total)}${title > 0 ? ` (incl. ${fmtGp(title)} title stipend)` : ""}.`,
          `Renda mensal recebida: ${fmtGp(total)}${title > 0 ? ` (incl. ${fmtGp(title)} do título)` : ""}.`,
        ),
        walletDelta: total,
      },
    };
  }
  if (has(t, ["pay cost of living", "pay my cost of living", "pay living", "pay the living", "cost of living", "living expenses", "pay my expenses", "pay the bills", "pay my bills", "pay rent"])) {
    const living = gurpsCostOfLiving(ext.wealthTierId);
    if (living === 0) {
      return {
        kind: "flat",
        outcome: {
          narration: L(
            "You have no cost of living to pay — set a wealth tier first.",
            "Você não tem custo de vida para pagar — defina um nível de riqueza primeiro.",
          ),
        },
      };
    }
    const afford = wallet && walletToSp(wallet) >= living * 100;
    return {
      kind: "flat",
      outcome: {
        narration: afford
          ? L(`Cost of living paid: ${fmtGp(-living)}.`, `Custo de vida pago: ${fmtGp(-living)}.`)
          : L(`You cannot cover your ${living} gp cost of living this month.`, `Você não consegue cobrir seu custo de vida de ${living} gp este mês.`),
        walletDelta: afford ? -living : 0,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Netrun — hack a target; deck + program bonuses apply, trace-defense on
  // a critical failure.
  // -------------------------------------------------------------------------
  if (gurpsCyberLayer(mode) && has(t, ["hack", "netrun", "breach the", "breach a", "crack the", "crack a", "jack in", "jack into", "intrude", "break into the system", "firewall", "ice breaker", "black ice", "decker", "run the net", "enter the grid", "access the grid"])) {
    let targetDef = GURPS_HACK_TARGETS.find((tg) =>
      has(t, [tg.name.toLowerCase().replace(/\s+/g, " "), tg.id.replace(/-/g, " ")]),
    );
    if (!targetDef) {
      targetDef = GURPS_HACK_TARGETS.find((tg) =>
        has(t, tg.name.toLowerCase().split(" ").slice(0, 2)),
      );
    }
    const def = targetDef ?? GURPS_HACK_TARGETS[1]; // default: Personal Rig
    const bonus = gurpsHackBonus(ext.netdeckId, ext.programs);
    const hackLevel = skillLevel(c, "hacking", "iq");
    const target = Math.max(3, hackLevel + bonus + def.penalty);
    const hasDeck = !!ext.netdeckId;
    return {
      kind: "rolled",
      label: `Hack ${def.name} (target ${target})`,
      gurpsTarget: target,
      resolve: (dice) => {
        if (dice.outcome === CRIT_FAIL) {
          const traceDef = gurpsTraceDefense(ext.programs);
          return {
            narration: L(
              `Trace detected on ${def.name} — you jack out with the system screaming after you${traceDef > 0 ? ` (your ${traceDef} trace-defense programs bought you seconds)` : ""}.`,
              `Rastreio detectado em ${def.name} — você desconecta com o sistema gritando atrás de você${traceDef > 0 ? ` (seus ${traceDef} programas de defesa contra rastreio compraram segundos)` : ""}.`,
            ),
          };
        }
        if (isOk(dice.outcome)) {
          return {
            narration: L(
              `Breach successful — ${def.summary}${hasDeck ? "" : " (bare terminal — no netdeck bonus)"} is now yours.`,
              `Invasão bem-sucedida — ${def.summary}${hasDeck ? "" : " (terminal simples — sem bônus de netdeck)"} agora é seu.`,
            ),
          };
        }
        return {
          narration: L(
            `ICE holds on ${def.name}. You bounce off the wall without getting in.`,
            `O ICE resiste em ${def.name}. Você ricocheteia na parede sem entrar.`,
          ),
        };
      },
    };
  }

  // -------------------------------------------------------------------------
  // Harvest the holding — seasonal income.
  // -------------------------------------------------------------------------
  if (gurpsMedievalLayer(mode) && has(t, ["harvest", "collect the yield", "collect the harvest", "seasonal income", "season harvest", "tend the land", "tend the holding", "tend the field", "tend the manor", "tend the orchard", "tend the mill", "tend my land"])) {
    const holding = ext.holdingId ? GURPS_HOLDING_MAP[ext.holdingId] : undefined;
    if (!holding) {
      return {
        kind: "blocked",
        narration: L(
          "You hold no land — take stewardship of a holding from the Medieval Holdings section first.",
          "Você não possui terras — assuma a administração de uma propriedade na seção Medieval Holdings primeiro.",
        ),
      };
    }
    const target = skillLevel(c, holding.skill, "iq");
    return {
      kind: "rolled",
      label: `Harvest: ${holding.name} (skill ${target})`,
      gurpsTarget: target,
      resolve: (dice) => {
        if (isOk(dice.outcome)) {
          const pay = dice.outcome === CRIT_OK ? holding.income * 2 : holding.income;
          return {
            narration: L(
              `A ${dice.outcome === CRIT_OK ? "bountiful" : "good"} season — ${holding.name} yields ${fmtGp(pay)}.`,
              `Uma estação ${dice.outcome === CRIT_OK ? "farta" : "boa"} — ${holding.name} rende ${fmtGp(pay)}.`,
            ),
            walletDelta: pay,
          };
        }
        if (dice.outcome === CRIT_FAIL) {
          return {
            narration: L(
              `A disaster season — blight, theft, or ruin strikes ${holding.name}.`,
              `Uma estação desastrosa — praga, roubo ou ruína atinge ${holding.name}.`,
            ),
          };
        }
        return {
          narration: L(
            `A lean season — ${holding.name} yields nothing this cycle.`,
            `Uma estação magra — ${holding.name} não rende nada neste ciclo.`,
          ),
        };
      },
    };
  }

  // -------------------------------------------------------------------------
  // Serve at court — monthly service roll; salary on success, dismissal on
  // a critical failure.
  // -------------------------------------------------------------------------
  if (gurpsMedievalLayer(mode) && has(t, ["serve at court", "serve the court", "serve my court", "court duty", "court service", "serve the king", "serve the queen", "serve the realm", "court month", "month at court", "serve as page", "serve as herald", "serve as marshal", "serve as chancellor", "serve as spymaster"])) {
    const pos = ext.courtPositionId ? GURPS_COURT_POSITION_MAP[ext.courtPositionId] : undefined;
    if (!pos) {
      return {
        kind: "blocked",
        narration: L(
          "You hold no court position — take one from the Court positions section of the Life panel first.",
          "Você não tem cargo na corte — escolha um na seção de cargos da corte do painel Vida primeiro.",
        ),
      };
    }
    const salary = gurpsCourtSalary(ext.courtPositionId);
    const target = skillLevel(c, pos.skill, pos.fallbackStat);
    return {
      kind: "rolled",
      label: `Serve as ${pos.name} (skill ${target})`,
      gurpsTarget: target,
      resolve: (dice) => {
        if (isOk(dice.outcome)) {
          const pay = dice.outcome === CRIT_OK ? salary * 2 : salary;
          return {
            narration: L(
              `A fine month of service as ${pos.name} — ${fmtGp(pay)}.`,
              `Um mês excelente de serviço como ${pos.name} — ${fmtGp(pay)}.`,
            ),
            walletDelta: pay,
          };
        }
        if (dice.outcome === CRIT_FAIL) {
          return {
            narration: L(
              `A terrible blunder at court — you are dismissed as ${pos.name}.`,
              `Um erro terrível na corte — você é dispensado como ${pos.name}.`,
            ),
            extPatch: { courtPositionId: undefined },
          };
        }
        return {
          narration: L(
            `A quiet month at court — no salary this cycle.`,
            `Um mês quieto na corte — sem salário neste ciclo.`,
          ),
        };
      },
    };
  }

  // -------------------------------------------------------------------------
  // Corporate ladder — pursue a promotion.
  // -------------------------------------------------------------------------
  if (gurpsCyberLayer(mode) && has(t, ["promotion", "promote me", "promote", "corporate ladder", "climb the ladder", "climb the corp", "performance review", "ask for a raise", "pursue a promotion", "move up the ladder", "next rank"])) {
    const rankIdx = ext.corpPositionId
      ? GURPS_CORP_LADDER.findIndex((r) => r.id === ext.corpPositionId)
      : -1;
    if (rankIdx < 0) {
      return {
        kind: "blocked",
        narration: L(
          "You are not on the corporate ladder — take a corp job (Corp Drone, Netrunner, Fixer…) and claim a rank from the Corporate Ladder section first.",
          "Você não está na escada corporativa — arrume um emprego corporativo (Corp Drone, Netrunner, Fixer…) e assuma um cargo na seção Corporate Ladder primeiro.",
        ),
      };
    }
    if (rankIdx >= GURPS_CORP_LADDER.length - 1) {
      return {
        kind: "flat",
        outcome: {
          narration: L(
            "You are at the top of the ladder — the executive floor is yours.",
            "Você está no topo da escada — o andar executivo é seu.",
          ),
        },
      };
    }
    const nextRank = GURPS_CORP_LADDER[rankIdx + 1];
    const target = skillLevel(c, "administration", "iq");
    return {
      kind: "rolled",
      label: `Promotion to ${nextRank.name} (skill ${target} vs ${nextRank.target})`,
      gurpsTarget: target,
      resolve: (dice) => {
        if (dice.outcome === CRIT_FAIL) {
          if (rankIdx > 0) {
            const demoted = GURPS_CORP_LADDER[rankIdx - 1];
            return {
              narration: L(
                `Your bid backfires catastrophically — you are demoted to ${demoted.name}.`,
                `Sua tentativa sai pela culatra — você é rebaixado para ${demoted.name}.`,
              ),
              extPatch: { corpPositionId: demoted.id },
            };
          }
          return {
            narration: L(
              `Your bid backfires — the office cools toward you.`,
              `Sua tentativa sai pela culatra — o escritório esfria com você.`,
            ),
          };
        }
        if (isOk(dice.outcome)) {
          return {
            narration: L(
              `Promoted to ${nextRank.name}! Salary is now ${gurpsCorpSalary(nextRank.id)} gp/mo.`,
              `Promovido a ${nextRank.name}! O salário agora é ${gurpsCorpSalary(nextRank.id)} gp/mês.`,
            ),
            extPatch: { corpPositionId: nextRank.id },
          };
        }
        return {
          narration: L(
            `The promotion committee passes you over this cycle.`,
            `O comitê de promoções te ignora neste ciclo.`,
          ),
        };
      },
    };
  }

  // -------------------------------------------------------------------------
  // Education — enroll, pick a degree, study, sit the exam.
  // -------------------------------------------------------------------------
  if (has(t, ["enroll", "matricul", "apply to", "go to university", "go to college", "attend university", "attend college", "sign up for"]) && !has(t, ["enroll in a degree", "enroll in the degree"])) {
    for (const u of Object.values(GURPS_UNIVERSITY_MAP)) {
      if (t.includes(u.name.toLowerCase()) || has(t, [u.id.replace(/-/g, " ")])) {
        if (!gurpsModeHas(u.era, mode)) return worldBlock(u.name);
        if (ext.scholarship) {
          return {
            kind: "flat",
            outcome: {
              narration: L(
                `Your scholarship covers tuition — you enroll at ${u.name}.`,
                `Sua bolsa cobre a mensalidade — você se matricula em ${u.name}.`,
              ),
              extPatch: { universityId: u.id, studentDebt: 0 },
            },
          };
        }
        const afford = wallet && walletToSp(wallet) >= u.tuition * 100;
        return {
          kind: "flat",
          outcome: afford
            ? {
                narration: L(
                  `You enroll at ${u.name} — ${u.tuition} gp tuition paid.`,
                  `Você se matricula em ${u.name} — ${u.tuition} gp de mensalidade pagos.`,
                ),
                walletDelta: -u.tuition,
                extPatch: { universityId: u.id, studentDebt: 0 },
              }
            : {
                narration: L(
                  `You enroll at ${u.name} on credit — ${u.tuition} gp added to your student debt.`,
                  `Você se matricula em ${u.name} a crédito — ${u.tuition} gp adicionados à sua dívida estudantil.`,
                ),
                extPatch: { universityId: u.id, studentDebt: u.tuition },
              },
        };
      }
    }
    return {
      kind: "flat",
      outcome: {
        narration: L(
          "Which university? (Monastery Scriptorium, Guild College, Crown University, City University, Polytechnic, Corp Academy, Grid University).",
          "Qual universidade? (Monastery Scriptorium, Guild College, Crown University, City University, Polytechnic, Corp Academy, Grid University).",
        ),
      },
    };
  }

  if (has(t, ["sit the exam", "sit my exam", "take the exam", "take my exam", "final exam", "sit the final", "do the exam", "write the exam", "exam time", "graduation exam"])) {
    const degree = ext.degreeId ? GURPS_DEGREE_MAP[ext.degreeId] : undefined;
    const university = ext.universityId ? GURPS_UNIVERSITY_MAP[ext.universityId] : undefined;
    if (!degree || !university) {
      return {
        kind: "blocked",
        narration: L(
          "You are not enrolled in a degree program — enroll at a university and pick a degree first.",
          "Você não está matriculado em um curso — matricule-se em uma universidade e escolha um curso primeiro.",
        ),
      };
    }
    if (ext.graduated) {
      return {
        kind: "flat",
        outcome: {
          narration: L(
            `You already graduated in ${degree.name}.`,
            `Você já se formou em ${degree.name}.`,
          ),
        },
      };
    }
    if ((ext.studyProgress ?? 0) < 100) {
      return {
        kind: "blocked",
        narration: L(
          `You cannot sit the exam yet — study until your progress reaches 100% (currently ${Math.min(100, ext.studyProgress ?? 0)}%).`,
          `Você ainda não pode fazer o exame — estude até seu progresso chegar a 100% (atualmente ${Math.min(100, ext.studyProgress ?? 0)}%).`,
        ),
      };
    }
    const target = skillLevel(c, university.examSkill, university.fallbackStat);
    const examTarget = Math.max(3, Math.min(18, degree.examTarget));
    return {
      kind: "rolled",
      label: `Final exam: ${degree.name} (target ${target} vs ${examTarget})`,
      gurpsTarget: target,
      resolve: (dice) => {
        if (isOk(dice.outcome)) {
          const honors = dice.outcome === CRIT_OK;
          const bonus = degree.skillBonus
            ? L(
                ` +${degree.skillBonus.bonus} to ${degree.skillBonus.skill.replace(/-/g, " ")}`,
                ` +${degree.skillBonus.bonus} em ${degree.skillBonus.skill.replace(/-/g, " ")}`,
              )
            : "";
          return {
            narration: L(
              `You ${honors ? "graduate with honors" : "graduate"} in ${degree.name}!${bonus}${degree.unlocks?.length ? ` Unlocked jobs: ${degree.unlocks.map((u) => GURPS_JOB_MAP[u]?.name ?? u).join(", ")}.` : ""}`,
              `Você ${honors ? "se forma com honras" : "se forma"} em ${degree.name}!${bonus}${degree.unlocks?.length ? ` Empregos liberados: ${degree.unlocks.map((u) => GURPS_JOB_MAP[u]?.name ?? u).join(", ")}.` : ""}`,
            ),
            extPatch: { graduated: true, studyProgress: 0 },
          };
        }
        return {
          narration: L(
            `The exam defeats you — you must restudy from 50%.`,
            `O exame te derrota — você precisa estudar de novo a partir de 50%.`,
          ),
          extPatch: { studyProgress: 50 },
        };
      },
    };
  }

  if (has(t, ["study ", "study for", "study the", "study my", "cram", "hit the books", "attend class", "attend a lecture", "attend a seminar", "attend lecture", "do my homework", "do homework", "revise for"])) {
    // "study <degree>" — pick the degree first.
    for (const dg of Object.values(GURPS_DEGREE_MAP)) {
      if (t.includes(dg.name.toLowerCase()) || has(t, [dg.id.replace(/-/g, " ")])) {
        if (!gurpsModeHas(dg.era, mode)) return worldBlock(dg.name);
        return {
          kind: "flat",
          outcome: {
            narration: L(
              `You take up ${dg.name}${ext.universityId ? ` at ${GURPS_UNIVERSITY_MAP[ext.universityId]?.name ?? "your university"}` : " — enroll at a university first"}. Say "study" to make progress.`,
              `Você inicia ${dg.name}${ext.universityId ? ` em ${GURPS_UNIVERSITY_MAP[ext.universityId]?.name ?? "sua universidade"}` : " — matricule-se em uma universidade primeiro"}. Diga "study" para progredir.`,
            ),
            extPatch: { degreeId: dg.id, studyProgress: 0 },
          },
        };
      }
    }
    const degree = ext.degreeId ? GURPS_DEGREE_MAP[ext.degreeId] : undefined;
    if (!degree) {
      return {
        kind: "blocked",
        narration: L(
          "You have no degree program — enroll at a university and pick a degree first.",
          "Você não tem um curso — matricule-se em uma universidade e escolha um curso primeiro.",
        ),
      };
    }
    if (ext.graduated) {
      return {
        kind: "flat",
        outcome: {
          narration: L(
            `You already graduated in ${degree.name} — your studies are done.`,
            `Você já se formou em ${degree.name} — seus estudos terminaram.`,
          ),
        },
      };
    }
    const target = skillLevel(c, degree.studySkill, degree.fallbackStat);
    return {
      kind: "rolled",
      label: `Study: ${degree.name} (skill ${target})`,
      gurpsTarget: target,
      resolve: (dice) => {
        const progress = Math.min(100, Math.max(0, ext.studyProgress ?? 0));
        const gain = gurpsStudyGain(dice.margin ?? 0, dice.outcome);
        const next = Math.min(100, Math.max(0, progress + gain));
        return {
          narration: L(
            gain > 0
              ? `Study session complete — exam progress ${progress}% → ${next}%.`
              : gain < 0
                ? `A rough session — you lose focus and slip to ${next}%.`
                : `The material resists you today — progress stays at ${next}%.`,
            gain > 0
              ? `Sessão de estudo completa — progresso no exame ${progress}% → ${next}%.`
              : gain < 0
                ? `Uma sessão difícil — você perde o foco e cai para ${next}%.`
                : `O material resiste hoje — o progresso fica em ${next}%.`,
          ),
          extPatch: { studyProgress: next },
        };
      },
    };
  }

  // -------------------------------------------------------------------------
  // Social life — attend an event (cost + reputation swing).
  // -------------------------------------------------------------------------
  for (const ev of Object.values(GURPS_SOCIAL_EVENT_MAP)) {
    if (has(t, [ev.name.toLowerCase(), ev.id.replace(/-/g, " ")])) {
      if (!gurpsModeHas(ev.era, mode)) return worldBlock(ev.name);
      const afford = wallet && walletToSp(wallet) >= ev.cost * 100;
      if (!afford) {
        return {
          kind: "flat",
          outcome: {
            narration: L(
              `You cannot afford ${ev.name} — it costs ${ev.cost} gp.`,
              `Você não pode pagar ${ev.name} — custa ${ev.cost} gp.`,
            ),
          },
        };
      }
      const target = skillLevel(c, ev.skill, ev.fallbackStat);
      const circleMod = ext.socialCircleId
        ? (GURPS_SOCIAL_CIRCLE_MAP[ext.socialCircleId]?.reactionMod ?? 0)
        : 0;
      const rep = Math.min(100, Math.max(0, ext.reputation ?? 0));
      return {
        kind: "rolled",
        label: `Attend ${ev.name} (skill ${target}${circleMod ? ` +${circleMod}` : ""})`,
        gurpsTarget: target + circleMod,
        resolve: (dice) => {
          const delta = gurpsEventRep(dice.margin ?? 0, dice.outcome, ev.repBase);
          const next = Math.min(100, Math.max(0, rep + delta));
          return {
            narration: L(
              delta > 0
                ? `You shine at ${ev.name} — reputation +${delta} (now ${next}).`
                : delta < 0
                  ? `A scandal at ${ev.name} — reputation ${delta} (now ${next}).`
                  : `You attend ${ev.name} without making waves — reputation ${next}.`,
              delta > 0
                ? `Você brilha em ${ev.name} — reputação +${delta} (agora ${next}).`
                : delta < 0
                  ? `Um escândalo em ${ev.name} — reputação ${delta} (agora ${next}).`
                  : `Você vai a ${ev.name} sem causar ondas — reputação ${next}.`,
            ),
            walletDelta: -ev.cost,
            extPatch: { reputation: next },
          };
        },
      };
    }
  }

  // -------------------------------------------------------------------------
  // Love — advance the relationship with a reaction roll.
  // -------------------------------------------------------------------------
  if (has(t, ["advance the relationship", "advance our relationship", "advance the bond", "deepen the bond", "ask out", "ask her out", "ask him out", "ask them out", "spend time with", "date ", "romance", "woo", "court my interest", "see my interest", "meet my interest"])) {
    if (!ext.relationshipName?.trim()) {
      return {
        kind: "blocked",
        narration: L(
          "You have no named interest — set a name in the Love & Relationships section of the Life panel first.",
          "Você não tem um interesse nomeado — defina um nome na seção Love & Relationships do painel Vida primeiro.",
        ),
      };
    }
    const rawIdx = ext.relationshipStage
      ? GURPS_RELATIONSHIP_STAGES.findIndex((s) => s.id === ext.relationshipStage)
      : 0; // unset defaults to Strangers — the first rung of the ladder
    const stageIdx = rawIdx < 0 ? 0 : rawIdx;
    if (stageIdx >= GURPS_RELATIONSHIP_STAGES.length - 1) {
      return {
        kind: "flat",
        outcome: {
          narration: L(
            `You and ${ext.relationshipName} are already committed partners — the bond only deepens with time.`,
            `Você e ${ext.relationshipName} já são parceiros comprometidos — o laço só se aprofunda com o tempo.`,
          ),
        },
      };
    }
    const currentStage = stageIdx >= 0 ? GURPS_RELATIONSHIP_STAGES[stageIdx] : undefined;
    const nextStage = GURPS_RELATIONSHIP_STAGES[stageIdx + 1];
    const reactionMod = gurpsReactionModifiers(c);
    const target = Math.max(3, nextStage.target + reactionMod);
    return {
      kind: "rolled",
      label: `Reaction roll — ${nextStage.name} (target ${target})`,
      gurpsTarget: target,
      resolve: (dice) => {
        if (dice.outcome === CRIT_FAIL) {
          const fallback =
            stageIdx > 0 ? GURPS_RELATIONSHIP_STAGES[stageIdx - 1] : undefined;
          return {
            narration: L(
              `A terrible misunderstanding with ${ext.relationshipName} — the relationship cools${fallback ? ` to ${fallback.name.toLowerCase()}` : ""}.`,
              `Um mal-entendido terrível com ${ext.relationshipName} — a relação esfria${fallback ? ` para ${fallback.name.toLowerCase()}` : ""}.`,
            ),
            extPatch: {
              relationshipStage: fallback?.id ?? undefined,
            },
          };
        }
        if (dice.outcome === CRIT_OK) {
          const jump = Math.min(GURPS_RELATIONSHIP_STAGES.length - 1, stageIdx + 2);
          return {
            narration: L(
              `A rare and perfect moment — the relationship leaps forward to ${GURPS_RELATIONSHIP_STAGES[jump].name}!`,
              `Um momento raro e perfeito — a relação avança para ${GURPS_RELATIONSHIP_STAGES[jump].name}!`,
            ),
            extPatch: { relationshipStage: GURPS_RELATIONSHIP_STAGES[jump].id },
          };
        }
        if (isOk(dice.outcome)) {
          return {
            narration: L(
              `The bond deepens — you and ${ext.relationshipName} are now ${nextStage.name.toLowerCase()}${currentStage ? ` (from ${currentStage.name.toLowerCase()})` : ""}.`,
              `O laço se aprofunda — você e ${ext.relationshipName} agora são ${nextStage.name.toLowerCase()}${currentStage ? ` (de ${currentStage.name.toLowerCase()})` : ""}.`,
            ),
            extPatch: { relationshipStage: nextStage.id },
          };
        }
        return {
          narration: L(
            `Not yet — the moment passes without catching.`,
            `Ainda não — o momento passa sem acontecer.`,
          ),
        };
      },
    };
  }

  // -------------------------------------------------------------------------
  // Life Mode world gate — a command aimed at a world that does not exist in
  // this Life Mode gets a plain answer instead of falling through to a generic
  // skill roll. (Specific handlers above already caught the named items; this
  // catches the generic phrasings: "hack the mainframe" in a medieval world…)
  // -------------------------------------------------------------------------
  const worldCyberRe = /\b(hack|netrun|jack in|jack into|netdeck|mainframe|icebreaker|cyberware|datajack|neural link|corp drone|netrunner|fixer|ripperdoc|bounty hunter|chrome|promotion|executive|the grid)\b/i;
  const worldMedievalRe = /\b(harvest|holding|manor|fief|demesne|knighthood|esquire|baronet|duke|herald|marshal|chancellor|spymaster|serve at court|serve the king|serve the queen|title of)\b/i;
  if (!gurpsCyberLayer(mode) && worldCyberRe.test(t)) {
    return worldBlock("Cyberpunk content");
  }
  if (!gurpsMedievalLayer(mode) && worldMedievalRe.test(t)) {
    return worldBlock("Medieval content");
  }

  return null;
}

// ---------------------------------------------------------------------------
// Convenience: wealth-tier summary shown to the AI-free player when asked
// ("what is my wealth tier?" style commands are handled by the narrator).
// ---------------------------------------------------------------------------

export function lifeSummary(character: GurpsCharacter, lang: Lang = "en"): string {
  const ext = extOf(character);
  const L = (en: string, pt?: string) => loc(en, pt)(lang);
  const mode = gurpsLifeModeOf(character.adventurePrefs);
  const modeName =
    mode === "medieval" ? "Fantasy / Medieval" : mode === "modern" ? "Modern / Social" : mode === "cyber" ? "Cyberpunk" : "Everything / Mixed";
  const job = ext.jobId ? GURPS_JOB_MAP[ext.jobId]?.name : undefined;
  const tier = ext.wealthTierId ? GURPS_WEALTH_MAP[ext.wealthTierId]?.name : undefined;
  const biz = ext.businessId ? GURPS_BUSINESS_MAP[ext.businessId]?.name : undefined;
  const degree = ext.degreeId ? GURPS_DEGREE_MAP[ext.degreeId]?.name : undefined;
  const rank = ext.corpPositionId ? GURPS_CORP_RANK_MAP[ext.corpPositionId]?.name : undefined;
  const pieces = [
    job ? L(`Job: ${job}`, `Emprego: ${job}`) : undefined,
    tier ? L(`Wealth: ${tier}`, `Riqueza: ${tier}`) : undefined,
    biz ? L(`Business: ${biz}`, `Negócio: ${biz}`) : undefined,
    degree
      ? ext.graduated
        ? L(`Degree: ${degree} (graduated)`, `Curso: ${degree} (formado)`)
        : L(`Degree: ${degree} (${Math.min(100, ext.studyProgress ?? 0)}% studied)`, `Curso: ${degree} (${Math.min(100, ext.studyProgress ?? 0)}% estudado)`)
      : undefined,
    rank ? L(`Corp rank: ${rank}`, `Cargo corporativo: ${rank}`) : undefined,
    ext.titleId ? L(`Title: ${GURPS_TITLE_MAP[ext.titleId]?.name}`, `Título: ${GURPS_TITLE_MAP[ext.titleId]?.name}`) : undefined,
    ext.relationshipName
      ? L(
          `Relationship: ${ext.relationshipName} (${GURPS_RELATIONSHIP_STAGES.find((s) => s.id === ext.relationshipStage)?.name ?? "Strangers"})`,
          `Relacionamento: ${ext.relationshipName} (${GURPS_RELATIONSHIP_STAGES.find((s) => s.id === ext.relationshipStage)?.name ?? "Estranhos"})`,
        )
      : undefined,
    (ext.reputation ?? 0) > 0 ? L(`Reputation: ${ext.reputation}/100`, `Reputação: ${ext.reputation}/100`) : undefined,
  ].filter((p): p is string => !!p);
  const modeLine = L(`Life Mode: ${modeName}`, `Life Mode: ${modeName}`);
  return [modeLine, ...pieces].join(" · ");
}
