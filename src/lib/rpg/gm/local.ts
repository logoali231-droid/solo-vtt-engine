// ============================================================================
// Oraculum — Local Game Master.
// A rule-based solo-play narrator that honors dice outcomes, rests and
// exploration. Fully offline; used as the default GM and as a fallback when
// the live LLM endpoint is not configured.
// ============================================================================

import type { AdventureState, DiceResult, GameSystem, GmTurn } from "../types";
import { getDndDerived, getGurpsDerived, getPf2eDerived } from "../character";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chance(p: number): boolean {
  return Math.random() < p;
}

// ---------------------------------------------------------------------------
// Opening scene generation
// ---------------------------------------------------------------------------

const OPENINGS = [
  "A cold wind carries the smell of rain and old stone. Before you, the trail splits: one path descends toward a village whose lights flicker like dying embers, the other climbs into a forest where something large and patient moves between the trees.",
  "You stand at the threshold of a half-collapsed watchtower, its door hanging crooked on one hinge. Inside, the floor is scattered with broken pottery — and the dust shows fresh, bare footprints leading down.",
  "Dawn breaks over the ruins of an old temple. Its bells, long silent, begin to ring once — then fall quiet. A young courier is waiting by the road with a sealed letter addressed to you by name.",
  "The tavern falls silent as you enter. A hooded figure in the corner slides a parchment map toward you without a word. Somewhere in the hills beyond town, it seems, a door has been found that should not exist.",
  "Thunder rolls over the moor. You are alone on the road, three days from the last town, when you spot a plume of smoke rising from a farmstead that should be empty.",
];

export function generateOpening(adventure: AdventureState): string {
  const c = adventure.character;
  const who =
    c.system === "dnd5e"
      ? `${c.name}, ${getDndDerived(c).raceName} ${getDndDerived(c).className} of the ${getDndDerived(c).subclassName} tradition`
      : c.system === "pf2e"
        ? `${c.name}, ${getPf2eDerived(c).className}`
        : `${c.name}, a ${getGurpsDerived(c).pointTotal}-point adventurer`;
  return `The tale of ${who} begins in ${pick(OPENINGS)}`;
}

// ---------------------------------------------------------------------------
// Oracle (yes / no / but / and) — the classic solo-RPG engine
// ---------------------------------------------------------------------------

export function oracleResponse(question: string): string {
  const roll = Math.floor(Math.random() * 20) + 1;
  let verdict: string;
  if (roll <= 5) verdict = "No.";
  else if (roll <= 8) verdict = "No, but...";
  else if (roll <= 12) verdict = "Yes, but...";
  else if (roll <= 17) verdict = "Yes.";
  else verdict = "Yes, and...";
  const flavor = pick([
    "The winds whisper their answer.",
    "You close your eyes and listen to the world.",
    "The bones fall and the pattern is clear.",
    "A raven on the lintel cocks its head, as if waiting.",
    "The candle flame bends, pointing its judgment.",
  ]);
  return `${flavor} The oracle answers: ${verdict}`;
}

// ---------------------------------------------------------------------------
// Reaction banks
// ---------------------------------------------------------------------------

const EXPLORE = [
  "You move deeper into the place. Dust swirls in your torchlight; the walls here are older than the town above, carved with symbols no living scholar has named. Something glints at the far end of the chamber.",
  "After a careful search you find a small iron box tucked beneath a loose flagstone. It is locked, but the lock looks simple enough.",
  "The trail narrows between damp stones. You hear water dripping somewhere ahead — and, beneath it, the faint scrape of something dragging across the floor.",
  "You find signs of a recent camp: cold ash, cut rope, and a boot print too large for any human you have met.",
  "High on the wall, barely visible, a mural shows a figure holding a key of pure light. The key is the last panel — the story is unfinished.",
];

const TRAVEL = [
  "You set off. The road unspools before you, past fieldstone walls and hedgerows full of birds. By midday the landmarks you were told to expect have failed to appear — either you are lost, or the map lies.",
  "You travel through the day and into the evening. Just before dusk, you crest a hill and see a settlement below, its chimneys smoking. It looks peaceful. It looks, perhaps, too peaceful.",
  "The path takes you through a drowned wood where the mist moves against the wind. Twice you are certain you hear footsteps keeping pace just out of sight.",
  "You make good time. The road is quiet, the weather holds — and that, in your experience, is exactly when the trouble starts.",
];

const TALK = [
  "They measure you with a long look before answering. 'You're not from around here,' they say, 'but you've got the eyes of someone who keeps their word. I can work with that.'",
  "The conversation is wary at first, then warms. In the end they lean close and lower their voice: 'If you really want to help, don't go asking about the tower in the square. Go ask about the tunnel under the mill.'",
  "They laugh, but there's no humor in it. 'Everyone who pokes around the old keep ends up in the river. The ones that are lucky.'",
  "A bargain is struck — for now. You get the information you need, and they get a promise they intend to collect on.",
];

const ENCOUNTERS = [
  "Ahead, the ground is strewn with white bones, cracked and picked clean. Nothing moves — but nothing here has been dead for very long.",
  "You smell it before you see it: smoke, and roasting meat, and the low murmur of voices around a campfire hidden behind the ridge.",
  "The forest holds its breath. Then, with a shriek, a flock of birds erupts from the canopy — something large has just moved through the treetops.",
  "A figure blocks the road. They wear a hood against the rain, and at their belt hangs a bell that does not ring.",
];

