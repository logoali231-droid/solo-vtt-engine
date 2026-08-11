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
import { adventureScene, prefsOf } from "../types";
import { getDndDerived, getGurpsDerived, getPf2eDerived } from "../character";
import { formatMod } from "../dice";

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
  searchFail: [
    "You search thoroughly, but the place yields nothing — no hidden catch, no secret latch, nothing out of place.",
    "You turn the room over, but whatever you were hoping to find is not here — or is hidden far better than this.",
    "The dust is undisturbed and the seams are sealed. If there is anything here, it does not want to be found.",
    "You check every shadow and every join. Nothing. The quiet feels pointed, as if the place is keeping its secrets.",
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
  talkFail: [
    "They go cold the moment you press. The warmth drains from their voice: \"I've said what I've said. Don't push it.\"",
    "They see through you in a heartbeat and shut the door on the conversation. Whatever you were hoping to get, you won't get it this way.",
    "Your words land wrong — too eager, too rehearsed. They fold their arms and watch you like you've already lost.",
    "The silence after your question is answer enough. They turn away, and you understand the matter is closed.",
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
  gurpsCrit: "The dice land in your favor as if they had a grudge against the world.",
  gurpsCritFail: "The dice betray you utterly — an 18 on the floor, and the universe grins.",
  gurpsWide: "A clean, professional result — your training shows. The margin is wide and the outcome beyond doubt.",
  gurpsBad: "It goes badly — the roll misses by a wide margin, and you are left scrambling to recover.",
  pf2eCrit: "The result is exceptional — ten or more over the DC, and the world bends to your will.",
  pf2eCritFail: "It goes wrong by a full ten — a spectacular collapse that the whole scene will remember.",
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
  // Genre-flavored filler — used when the Adventure Setup genre matches.
  genreGeneric: {
    "high fantasy": [
      "The world hums with old magic — every road, every ruin, every rumor is a thread someone is waiting for you to pull.",
      "Prophecy lingers in the air like smoke. The kingdom's fate is being decided in small rooms and dark forests, and you are one of the few who know it.",
    ],
    "dark fantasy": [
      "The land is sick, and the sickness has a name — though speaking it draws attention. You carry what light you can.",
      "Hope here is a scarce currency, and you spend it carefully. Somewhere beneath the grey, something is counting your steps.",
    ],
    cyberpunk: [
      "The city runs on neon, chrome and bad debt. Every favor is a transaction, every ally a liability — and the net never forgets.",
      "Rain on the glass, red warning glyphs in your peripheral vision. The corporations play long games; you play short, sharp ones.",
    ],
    "sci-fi": [
      "The station hums with recycled air and the quiet tension of people who have nowhere else to go. Out there, the dark is patient.",
      "Signal lag, dead channels, a log that refuses to explain itself. Whatever is out here, it wanted you to come alone.",
    ],
    horror: [
      "The silence has weight, and it is listening. You learn quickly which shadows are empty and which are merely patient.",
      "Every instinct you own says leave. But the door is open, the light is on, and something in the house already knows your name.",
    ],
    western: [
      "Dust on the wind, a town with one street and too many secrets. The map says the next town is a day away; the locals say it's a lifetime.",
      "The sun's gone low and the shadows are long. Out here, a man's word is worth about as much as his aim.",
    ],
  },
  genreExplore: {
    "high fantasy": [
      "You search the chamber. Dust, old coin, and a sigil on the wall that glows faintly when you pass your hand over it — a door no one has opened in an age.",
      "Among the rubble you find a leather satchel, waterlogged but whole, and inside it a sealed letter addressed to no one you have ever heard of.",
    ],
    "dark fantasy": [
      "You search carefully. Beneath a floorboard you find a child's shoe, a rusted locket, and a scrap of paper with a name crossed out in blood.",
      "The walls here are carved with warnings in a language that is almost familiar. One symbol repeats: a door, always a door.",
    ],
    cyberpunk: [
      "You sweep the data cache. Encrypted files, a dead man's credentials, and a location ping that shouldn't exist anymore — it is active now.",
      "Under the floor grating you find a burner deck, still warm, with a single message open: 'They know. Move.'",
    ],
    "sci-fi": [
      "You sweep the compartment. Frozen air, boot prints that lead nowhere, and a service log that ends abruptly mid-sentence on a word you don't like.",
      "The scan returns a signature it cannot classify. It is not moving, but it is definitely waiting.",
    ],
    horror: [
      "You search by lamplight, heart loud in your ears. The dust is undisturbed — except for a single set of footprints that walk the walls.",
      "Tucked in the crawlspace you find a photograph of this house, taken from inside, with a figure in the window you do not recognize.",
    ],
    western: [
      "You search the abandoned claim. A tin of beans, a broken watch, and a deed with a name scratched out — the survey date is next month.",
      "Behind the saloon's false wall you find a strongbox, empty, and a wanted poster with your description on it.",
    ],
  },
  heal: [
    "You tend the wound with steady hands — pressure, binding, a breath held and released. The hurt settles, and the world steadies around you.",
    "You set to work quietly, cleaning and dressing the injury. It is careful, unglamorous work, and it matters.",
    "The healing is rough but true. You feel the ache ease, and the day seems a little less hostile.",
  ],
  cast: [
    "You reach for the weave and it answers — a rush of warmth and intent as the magic takes shape in your hands and goes where you send it.",
    "Words of power fall from your lips like a practiced song. The air thickens, brightens, and obeys.",
    "The casting is clean and quick. Magic snaps into being around you, and the world rearranges itself to fit what you have asked.",
  ],
  companion: [
    "Your companions move with you, watching the flanks. Whatever comes next, you will not face it alone.",
    "One of your company catches your eye and nods — a small thing, but in moments like this it means everything.",
    "The company settles into a familiar rhythm around you. You are more than one blade tonight, and it shows.",
  ],
  weather: [
    " The wind shifts, carrying a scent of rain and wet earth.",
    " A thin mist crawls in from the low ground, muffling sound.",
    " The light changes — a cloud passing, a moment of grey — and then moves on.",
    " Somewhere overhead, distant thunder rolls without hurry.",
  ],
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
  searchFail: [
    "Você revira tudo com cuidado, mas o lugar não revela nada — nenhum encaixe escondido, nenhum trinco secreto, nada fora do lugar.",
    "Você vira o cômodo do avesso, mas o que esperava encontrar não está aqui — ou está escondido muito melhor do que isso.",
    "A poeira está intacta e as frestas, seladas. Se há algo aqui, não quer ser encontrado.",
    "Você confere cada sombra e cada emenda. Nada. O silêncio parece deliberado, como se o lugar guardasse seus segredos.",
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
  talkFail: [
    "Eles esfriam na hora em que você insiste. O calor some da voz: \"Já disse o que tinha para dizer. Não insista.\"",
    "Eles veem através de você num instante e fecham a porta da conversa. O que você esperava conseguir, não vai ser assim.",
    "Suas palavras saem erradas — ansiosas demais, ensaiadas demais. Eles cruzam os braços e olham para você como quem já venceu.",
    "O silêncio depois da sua pergunta já é a resposta. Eles se viram, e você entende que o assunto está encerrado.",
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
  gurpsCrit: "Os dados caem a seu favor como se guardassem rancor do mundo.",
  gurpsCritFail: "Os dados o traem por completo — um 18 na mesa, e o universo sorri.",
  gurpsWide: "Um resultado limpo e profissional — seu treinamento aparece. A margem é ampla e o desfecho não deixa dúvidas.",
  gurpsBad: "Vai mal — a rolagem erra por uma margem larga, e você fica se recuperando do baque.",
  pf2eCrit: "O resultado é excepcional — dez ou mais acima da CD, e o mundo se curva à sua vontade.",
  pf2eCritFail: "Dá errado por dez completos — um colapso espetacular que a cena inteira vai lembrar.",
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
  // Recheio com sabor de gênero — usado quando a Configuração da Aventura coincide.
  genreGeneric: {
    "high fantasy": [
      "O mundo vibra com magia antiga — cada estrada, cada ruína, cada boato é um fio que alguém espera que você puxe.",
      "A profecia paira no ar como fumaça. O destino do reino está sendo decidido em salas pequenas e florestas escuras, e você é um dos poucos que sabem disso.",
    ],
    "dark fantasy": [
      "A terra está doente, e a doença tem nome — embora dizê-lo atraia atenção. Você carrega a luz que consegue.",
      "A esperança aqui é moeda escassa, e você a gasta com cuidado. Sob o cinza, algo está contando seus passos.",
    ],
    cyberpunk: [
      "A cidade funciona a néon, cromo e dívidas podres. Todo favor é uma transação, todo aliado um passivo — e a rede nunca esquece.",
      "Chuva no vidro, glifos vermelhos de alerta na visão periférica. As corporações jogam jogos longos; você joga os curtos e afiados.",
    ],
    "sci-fi": [
      "A estação murmura com ar reciclado e a tensão quieta de gente sem outro lugar para ir. Lá fora, o escuro é paciente.",
      "Atraso de sinal, canais mortos, um registro que se recusa a se explicar. O que quer que esteja aqui, queria que você viesse sozinho.",
    ],
    horror: [
      "O silêncio tem peso, e está escutando. Você logo aprende quais sombras estão vazias e quais são apenas pacientes.",
      "Todo instinto que você tem diz para ir embora. Mas a porta está aberta, a luz acesa, e algo dentro da casa já sabe o seu nome.",
    ],
    western: [
      "Poeira no vento, uma cidade com uma rua só e segredos demais. O mapa diz que a próxima vila está a um dia; os locais dizem que é uma vida.",
      "O sol já desceu e as sombras estão longas. Aqui fora, a palavra de um homem vale tanto quanto a sua pontaria.",
    ],
  },
  genreExplore: {
    "high fantasy": [
      "Você vasculha a câmara. Poeira, moedas velhas e um sigilo na parede que brilha de leve quando a mão passa por cima — uma porta que ninguém abria há eras.",
      "Entre os escombros você encontra uma bolsa de couro, encharcada mas inteira, e dentro uma carta selada endereçada a ninguém que você já tenha ouvido falar.",
    ],
    "dark fantasy": [
      "Você procura com cuidado. Sob uma tábua solta encontra um sapato de criança, um medalhão enferrujado e um pedaço de papel com um nome riscado a sangue.",
      "As paredes aqui são talhadas com avisos numa língua quase familiar. Um símbolo se repete: uma porta, sempre uma porta.",
    ],
    cyberpunk: [
      "Você varre o cache de dados. Arquivos criptografados, credenciais de um morto e um ping de localização que não deveria mais existir — está ativo agora.",
      "Sob a grade do piso você encontra um deck descartável, ainda quente, com uma única mensagem aberta: 'Eles sabem. Movam-se.'",
    ],
    "sci-fi": [
      "Você varre o compartimento. Ar congelado, pegadas que não levam a lugar nenhum e um registro de manutenção que termina no meio de uma frase, numa palavra que você não gosta.",
      "A varredura retorna uma assinatura que não consegue classificar. Não está se movendo, mas definitivamente está esperando.",
    ],
    horror: [
      "Você procura à luz da lanterna, o coração alto nos ouvidos. A poeira está intocada — exceto por um único par de pegadas que andam pelas paredes.",
      "Escondido no vão você encontra uma fotografia desta casa, tirada de dentro, com uma figura na janela que você não reconhece.",
    ],
    western: [
      "Você revira a mina abandonada. Uma lata de feijão, um relógio quebrado e uma escritura com um nome raspado — a data do levantamento é mês que vem.",
      "Atrás da parede falsa do saloon você encontra um cofre, vazio, e um cartaz de procurado com a sua descrição.",
    ],
  },
  heal: [
    "Você trata o ferimento com mãos firmes — pressão, atadura, uma respiração presa e solta. A dor se assenta, e o mundo se estabiliza ao seu redor.",
    "Você trabalha em silêncio, limpando e enfaixando a lesão. É um trabalho cuidadoso, sem glamour, e importa.",
    "A cura é rústica mas verdadeira. Você sente o incômodo aliviar, e o dia parece um pouco menos hostil.",
  ],
  cast: [
    "Você alcança a teia e ela responde — uma onda de calor e intenção enquanto a magia ganha forma nas suas mãos e vai para onde você a envia.",
    "Palavras de poder caem dos seus lábios como uma canção ensaiada. O ar engrossa, clareia e obedece.",
    "A conjuração é limpa e rápida. A magia estala ao seu redor, e o mundo se rearranja para caber no que você pediu.",
  ],
  companion: [
    "Seus companheiros se movem com você, vigiando os flancos. O que vier, você não vai enfrentar sozinho.",
    "Um do seu grupo cruza seu olhar e acena — uma coisa pequena, mas em momentos assim significa tudo.",
    "A companhia se acomoda num ritmo familiar ao seu redor. Esta noite você é mais do que uma lâmina, e isso se nota.",
  ],
  weather: [
    " O vento muda, trazendo cheiro de chuva e terra molhada.",
    " Uma névoa rala rasteja do chão baixo, abafando os sons.",
    " A luz muda — uma nuvem passando, um momento cinzento — e segue adiante.",
    " Lá em cima, um trovão distante rola sem pressa.",
  ],
};

function bank(language: GmLanguage): typeof EN {
  return language === "pt-BR" ? PT : EN;
}

// ---------------------------------------------------------------------------
// Opening scene generation
// ---------------------------------------------------------------------------

const COMPANY_LINES: Record<string, { en: string; pt: string }> = {
  "true solo": { en: " You walk this road alone.", pt: " Você caminha esta estrada sozinho." },
  "one companion": { en: " A single trusted companion shares your road.", pt: " Um companheiro de confiança divide a estrada com você." },
  "small band": { en: " A small band of allies shares your road.", pt: " Uma pequena banda de aliados divide a estrada com você." },
  "as the adventure evolves": { en: " Your company is not fixed — fate will decide who walks beside you.", pt: " Sua companhia ainda não está definida — o destino decidirá quem caminha ao seu lado." },
  "dice decides": { en: " The oracle will decide who joins you on the road.", pt: " O oráculo decidirá quem se junta a você na estrada." },
};

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
  const scene = adventureScene(prefs);
  const hookLine =
    language === "pt-BR"
      ? " Por trás de tudo, algo antigo e paciente puxa os fios do seu destino."
      : ` Behind it all, ${scene.hook}.`;
  const companyLine =
    COMPANY_LINES[prefs.companions]?.[language === "pt-BR" ? "pt" : "en"] ?? "";
  const body = opening.replace(/[.!?]\s*$/, "");
  return language === "pt-BR"
    ? `A história de ${who} começa ${body.replace(/^./, (ch) => ch.toLowerCase())}.${hookLine}${companyLine}`
    : `The tale of ${who} begins in ${body}.${hookLine}${companyLine}`;
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

/** Extra combat flavor kept in the right language (the reaction banks are
 *  short, so a couple of longer alternates keep repeated fights fresh). */
function combatExtras(language: GmLanguage): {
  crit: string;
  hit: string;
  miss: string;
  critFail: string;
} {
  return language === "pt-BR"
    ? {
        crit: "Você encontra a abertura que procurava e a explora sem piedade. É um golpe limpo e brutal.",
        hit: "A lâmina encontra carne. Não é um golpe mortal, mas é revelador.",
        miss: "Você se compromete com o golpe, mas ele lê seu movimento e se esquiva. Seu impulso o leva meio passo longe demais.",
        critFail: "O ataque falha tão mal que você quase abaixa completamente a guarda.",
      }
    : {
        crit: "You find the opening you were looking for and exploit it without mercy — a clean, brutal strike.",
        hit: "The blade finds flesh. Not a killing blow, but a revealing one.",
        miss: "You commit to the strike, but it reads your movement and slips aside — your momentum carries you half a step too far.",
        critFail: "The attack fails so badly you nearly drop your guard entirely.",
      };
}

/** The die that was kept for the roll (higher with advantage, lower with
 *  disadvantage, otherwise the single rolled die). */
function keptDice(dice: DiceResult): number {
  if (dice.advantage && !dice.disadvantage) return Math.max(...dice.rolls);
  if (dice.disadvantage && !dice.advantage) return Math.min(...dice.rolls);
  return dice.rolls[0] ?? 0;
}

/** Localize the engine's generic modifier labels for PT-BR narration. */
function modLabel(label: string, language: GmLanguage): string {
  if (language !== "pt-BR") return label;
  const map: Record<string, string> = {
    Ability: "Atributo",
    Proficiency: "Proficiência",
    Bonus: "Bônus",
    Tier: "Grau",
    Condition: "Condição",
    Feature: "Talento",
    Equipment: "Equipamento",
    Other: "Outro",
  };
  return map[label] ?? label;
}

/** Exact math from the roll — the local narrator mirrors the rules corpus
 *  (adventure-samples.ts) by showing the same arithmetic the engine used:
 *  kept die + each modifier vs the DC, then the outcome. */
function mathLine(dice: DiceResult, language: GmLanguage): string {
  const pt = language === "pt-BR";
  const kept = keptDice(dice);
  const mods =
    dice.modifiers.length > 0
      ? ` ${pt ? "com" : "with"} ${dice.modifiers
          .map((m) => `${m.value >= 0 ? "+" : ""}${m.value} ${modLabel(m.label, language)}`)
          .join(" ")}`
      : "";
  const vs =
    dice.target !== undefined
      ? ` ${pt ? "contra a CD" : "against DC"} ${dice.target}`
      : "";
  const die =
    dice.system === "gurps" ? (pt ? "nos 3d6" : "on 3d6") : pt ? "no d20" : "on the d20";
  return `${kept} ${die}${mods} = ${dice.total}${vs}`;
}

/** Narrate a resolved roll with system-aware flavor. Mirrors the golden
 *  rules corpus (adventure-samples.ts): the outcome beat always carries the
 *  exact math (roll + modifiers vs DC), advantage/disadvantage is called out,
 *  and natural 20s / 1s are named like the corpus teaches.
 *  - GURPS: the 3d6 bell curve rewards margins, so how far the roll landed
 *    from the target drives the narration.
 *  - Pathfinder 2e: each of the four degrees of success gets its own beat.
 *  - D&D 5e: classic critical / success / failure beats. */
function reactToDice(
  dice: DiceResult,
  adventure: AdventureState,
  language: GmLanguage,
): string {
  const b = bank(language);
  const r = b.reactions;
  const outcome = dice.outcome;
  const ex = combatExtras(language);
  const pt = language === "pt-BR";
  const kept = keptDice(dice);

  if (dice.system === "gurps" && dice.margin !== undefined) {
    const gmath = `3d6 = ${dice.total} ${pt ? "contra alvo" : "vs target"} ${dice.target ?? "?"} (${pt ? "margem" : "margin"} ${formatMod(dice.margin)})`;
    if (outcome === "critical-success") return `${pick([r.checkCrit, b.gurpsCrit])} (${gmath})`;
    if (outcome === "critical-failure") return `${pick([r.checkCritFail, b.gurpsCritFail])} (${gmath})`;
    if (dice.margin >= 5) return `${b.gurpsWide} (${gmath})`;
    if (dice.margin >= 0) return `${r.checkSuccess} (${gmath})`;
    if (dice.margin >= -4) return `${r.checkFail} (${gmath})`;
    return `${b.gurpsBad} (${gmath})`;
  }

  if (dice.system === "pf2e") {
    const margin =
      dice.target !== undefined ? dice.total - dice.target : undefined;
    const m =
      margin !== undefined ? ` (${pt ? "margem" : "margin"} ${formatMod(margin)})` : "";
    const math = mathLine(dice, language);
    switch (outcome) {
      case "critical-success":
        return `${pick([r.checkCrit, b.pf2eCrit])} ${math}${m}`;
      case "success":
        return `${r.checkSuccess} ${math}${m}`;
      case "failure":
        return `${r.checkFail} ${math}${m}`;
      case "critical-failure":
        return `${pick([r.checkCritFail, b.pf2eCritFail])} ${math}${m}`;
    }
  }

  const math = mathLine(dice, language);
  const nat =
    dice.critical
      ? kept === 20
        ? pt
          ? " 20 natural!"
          : " a natural 20!"
        : kept === 1
          ? pt
            ? " 1 natural!"
            : " a natural 1!"
          : ""
      : "";
  switch (dice.kind) {
    case "attack": {
      if (outcome === "critical-success") return `${pick([r.attackCrit, ex.crit])}${nat} ${math}`;
      if (outcome === "success") return `${pick([r.attackHit, ex.hit])} ${math}`;
      if (outcome === "failure") return `${pick([r.attackMiss, ex.miss])} ${math}`;
      return `${pick([r.attackCritFail, ex.critFail])}${nat} ${math}`;
    }
    case "save":
      if (outcome === "critical-success") return `${pick([r.saveSuccess, ex.crit])}${nat} ${math}`;
      if (outcome === "success") return `${r.saveSuccess} ${math}`;
      if (outcome === "critical-failure") return `${pick([r.saveFail, ex.critFail])}${nat} ${math}`;
      return `${r.saveFail} ${math}`;
    case "skill":
    case "check": {
      if (outcome === "critical-success") return `${r.checkCrit}${nat} ${math}`;
      if (outcome === "success") return `${r.checkSuccess} ${math}`;
      if (outcome === "failure") return `${r.checkFail} ${math}`;
      return `${r.checkCritFail}${nat} ${math}`;
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

  // Rules-governed puzzle — the spec is local fact; this offline narrator
  // frames it in-world. The checks themselves resolve through the dice engine.
  if (turn.action === "puzzle" && turn.puzzle) {
    return (
      turn.puzzle +
      (language === "pt-BR"
        ? " O caminho está bloqueado — decifre o mecanismo, um passo de cada vez."
        : " The way is blocked — decipher the mechanism, one step at a time.")
    );
  }

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

  // Rest handling — word-boundary aware so "search the rest of the
  // warehouse" narrates the check instead of pretending to rest, and
  // "the goblin camp" isn't mistaken for camping.
  if (/(\b(?:short|long)\s+rest\b|\brest\b(?!\s+of)|\bsleep\b|\b(?:make|set up|pitch) camp\b|meditat|\bsettle in\b|descansar|dormir|acampar|meditar|assentar)/.test(lower)) {
    const long = /(long rest|sleep|night|dormir|noite|descanso longo)/.test(lower);
    return (
      (long ? pick(b.rest) : b.shortRest) +
      (chance(0.2) ? b.watchHint : "")
    );
  }

  // Tending wounds
  if (/(heal|tend|bandage|bind my wound|treat my|medic|cure|curar|tratar|bandagem|medicar|ferida)/.test(lower)) {
    return pick(b.heal) + (chance(0.25) ? pick(b.weather) : "");
  }

  // Combat actions
  if (/(attack|fight|strike|swing|shoot|hit|charge|engage|slash|stab|atacar|lutar|golpear|disparar|investir)/.test(lower)) {
    if (turn.dice) return reactToDice(turn.dice, adventure, language);
    return pick(b.encounters) + (language === "pt-BR" ? " Você se prepara e escolhe seu momento." : " You ready yourself and choose your moment.");
  }

  // Status recap — checked BEFORE exploration so "check my status" isn't
  // swallowed by the search branch (which matches on "check").
  if (/(status|inventory|who am i|recap|where am i|status|inventário|quem sou|recapitular|onde estou)/.test(lower)) {
    const c = adventure.character;
    return b.status(c, adventure.sceneTitle, adventure.location, adventure.quest[adventure.quest.length - 1] ?? (language === "pt-BR" ? "nenhuma definida" : "none set"));
  }

  // Exploration — genre-flavored finds, with a roll reaction when dice were rolled.
  // When the auto-rolled check failed, narrate a fruitless search instead of a find.
  if (/(look|search|explore|investigat|inspect|examine|check|scout|olhar|procurar|explorar|investigar|inspecionar|examinar|reconhecer)/.test(lower)) {
    const prefs: AdventurePrefs = prefsOf(adventure.character.adventurePrefs);
    const genreLines = b.genreExplore[prefs.genre as keyof typeof b.genreExplore];
    const failed =
      turn.dice?.outcome === "failure" || turn.dice?.outcome === "critical-failure";
    const found = failed
      ? pick(b.searchFail)
      : pick(genreLines && genreLines.length > 0 ? genreLines : b.explore);
    const result = turn.dice ? ` ${reactToDice(turn.dice, adventure, language)}` : "";
    const event = chance(0.25) ? ` ${pick(b.npcRandomEvent)}` : "";
    const weather = chance(0.3) ? pick(b.weather) : "";
    return found + result + event + weather;
  }

  // Movement / travel — difficulty from the Adventure Setup tunes how often
  // trouble finds you on the road.
  if (/(go |walk|travel|enter|leave|follow|head|move|approach|north|south|east|west|road|path|climb|descend|open|ir|andar|viajar|entrar|sair|seguir|mover|aproximar|norte|sul|leste|oeste|estrada|caminho|subir|descer|abrir)/.test(lower)) {
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
    if (chance(0.3)) out += pick(b.weather);
    return out;
  }

  // Social
  if (/(talk|speak|ask|negotiat|barter|persuade|convince|greet|call out|shout|yell|lie|flatter|falar|perguntar|negociar|barganhar|persuadir|convencer|cumprimentar|gritar|mentir|elogiar)/.test(lower)) {
    if (turn.dice) {
      const ok = turn.dice.outcome === "success" || turn.dice.outcome === "critical-success";
      return (ok ? pick(b.talk) : pick(b.talkFail)) + ` ${reactToDice(turn.dice, adventure, language)}`;
    }
    return pick(b.talk);
  }

  // Casting magic
  if (/\b(cast|casting|conjure|conjur|feitiço|feitiços|magia|spell|lançar|encantar)\b/.test(lower)) {
    return pick(b.cast);
  }

  // Class feature use
  if (/(use|activate|channel|invoke|rage|inspire|smite|summon|focus|usar|ativar|canalizar|invocar|fúria|inspirar|concentrar)/.test(lower)) {
    return pick(b.featureUse);
  }

  // Company — respond to companion mentions with the actual party.
  const company = adventure.companions ?? [];
  if (/(companion|party|allies|ally|company|companheir|aliad|esquadr|grupo)/.test(lower) && company.length > 0) {
    const name = pick(company).name;
    return `${pick(b.companion)} ${language === "pt-BR" ? `(${name} está ao seu lado.)` : `(${name} stands with you.)`}`;
  }

  // Generic — genre-flavored filler when nothing more specific matches.
  if (turn.dice) return reactToDice(turn.dice, adventure, language);
  const prefs: AdventurePrefs = prefsOf(adventure.character.adventurePrefs);
  const genreLines = b.genreGeneric[prefs.genre as keyof typeof b.genreGeneric];
  const filler = pick(genreLines && genreLines.length > 0 ? genreLines : b.generic);
  return (
    filler +
    ` ${language === "pt-BR" ? "O caminho adiante leva" : "The road ahead leads"} ${pick(b.roads)}.`
  );
}
