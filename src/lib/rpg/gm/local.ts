// ============================================================================
// Oraculum — Local Game Master.
// A rule-based solo-play narrator that honors dice outcomes, rests and
// exploration. Fully offline; used as the default GM and as a fallback when
// the live LLM endpoint is not configured. Bilingual: English + PT-BR.
// ============================================================================

import type {
  AdventureState,
  DiceResult,
  GmLanguage,
  GmTurn,
} from "../types";
import { getDndDerived, getGurpsDerived, getPf2eDerived } from "../character";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chance(p: number): boolean {
  return Math.random() < p;
}

// ---------------------------------------------------------------------------
// Banks — English
// ---------------------------------------------------------------------------

const EN = {
  openings: [
    "A cold wind carries the smell of rain and old stone. Before you, the trail splits: one path descends toward a village whose lights flicker like dying embers, the other climbs into a forest where something large and patient moves between the trees.",
    "You stand at the threshold of a half-collapsed watchtower, its door hanging crooked on one hinge. Inside, the floor is scattered with broken pottery — and the dust shows fresh, bare footprints leading down.",
    "Dawn breaks over the ruins of an old temple. Its bells, long silent, begin to ring once — then fall quiet. A young courier is waiting by the road with a sealed letter addressed to you by name.",
    "The tavern falls silent as you enter. A hooded figure in the corner slides a parchment map toward you without a word. Somewhere in the hills beyond town, it seems, a door has been found that should not exist.",
    "Thunder rolls over the moor. You are alone on the road, three days from the last town, when you spot a plume of smoke rising from a farmstead that should be empty.",
  ],
  oracleFlavor: [
    "The winds whisper their answer.",
    "You close your eyes and listen to the world.",
    "The bones fall and the pattern is clear.",
    "A raven on the lintel cocks its head, as if waiting.",
    "The candle flame bends, pointing its judgment.",
  ],
  explore: [
    "You move deeper into the place. Dust swirls in your torchlight; the walls here are older than the town above, carved with symbols no living scholar has named. Something glints at the far end of the chamber.",
    "After a careful search you find a small iron box tucked beneath a loose flagstone. It is locked, but the lock looks simple enough.",
    "The trail narrows between damp stones. You hear water dripping somewhere ahead — and, beneath it, the faint scrape of something dragging across the floor.",
    "You find signs of a recent camp: cold ash, cut rope, and a boot print too large for any human you have met.",
    "High on the wall, barely visible, a mural shows a figure holding a key of pure light. The key is the last panel — the story is unfinished.",
  ],
  travel: [
    "You set off. The road unspools before you, past fieldstone walls and hedgerows full of birds. By midday the landmarks you were told to expect have failed to appear — either you are lost, or the map lies.",
    "You travel through the day and into the evening. Just before dusk, you crest a hill and see a settlement below, its chimneys smoking. It looks peaceful. It looks, perhaps, too peaceful.",
    "The path takes you through a drowned wood where the mist moves against the wind. Twice you are certain you hear footsteps keeping pace just out of sight.",
    "You make good time. The road is quiet, the weather holds — and that, in your experience, is exactly when the trouble starts.",
  ],
  talk: [
    "They measure you with a long look before answering. \"You're not from around here,\" they say, \"but you've got the eyes of someone who keeps their word. I can work with that.\"",
    "The conversation is wary at first, then warms. In the end they lean close and lower their voice: \"If you really want to help, don't go asking about the tower in the square. Go ask about the tunnel under the mill.\"",
    "They laugh, but there's no humor in it. \"Everyone who pokes around the old keep ends up in the river. The ones that are lucky.\"",
    "A bargain is struck — for now. You get the information you need, and they get a promise they intend to collect on.",
  ],
  encounters: [
    "Ahead, the ground is strewn with white bones, cracked and picked clean. Nothing moves — but nothing here has been dead for very long.",
    "You smell it before you see it: smoke, and roasting meat, and the low murmur of voices around a campfire hidden behind the ridge.",
    "The forest holds its breath. Then, with a shriek, a flock of birds erupts from the canopy — something large has just moved through the treetops.",
    "A figure blocks the road. They wear a hood against the rain, and at their belt hangs a bell that does not ring.",
  ],
  rest: [
    "You make camp and let the fire talk to the dark. The night passes without alarm — a small mercy you accept gratefully.",
    "You find shelter in the hollow of a great fallen tree. You sleep in shifts, weapons within reach, and the forest leaves you be.",
    "The rest is uneasy. Twice you start awake at sounds that turn out to be nothing. By morning you are rested, if not entirely at peace.",
  ],
  featureUse: [
    "You call upon your training, and the world bends to meet it. The moment hangs — then the effect takes hold, and you feel the shift in your favor.",
    "Power answers you readily. Those nearby step back a pace, suddenly aware that you are more than you appear.",
    "It works — better than you hoped. You file the moment away; such gifts are not infinite, and you know it.",
  ],
  reactions: {
    attackCrit:
      "The blow lands with devastating precision — a perfect strike. Your enemy staggers, hurt and off-balance.",
    attackHit:
      "Your attack connects. There is a grunt of pain, and the fight shifts slightly in your favor.",
    attackMiss:
      "Your strike goes wide, scraping sparks from the stone behind your foe. They grin.",
    attackCritFail:
      "A catastrophic miss — your weapon clatters, and you are exposed for a heartbeat too long.",
    saveSuccess:
      "You grit your teeth and shake the effect off, standing firm against the pressure.",
    saveFail:
      "The effect takes hold despite your efforts — you feel it sink in, and you will have to fight through it.",
    checkCrit: "Not merely a success — a triumph. The result exceeds every expectation, and those watching take notice.",
    checkSuccess: "You manage it. It costs effort, but the task yields to you.",
    checkFail: "It doesn't go as planned. The attempt fails, and you are left with the consequences.",
    checkCritFail: "It goes wrong — badly. What could have been a setback has become a genuine problem.",
    damageBig:
      "The damage is significant — the wound is real, and the foe's confidence visibly cracks.",
    damageSmall: "The hit lands, though the damage is modest. Every bit counts.",
    default: "The roll settles the matter. You read the result and act on it.",
  },
  generic: [
    "The world shifts around you, patient as stone. Something here is waiting for you to make up your mind.",
    "You take stock. The scene is still, but it is the stillness of a held breath.",
    "The moment stretches. Around you, the small sounds of the world continue — wind, water, the distant cry of something hunting.",
  ],
  roads: ["deeper into the wilds", "toward the village lights", "past the old keep", "into the dark wood"],
  watchHint: " Near the edge of the firelight, something watches. It does not approach — yet.",
  shortRest: "You catch your breath, tend to your wounds, and recover your strength.",
  status: (c: AdventureState["character"], sceneTitle: string, location: string, quest: string) =>
    `You are ${c.name}. ${sceneTitle} — ${location}. Current quest: ${quest}. The world waits on your next move.`,
  oraclePrefix: "The oracle answers:",
};

