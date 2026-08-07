// ============================================================================
// Oraculum — Local Game Master.
// A rule-based solo-play narrator that honors dice outcomes, rests and
// exploration. Fully offline; used as the default GM and as a fallback when
// the live LLM endpoint is not configured. Bilingual: English + PT-BR.
// ============================================================================

import type {
  AdventurePrefs,
  AdventureState,
  DiceResult,
  GmLanguage,
  GmTurn,
} from "../types";
import { prefsOf } from "../types";
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
  // Genre-flavored openings — chosen when the Adventure Setup matches.
  genreOpenings: {
    "high fantasy": ["Ancient magic hums beneath the kingdom's oldest stones, and the road before you glows with the weight of prophecy.", "Banners snap in the wind over a land that remembers dragons — and expects their return."],
    "dark fantasy": ["The sun has not truly risen in weeks. What light reaches this land is grey, and the woods whisper with things that should have stayed buried.", "A curse has settled over the region like frost — quiet, patient, and spreading."],
    "sword & sorcery": ["The dungeon mouth yawns beneath the temple steps, and somewhere in the dark, a crown that men killed for is waiting for someone bold enough to take it.", "Savage lands, bloodied gold, and a name you can carve into history — if you survive the first step."],
    "mythic & epic": ["The gods have placed their thumb on the scale of your fate. Old songs will one day be sung of what begins here.", "Across the sea, a titan stirs. The world has need of a story with a living hero in it."],
    "fairy tale": ["The forest path is lined with foxglove and half-remembered warnings, and every gift you are offered carries a small, smiling price.", "Three roads meet at the hollow tree. One leads home, one leads to the castle, and one — the one with the moonlight on it — leads to the queen."],
    "sci-fi": ["The station's docking clamps hiss open, and the void beyond the viewport is vast, patient, and full of things that do not answer hails.", "Your ship's logs have recorded nothing for twelve hours. The last message from the colony was a single word: 'wrong'."],
    "space opera": ["The war has been over for a decade, but the wreckage still burns in the asteroid belt — and someone just lit a beacon inside it.", "An admiral's seal, a dead courier, and a star map to a place that officially does not exist. That is how your adventure begins."],
    cyberpunk: ["The neon rain over the sprawl tastes of rust and bad luck. Your cred chip is nearly empty, and the fix is always somewhere dangerous.", "A ghost in the net is selling a memory that a megacorp would kill to delete — and it has your name on it."],
    "post-apocalyptic": ["The old highway runs east through the dust. Beyond the dead city, a radio tower is broadcasting a message that has not changed in three weeks.", "The water is scarce, the nights are cold, and the ruins still hold things worth trading — and things worth running from."],
    steampunk: ["The city's brass heart thunders beneath the cobblestones, and the airship docks are thick with spies. Someone has stolen a design that could end the age.", "Steam, gears and grand conspiracies — your ticket to the upper city is a lie, but it is a very well-forged lie."],
    horror: ["The last light of dusk dies behind you, and the house at the end of the lane has been waiting for you all your life.", "The fog is wrong. It moves against the wind, and inside it, something is humming a song you only half-remember."],
    western: ["Dust, whiskey, and a town with a fresh grave and a lie for every stranger. The bounty poster has your face on it — and it is not the one you expected.", "The train is due at noon. The outlaw gang wants the vault, the sheriff wants the gang, and you want to be somewhere else by sundown."],
  },
  // NPC generator banks
  npcNames: ["Maren", "Corvin", "Elara", "Bram", "Sable", "Torvin", "Ilyse", "Rook", "Veska", "Aldric", "Nia", "Dorian", "Petra", "Kessler", "Juno", "Wren"],
  npcRoles: ["a scarred caravan guard", "a hedge apothecary", "a disgraced scholar", "a quiet bounty hunter", "an innkeeper with too many questions", "a wandering storyteller", "a retired soldier", "a smuggler captain", "a village elder", "an apprentice enchanter"],
  npcTraits: ["carries a coin they never spend", "speaks only in questions", "laughs too easily in danger", "has not slept in days, by their own admission", "is missing the ring finger of their left hand", "never mentions the war unless pressed", "tends to whistle when lying", "keeps a charm of dried flowers"],
  npcSecrets: ["They know the location of the thing everyone is looking for — and they mean to use it first.", "They are in debt to the same shadowy figures that seem to run this region.", "They once survived an encounter with the very force behind your quest.", "They recognize your name from a story they never expected to be true.", "They carry a letter that was meant to reach you years ago.", "They are not entirely human, and they are trying very hard to hide it."],
  npcRandomEvent: ["A hawk circles twice overhead and then, deliberately, flies toward the horizon as if showing you the way.", "Far off, a bell tolls once — though the nearest bell tower is days away.", "The weather turns without warning; the sky darkens and holds its breath.", "A stranger passes you on the road, nods, and says your name without explanation.", "You find a fresh coin on the path — its face is stamped with a sigil you have seen in a dream."],
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
  // Aberturas com sabor de gênero — usadas quando a Configuração da Aventura coincide.
  genreOpenings: {
    "high fantasy": ["Magia antiga vibra sob as pedras mais velhas do reino, e a estrada diante de você brilha com o peso da profecia.", "Estandartes estalam ao vento sobre uma terra que lembra dos dragões — e espera o retorno deles."],
    "dark fantasy": ["O sol não nasce de verdade há semanas. A luz que alcança esta terra é cinzenta, e as matas sussurram com coisas que deveriam ter ficado enterradas.", "Uma maldição se instalou sobre a região como geada — silenciosa, paciente e se espalhando."],
    "sword & sorcery": ["A boca da masmorra se abre sob os degraus do templo, e em algum lugar no escuro, uma coroa pela qual homens mataram espera alguém corajoso o bastante para tomá-la.", "Terras selvagens, ouro ensanguentado e um nome que você pode gravar na história — se sobreviver ao primeiro passo."],
    "mythic & epic": ["Os deuses puseram o polegar na balança do seu destino. Canções antigas um dia serão cantadas sobre o que começa aqui.", "Além do mar, um titã desperta. O mundo precisa de uma história com um herói vivo nela."],
    "fairy tale": ["O caminho da floresta é ladeado por dedaleiras e avisos meio esquecidos, e todo presente que lhe oferecem tem um pequeno preço sorridente.", "Três estradas se encontram na árvore oca. Uma leva para casa, uma leva ao castelo, e uma — a que tem luar — leva à rainha."],
    "sci-fi": ["As travas de acoplamento da estação abrem com um silvo, e o vazio além da vigia é vasto, paciente e cheio de coisas que não respondem às chamadas.", "Os registros da sua nave não anotaram nada há doze horas. A última mensagem da colônia foi uma única palavra: 'errado'."],
    "space opera": ["A guerra acabou há uma década, mas os destroços ainda queimam no cinturão de asteroides — e alguém acaba de acender um farol dentro deles.", "Um selo de almirante, um mensageiro morto e um mapa estelar para um lugar que oficialmente não existe. É assim que sua aventura começa."],
    cyberpunk: ["A chuva de neon sobre a cidade tem gosto de ferrugem e má sorte. Seu chip de crédito está quase vazio, e a solução está sempre em algum lugar perigoso.", "Um fantasma na rede está vendendo uma memória que uma megacorporação mataria para apagar — e ela tem o seu nome."],
    "post-apocalyptic": ["A velha rodovia segue para leste pela poeira. Além da cidade morta, uma torre de rádio transmite uma mensagem que não muda há três semanas.", "A água é escassa, as noites são frias, e as ruínas ainda guardam coisas que valem troca — e coisas das quais vale a pena fugir."],
    steampunk: ["O coração de latão da cidade troveja sob as pedras do calçamento, e os docas de dirigíveis estão cheias de espiões. Alguém roubou um projeto que pode encerrar a era.", "Vapor, engrenagens e grandes conspirações — seu bilhete para a cidade alta é uma mentira, mas é uma mentira muito bem forjada."],
    horror: ["A última luz do crepúsculo morre atrás de você, e a casa no fim da viela esperou por você a vida toda.", "O nevoeiro está errado. Move-se contra o vento, e dentro dele algo canta uma canção que você só lembra pela metade."],
    western: ["Poeira, uísque e uma cidade com uma cova nova e uma mentira para cada forasteiro. O cartaz de recompensa tem o seu rosto — e não é o que você esperava.", "O trem chega ao meio-dia. A quadrilha quer o cofre, o xerife quer a quadrilha, e você quer estar em outro lugar antes do pôr do sol."],
  },
  // Banco do gerador de NPCs
  npcNames: ["Maren", "Corvin", "Elara", "Bram", "Sable", "Torvin", "Ilyse", "Rook", "Veska", "Aldric", "Nia", "Dorian", "Petra", "Kessler", "Juno", "Wren"],
  npcRoles: ["um guarda de caravana marcado por cicatrizes", "um boticário de beira de estrada", "um estudioso em desgraça", "um caçador de recompensas quieto", "um estalajadeiro com perguntas demais", "um contador de histórias andarilho", "um soldado aposentado", "um capitão contrabandista", "um ancião da aldeia", "um aprendiz de encantador"],
  npcTraits: ["carrega uma moeda que nunca gasta", "fala apenas em perguntas", "ri com facilidade demais em perigo", "não dorme há dias, pelas próprias palavras", "não tem o dedo anelar da mão esquerda", "nunca menciona a guerra a menos que pressionado", "costuma assobiar quando mente", "guarda um amuleto de flores secas"],
  npcSecrets: ["Eles sabem onde está a coisa que todos procuram — e pretendem usá-la primeiro.", "Eles devem dinheiro às mesmas figuras sombrias que parecem controlar a região.", "Eles já sobreviveram a um encontro com a própria força por trás da sua missão.", "Eles reconhecem seu nome de uma história que nunca esperaram que fosse verdade.", "Eles carregam uma carta que deveria ter chegado a você anos atrás.", "Eles não são inteiramente humanos, e tentam muito esconder isso."],
  npcRandomEvent: ["Um falcão circula duas vezes e então, deliberadamente, voa rumo ao horizonte como se mostrasse o caminho.", "Ao longe, um sino soa uma vez — embora a torre de sino mais próxima esteja a dias de distância.", "O tempo muda sem aviso; o céu escurece e prende a respiração.", "Um estranho passa por você na estrada, acena e diz seu nome sem explicação.", "Você encontra uma moeda nova no caminho — cunhada com um símbolo que você já viu em um sonho."],
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
  const prefs: AdventurePrefs = prefsOf(c.adventurePrefs);
  const who =
    c.system === "dnd5e"
      ? `${c.name}, ${getDndDerived(c).raceName} ${getDndDerived(c).className} da tradição ${getDndDerived(c).subclassName}`
      : c.system === "pf2e"
        ? `${c.name}, ${getPf2eDerived(c).className}`
        : `${c.name}, aventureiro de ${getGurpsDerived(c).pointTotal} pontos`;
  // Pref-aware flavor: when the Adventure Setup genre has its own opening lines,
  // prefer them; otherwise fall back to the timeless generic openings.
  const genreLines = b.genreOpenings[prefs.genre as keyof typeof b.genreOpenings];
  const opening = pick(genreLines && genreLines.length > 0 ? genreLines : b.openings);
  return language === "pt-BR"
    ? `A história de ${who} começa ${opening.replace(/^./, (ch) => ch.toLowerCase())}`
    : `The tale of ${who} begins in ${opening}`;
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