const REST = [
  "You make camp and let the fire talk to the dark. The night passes without alarm — a small mercy you accept gratefully.",
  "You find shelter in the hollow of a great fallen tree. You sleep in shifts, weapons within reach, and the forest leaves you be.",
  "The rest is uneasy. Twice you start awake at sounds that turn out to be nothing. By morning you are rested, if not entirely at peace.",
];

const FEATURE_USE = [
  "You call upon your training, and the world bends to meet it. The moment hangs — then the effect takes hold, and you feel the shift in your favor.",
  "Power answers you readily. Those nearby step back a pace, suddenly aware that you are more than you appear.",
  "It works — better than you hoped. You file the moment away; such gifts are not infinite, and you know it.",
];

function reactToDice(dice: DiceResult): string {
  const outcome = dice.outcome;
  switch (dice.kind) {
    case "attack": {
      if (outcome === "critical-success")
        return pick([
          "The blow lands with devastating precision — a perfect strike. Your enemy staggers, hurt and off-balance.",
          "You find the opening you were looking for and exploit it ruthlessly. It is a clean, brutal hit.",
        ]);
      if (outcome === "success")
        return pick([
          "Your attack connects. There is a grunt of pain, and the fight shifts slightly in your favor.",
          "The blade finds flesh. Not a killing blow, but a telling one.",
        ]);
      if (outcome === "failure")
        return pick([
          "Your strike goes wide, scraping sparks from the stone behind your foe. They grin.",
          "You commit to the swing, but they read it and slip aside. Your momentum carries you a half-step too far.",
        ]);
      return pick([
        "A catastrophic miss — your weapon clatters, and you are exposed for a heartbeat too long.",
        "The attack fails so badly you nearly drop your guard entirely.",
      ]);
    }
    case "save": {
      if (outcome === "success" || outcome === "critical-success")
        return "You grit your teeth and shake the effect off, standing firm against the pressure.";
      return "The effect takes hold despite your efforts — you feel it sink in, and you will have to fight through it.";
    }
    case "skill":
    case "check": {
      if (outcome === "critical-success")
        return "Not merely a success — a triumph. The result exceeds every expectation, and those watching take notice.";
      if (outcome === "success")
        return "You manage it. It costs effort, but the task yields to you.";
      if (outcome === "failure")
        return "It doesn't go as planned. The attempt fails, and you are left with the consequences.";
      return "It goes wrong — badly. What could have been a setback has become a genuine problem.";
    }
    case "damage": {
      return dice.total >= 8
        ? "The damage is significant — the wound is real, and the foe's confidence visibly cracks."
        : "The hit lands, though the damage is modest. Every bit counts.";
    }
    default:
      return "The roll settles the matter. You read the result and act on it.";
  }
}

// ---------------------------------------------------------------------------
// Main responder
// ---------------------------------------------------------------------------

export function localRespond(turn: GmTurn, adventure: AdventureState): string {
  const text = (turn.playerText ?? "").trim();
  const lower = text.toLowerCase();

  // Oracle questions
  if (text.startsWith("oracle") || /^\?/.test(text) || text.endsWith("?")) {
    const q = text.replace(/^oracle[:,\s]*/i, "").replace(/^\?/, "").trim();
    return oracleResponse(q || "Will the next step go well?");
  }

  // Rest handling
  if (/(short rest|long rest|rest|sleep|camp|meditat|settle in)/.test(lower)) {
    const long = /(long rest|sleep|night)/.test(lower);
    const night =
      (long ? pick(REST) : "You catch your breath, tend to your wounds, and recover your strength.")
      + (chance(0.2) ? " Near the edge of the firelight, something watches. It does not approach — yet." : "");
    return night;
  }

  // Combat actions
  if (/(attack|fight|strike|swing|shoot|hit|charge|engage|slash|stab)/.test(lower)) {
    if (turn.dice) return reactToDice(turn.dice);
    return pick(ENCOUNTERS) + " You ready yourself and choose your moment.";
  }

  // Exploration
  if (/(look|search|explore|investigat|inspect|examine|check|scout)/.test(lower)) {
    return pick(EXPLORE) + (turn.dice ? " " + reactToDice(turn.dice) : "");
  }

  // Movement / travel
  if (/(go |walk|travel|enter|leave|follow|head|move|approach|north|south|east|west|road|path|climb|descend|open)/.test(lower)) {
    return (
      pick(TRAVEL) +
      (chance(0.35) ? " " + pick(ENCOUNTERS) : "")
    );
  }

  // Social
  if (/(talk|speak|ask|negotiat|barter|persuade|convince|greet|call out|shout|yell|lie|flatter)/.test(lower)) {
    return pick(TALK);
  }

  // Class feature use
  if (/(use|activate|channel|invoke|cast|rage|inspire|smite|summon|focus)/.test(lower)) {
    return pick(FEATURE_USE);
  }

  // Status recap
  if (/(status|inventory|who am i|recap|where am i|what do i know)/.test(lower)) {
    const c = adventure.character;
    return `You are ${c.name}. ${adventure.sceneTitle} — ${adventure.location}. Current quest: ${adventure.quest[adventure.quest.length - 1] ?? "none set"}. The world waits on your next move.`;
  }

  // Generic
  if (turn.dice) return reactToDice(turn.dice);
  return (
    pick([
      "The world shifts around you, patient as stone. Something here is waiting for you to make up your mind.",
      "You take stock. The scene is still, but it is the stillness of a held breath.",
      "The moment stretches. Around you, the small sounds of the world continue — wind, water, the distant cry of something hunting.",
    ]) +
    ` The road ahead leads ${pick(["deeper into the wilds", "toward the village lights", "past the old keep", "into the dark wood"])}.`
  );
}