// ---------------------------------------------------------------------------
// Banks — Português (PT-BR)
// ---------------------------------------------------------------------------

const PT: typeof EN = {
  openings: [
    "Um vento frio carrega o cheiro de chuva e de pedra antiga. Diante de você o trilho se divide: um caminho desce em direção a uma vila cujas luzes tremem como brasas moribundas, o outro sobe para uma floresta onde algo grande e paciente se move entre as árvores.",
    "Você está na soleira de uma torre de vigia desmoronada, a porta pendurada torta numa única dobradiça. Lá dentro, o chão está coberto de cacos de cerâmica — e na poeira há pegadas frescas, descalças, que descem as escadas.",
    "O amanhecer se quebra sobre as ruínas de um templo antigo. Seus sinos, silenciosos há muito tempo, tocam uma única vez — e então emudecem. Um jovem mensageiro espera na estrada com uma carta selada endereçada a você, pelo seu nome.",
    "A taverna silencia quando você entra. Uma figura encapuzada no canto desliza um mapa de pergaminho na sua direção sem dizer nada. Nas colinas além da vila, ao que parece, encontraram uma porta que não deveria existir.",
    "O trovão rola sobre o charco. Você está sozinho na estrada, a três dias da última vila, quando avista uma coluna de fumaça subindo de uma fazenda que deveria estar vazia.",
  ],
  oracleFlavor: [
    "Os ventos sussurram sua resposta.",
    "Você fecha os olhos e escuta o mundo.",
    "Os ossos caem e o padrão fica claro.",
    "Um corvo na verga da porta inclina a cabeça, como se esperasse.",
    "A chama da vela se curva, apontando seu veredito.",
  ],
  explore: [
    "Você avança para dentro do lugar. A poeira gira na luz da sua tocha; as paredes aqui são mais antigas que a vila lá em cima, talhadas com símbolos que nenhum estudioso vivo soube nomear. Algo brilha no fundo da câmara.",
    "Depois de uma busca cuidadosa, você encontra uma pequena caixa de ferro escondida sob uma laje solta. Está trancada, mas a fechadura parece simples.",
    "O trilho se estreita entre pedras úmidas. Você ouve água gotejando adiante — e, sob ela, o arranhar fraco de algo sendo arrastado pelo chão.",
    "Você encontra sinais de um acampamento recente: cinzas frias, corda cortada e uma pegada grande demais para qualquer humano que você já conheceu.",
    "No alto da parede, quase invisível, um mural mostra uma figura segurando uma chave de luz pura. A chave é o último painel — a história está inacabada.",
  ],
  travel: [
    "Você parte. A estrada se desenrola diante de você, entre muros de pedra e cercas vivas cheias de pássaros. Ao meio-dia, os marcos que lhe disseram para esperar não apareceram — ou você está perdido, ou o mapa mente.",
    "Você viaja o dia inteiro até o anoitecer. Pouco antes do crepúsculo, cruza uma colina e avista um povoado abaixo, com chaminés fumegando. Parece pacífico. Parece, talvez, pacífico demais.",
    "O caminho passa por um bosque alagado onde a névoa se move contra o vento. Duas vezes você tem certeza de ouvir passos acompanhando você, fora de vista.",
    "Você faz um bom progresso. A estrada está quieta, o tempo firma — e isso, na sua experiência, é exatamente quando o problema começa.",
  ],
  talk: [
    "Eles medem você com um olhar longo antes de responder. \"Você não é daqui\", dizem, \"mas tem os olhos de quem cumpre a palavra. Dá para trabalhar com isso.\"",
    "A conversa é desconfiada no início, depois esquenta. Por fim, eles se aproximam e abaixam a voz: \"Se você quer mesmo ajudar, não vá perguntar sobre a torre na praça. Pergunte sobre o túnel debaixo do moinho.\"",
    "Eles riem, mas não há humor naquilo. \"Todo mundo que remexe no velho castelo acaba no rio. Os que têm sorte.\"",
    "Um acordo é fechado — por enquanto. Você consegue a informação que precisava, e eles conseguem uma promessa que pretendem cobrar.",
  ],
  encounters: [
    "Adiante, o chão está coberto de ossos brancos, rachados e limpos. Nada se move — mas nada aqui está morto há muito tempo.",
    "Você sente o cheiro antes de ver: fumaça, carne assando e o murmúrio baixo de vozes ao redor de uma fogueira escondida atrás do morro.",
    "A floresta prende a respiração. Então, com um guincho, uma revoada de pássaros irrompe da copa — algo grande acabou de se mover por entre as árvores.",
    "Uma figura bloqueia a estrada. Usa um capuz contra a chuva e, no cinto, pendura um sino que não toca.",
  ],
  rest: [
    "Você acampa e deixa o fogo conversar com a escuridão. A noite passa sem alarme — uma pequena misericórdia que você aceita com gratidão.",
    "Você encontra abrigo na cavidade de uma grande árvore caída. Dorme em turnos, armas ao alcance, e a floresta o deixa em paz.",
    "O descanso é inquieto. Duas vezes você desperta com sons que não eram nada. De manhã você está descansado, se não inteiramente em paz.",
  ],
  featureUse: [
    "Você invoca seu treinamento, e o mundo se dobra para encontrá-lo. O momento paira — então o efeito se instala, e você sente a maré virar a seu favor.",
    "O poder responde prontamente. Os que estão por perto recuam um passo, subitamente cientes de que você é mais do que aparenta.",
    "Funciona — melhor do que você esperava. Você guarda o momento; tais dons não são infinitos, e você sabe disso.",
  ],
  reactions: {
    attackCrit:
      "O golpe aterrissa com precisão devastadora — um golpe perfeito. Seu inimigo cambaleia, ferido e desequilibrado.",
    attackHit:
      "Seu ataque conecta. Há um grunhido de dor, e a luta muda ligeiramente a seu favor.",
    attackMiss:
      "Seu golpe passa longe, raspando faíscas da pedra atrás do inimigo. Ele sorri.",
    attackCritFail:
      "Um erro catastrófico — sua arma ressoa, e você fica exposto por um instante longo demais.",
    saveSuccess:
      "Você range os dentes e se livra do efeito, firme contra a pressão.",
    saveFail:
      "O efeito se instala apesar dos seus esforços — você sente ele penetrar, e terá que atravessar a luta.",
    checkCrit: "Não apenas um sucesso — um triunfo. O resultado supera todas as expectativas, e os que assistem percebem.",
    checkSuccess: "Você consegue. Custa esforço, mas a tarefa cede a você.",
    checkFail: "Não sai como planejado. A tentativa falha, e você fica com as consequências.",
    checkCritFail: "Dá errado — muito errado. O que seria um revés virou um problema de verdade.",
    damageBig:
      "O dano é significativo — o ferimento é real, e a confiança do inimigo racha visivelmente.",
    damageSmall: "O golpe aterrissa, embora o dano seja modesto. Cada ponto conta.",
    default: "A rolagem resolve a questão. Você lê o resultado e age de acordo.",
  },
  generic: [
    "O mundo se move ao seu redor, paciente como pedra. Algo aqui espera que você tome uma decisão.",
    "Você avalia a cena. Tudo está parado, mas é a quietude de uma respiração presa.",
    "O momento se alonga. Ao redor, os pequenos sons do mundo continuam — vento, água, o grito distante de algo caçando.",
  ],
  roads: ["mais fundo no ermo", "em direção às luzes da vila", "para além do velho castelo", "para dentro da mata escura"],
  watchHint: " Perto da borda da luz da fogueira, algo observa. Não se aproxima — ainda.",
  shortRest: "Você recupera o fôlego, trata dos ferimentos e retoma as forças.",
  status: (c: AdventureState["character"], sceneTitle: string, location: string, quest: string) =>
    `Você é ${c.name}. ${sceneTitle} — ${location}. Missão atual: ${quest}. O mundo espera o seu próximo passo.`,
  oraclePrefix: "O oráculo responde:",
};