// ---------------------------------------------------------------------------
// NPC generator — names a stranger from the banks and gives them a hook.
// ---------------------------------------------------------------------------

function npcGenerator(language: GmLanguage): string {
  const b = bank(language);
  const name = pick(b.npcNames);
  const role = pick(b.npcRoles);
  const trait = pick(b.npcTraits);
  const secret = pick(b.npcSecrets);
  if (language === "pt-BR") {
    return `Você cruza com ${name}, ${role}. Elu ${trait}. Enquanto conversam, você percebe algo: ${secret}`;
  }
  return `You cross paths with ${name}, ${role}. They ${trait}. As you talk, you notice something: ${secret}`;
}

export function localRespond(
  turn: GmTurn,
  adventure: AdventureState,
  language: GmLanguage = "en",
): string {
  const b = bank(language);
  const text = (turn.playerText ?? "").trim();
  const lower = text.toLowerCase();

  // NPC generator — "npc", "who is this", "meet someone"…
  if (
    /(^|\s)(npc|stranger|who is (this|that)|meet someone|introduce someone|roll an npc|personagem|quem é (esse|essa)|estranho|apresente alguém|conhecer alguém)/.test(
      lower,
    )
  ) {
    return npcGenerator(language);
  }

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
    const found = pick(b.explore);
    const result = turn.dice ? ` ${reactToDice(turn.dice, language)}` : "";
    const event = chance(0.25) ? ` ${pick(b.npcRandomEvent)}` : "";
    return found + result + event;
  }

  // Movement / travel — difficulty from the Adventure Setup tunes how often
  // trouble finds you on the road.
  if (/(go |walk|travel|enter|leave|follow|head|move|approach|north|south|east|west|road|path|climb|descend|open|ir|andar|viajar|entrar|sair|seguir|seguir|mover|aproximar|norte|sul|leste|oeste|estrada|caminho|subir|descer|abrir)/.test(lower)) {
    const prefs: AdventurePrefs = prefsOf(adventure.character.adventurePrefs);
    const danger =
      prefs.difficulty === "deadly"
        ? 0.65
        : prefs.difficulty === "challenging"
          ? 0.5
          : prefs.difficulty === "lenient"
            ? 0.2
            : 0.35;
    let out = pick(b.travel);
    if (chance(danger)) out += " " + pick(b.encounters);
    else if (chance(0.25)) out += " " + pick(b.npcRandomEvent);
    return out;
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