function bank(language: GmLanguage): typeof EN {
  return language === "pt-BR" ? PT : EN;
}

// ---------------------------------------------------------------------------
// Opening scene generation
// ---------------------------------------------------------------------------

export function generateOpening(
  adventure: AdventureState,
  language: GmLanguage = "en",
): string {
  const b = bank(language);
  const c = adventure.character;
  const who =
    c.system === "dnd5e"
      ? `${c.name}, ${getDndDerived(c).raceName} ${getDndDerived(c).className} da tradição ${getDndDerived(c).subclassName}`
      : c.system === "pf2e"
        ? `${c.name}, ${getPf2eDerived(c).className}`
        : `${c.name}, aventureiro de ${getGurpsDerived(c).pointTotal} pontos`;
  return language === "pt-BR"
    ? `A história de ${who} começa ${pick(b.openings).replace(/^./, (ch) => ch.toLowerCase())}`
    : `The tale of ${who} begins in ${pick(b.openings)}`;
}

// ---------------------------------------------------------------------------
// Oracle (yes / no / but / and) — the classic solo-RPG engine
// ---------------------------------------------------------------------------

export function oracleResponse(
  question: string,
  language: GmLanguage = "en",
): string {
  const b = bank(language);
  const roll = Math.floor(Math.random() * 20) + 1;
  const verdict =
    language === "pt-BR"
      ? roll <= 5
        ? "Não."
        : roll <= 8
          ? "Não, mas..."
          : roll <= 12
            ? "Sim, mas..."
            : roll <= 17
              ? "Sim."
              : "Sim, e..."
      : roll <= 5
        ? "No."
        : roll <= 8
          ? "No, but..."
          : roll <= 12
            ? "Yes, but..."
            : roll <= 17
              ? "Yes."
              : "Yes, and...";
  return `${pick(b.oracleFlavor)} ${b.oraclePrefix} ${verdict}`;
}

// ---------------------------------------------------------------------------
// Main responder
// ---------------------------------------------------------------------------

function reactToDice(dice: DiceResult, language: GmLanguage): string {
  const b = bank(language);
  const r = b.reactions;
  const outcome = dice.outcome;
  switch (dice.kind) {
    case "attack": {
      if (outcome === "critical-success") return pick([r.attackCrit, "Você encontra a abertura que procurava e a explora sem piedade. É um golpe limpo e brutal."]);
      if (outcome === "success") return pick([r.attackHit, "A lâmina encontra carne. Não é um golpe mortal, mas é revelador."]);
      if (outcome === "failure") return pick([r.attackMiss, "Você se compromete com o golpe, mas ele lê seu movimento e se esquiva. Seu impulso o leva meio passo longe demais."]);
      return pick([r.attackCritFail, "O ataque falha tão mal que você quase abaixa completamente a guarda."]);
    }
    case "save":
      return outcome === "success" || outcome === "critical-success" ? r.saveSuccess : r.saveFail;
    case "skill":
    case "check": {
      if (outcome === "critical-success") return r.checkCrit;
      if (outcome === "success") return r.checkSuccess;
      if (outcome === "failure") return r.checkFail;
      return r.checkCritFail;
    }
    case "damage":
      return dice.total >= 8 ? r.damageBig : r.damageSmall;
    default:
      return r.default;
  }
}

export function localRespond(
  turn: GmTurn,
  adventure: AdventureState,
  language: GmLanguage = "en",
): string {
  const b = bank(language);
  const text = (turn.playerText ?? "").trim();
  const lower = text.toLowerCase();

  // Oracle questions
  if (text.startsWith("oracle") || /^[?]|oráculo|oraculo/.test(lower) || text.endsWith("?")) {
    const q = text
      .replace(/^oracle[:,\s]*/i, "")
      .replace(/^[?]/, "")
      .replace(/^(oráculo|oraculo)[:,\s]*/i, "")
      .trim();
    return oracleResponse(q || "Will the next step go well?", language);
  }

  // Rest handling
  if (/(short rest|long rest|rest|sleep|camp|meditat|settle in|descansar|dormir|acampar|meditar)/.test(lower)) {
    const long = /(long rest|sleep|night|dormir|noite|descanso longo)/.test(lower);
    return (
      (long ? pick(b.rest) : b.shortRest) +
      (chance(0.2) ? b.watchHint : "")
    );
  }

  // Combat actions
  if (/(attack|fight|strike|swing|shoot|hit|charge|engage|slash|stab|atacar|lutar|golpear|disparar|investir)/.test(lower)) {
    if (turn.dice) return reactToDice(turn.dice, language);
    return pick(b.encounters) + (language === "pt-BR" ? " Você se prepara e escolhe seu momento." : " You ready yourself and choose your moment.");
  }

  // Exploration
  if (/(look|search|explore|investigat|inspect|examine|check|scout|olhar|procurar|explorar|investigar|inspecionar|examinar|reconhecer)/.test(lower)) {
    return pick(b.explore) + (turn.dice ? " " + reactToDice(turn.dice, language) : "");
  }

  // Movement / travel
  if (/(go |walk|travel|enter|leave|follow|head|move|approach|north|south|east|west|road|path|climb|descend|open|ir|andar|viajar|entrar|sair|seguir|seguir|mover|aproximar|norte|sul|leste|oeste|estrada|caminho|subir|descer|abrir)/.test(lower)) {
    return pick(b.travel) + (chance(0.35) ? " " + pick(b.encounters) : "");
  }

  // Social
  if (/(talk|speak|ask|negotiat|barter|persuade|convince|greet|call out|shout|yell|lie|flatter|falar|perguntar|negociar|barganhar|persuadir|convencer|cumprimentar|gritar|mentir|elogiar)/.test(lower)) {
    return pick(b.talk);
  }

  // Class feature use
  if (/(use|activate|channel|invoke|cast|rage|inspire|smite|summon|focus|usar|ativar|canalizar|invocar|conjurar|fúria|inspirar|concentrar)/.test(lower)) {
    return pick(b.featureUse);
  }

  // Status recap
  if (/(status|inventory|who am i|recap|where am i|what do i know|status|inventário|quem sou|recapitular|onde estou)/.test(lower)) {
    const c = adventure.character;
    return b.status(c, adventure.sceneTitle, adventure.location, adventure.quest[adventure.quest.length - 1] ?? (language === "pt-BR" ? "nenhuma definida" : "none set"));
  }

  // Generic
  if (turn.dice) return reactToDice(turn.dice, language);
  return (
    pick(b.generic) +
    ` ${language === "pt-BR" ? "O caminho adiante leva" : "The road ahead leads"} ${pick(b.roads)}.`
  );
}
