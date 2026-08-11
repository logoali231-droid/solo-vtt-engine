// ============================================================================
// Oraculum - Territory Generator.
// Builds kingdoms, countries, cities, companies, societies and more for the
// campaign world. Works in all three systems:
//   - D&D 5e & PF2e  -> fantasy-era content (magic realms, guilds, houses)
//   - GURPS          -> era follows the Life Mode tag (medieval -> fantasy,
//                       modern -> modern, cyber -> cyber, all -> random)
// All content is original. Every pool is bilingual (EN / PT-BR).
// ============================================================================

import type { GameSystem, Territory, TerritoryEra, TerritoryKind } from "../types";

type Lang = "en" | "pt-BR";
type L = { en: string; pt: string };
const l = (en: string, pt: string): L => ({ en, pt });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function loc(x: L, lang: Lang): string {
  return lang === "pt-BR" ? x.pt : x.en;
}

export function territoryEra(system: GameSystem, lifeMode?: string): TerritoryEra {
  if (system === "dnd5e" || system === "pf2e") return "fantasy";
  // GURPS - the Life Mode tag re-frames the world.
  if (lifeMode === "medieval") return "fantasy";
  if (lifeMode === "modern") return "modern";
  if (lifeMode === "cyber") return "cyber";
  return pick(["fantasy", "modern", "cyber"] as const);
}

// ---------------------------------------------------------------------------
// Kind labels (bilingual, shown in the panel + summaries)
// ---------------------------------------------------------------------------

export const TERRITORY_KINDS: { id: TerritoryKind; label: L; hint: L }[] = [
  { id: "kingdom", label: l("Kingdom", "Reino"), hint: l("A realm under one crown", "Um reino sob uma coroa") },
  { id: "country", label: l("Country", "País"), hint: l("A nation with borders and laws", "Uma nação com fronteiras e leis") },
  { id: "city", label: l("City", "Cidade"), hint: l("A settlement of note", "Um assentamento de destaque") },
  { id: "company", label: l("Company", "Empresa"), hint: l("A trading house or corporation", "Uma casa comercial ou corporação") },
  { id: "society", label: l("Society", "Sociedade"), hint: l("An organized body of members", "Um corpo organizado de membros") },
  { id: "guild", label: l("Guild", "Guilda"), hint: l("Crafters, traders or specialists", "Artesãos, comerciantes ou especialistas") },
  { id: "faction", label: l("Faction", "Facção"), hint: l("A group with a cause", "Um grupo com uma causa") },
  { id: "cult", label: l("Cult", "Seita"), hint: l("Believers gathered around a doctrine", "Crentes reunidos em torno de uma doutrina") },
  { id: "house", label: l("House", "Casa"), hint: l("A lineage of power and name", "Uma linhagem de poder e nome") },
  { id: "tribe", label: l("Tribe", "Tribo"), hint: l("A kin-group bound by blood or oath", "Um grupo unido por sangue ou juramento") },
];

export const TERRITORY_KIND_LABEL: Record<TerritoryKind, L> = Object.fromEntries(
  TERRITORY_KINDS.map((k) => [k.id, k.label]),
) as Record<TerritoryKind, L>;

export const TERRITORY_ERA_LABEL: Record<TerritoryEra, L> = {
  fantasy: l("Fantasy era", "Era de fantasia"),
  modern: l("Modern era", "Era moderna"),
  cyber: l("Cyberpunk era", "Era cyberpunk"),
};

// ---------------------------------------------------------------------------
// Name pools (per era)
// ---------------------------------------------------------------------------

interface NamePool {
  prefix: L[];
  core: L[];
  suffix: L[];
}

const NAMES: Record<TerritoryEra, NamePool> = {
  fantasy: {
    prefix: [
      l("Val", "Val"), l("El", "El"), l("Mor", "Mor"), l("Thal", "Thal"),
      l("Dra", "Dra"), l("Ash", "Ash"), l("Iron", "Ferro"), l("Storm", "Tempes"),
      l("Gold", "Ouro"), l("Red", "Rubro"), l("Grey", "Cinza"), l("Frost", "Gelo"),
      l("Ember", "Brasa"), l("Dawn", "Alba"), l("Raven", "Corvo"), l("Wulf", "Lobo"),
      l("High", "Alto"), l("Cinder", "Cinis"),
    ],
    core: [
      l("dor", "dor"), l("garen", "garen"), l("haven", "abrigo"), l("moor", "ermo"),
      l("fell", "fel"), l("brook", "riacho"), l("crest", "crista"), l("hold", "forte"),
      l("mere", "lago"), l("watch", "vigia"), l("kell", "kell"), l("wind", "vento"),
      l("briar", "espinho"), l("stone", "pedra"), l("reach", "terra"), l("holm", "ilha"),
      l("beck", "córrego"), l("ford", "vau"),
    ],
    suffix: [
      l("ia", "ia"), l("land", "lândia"), l("shire", "canto"), l("mark", "marca"),
      l("burg", "burgo"), l("helm", "elmo"), l("guard", "guarda"), l("vale", "vale"),
      l("ton", "tona"), l("wick", "vila"),
    ],
  },
  modern: {
    prefix: [
      l("New", "Nova"), l("Port", "Porto"), l("North", "Norte"), l("West", "Oeste"),
      l("East", "Leste"), l("South", "Sul"), l("Lake", "Lago"), l("River", "Rio"),
      l("Stone", "Pedra"), l("Maple", "Bordo"), l("Grand", "Grande"), l("Union", "União"),
      l("Cedar", "Cedro"), l("Oak", "Carvalho"), l("Fair", "Bela"), l("Bay", "Baía"),
      l("Mill", "Moinho"), l("Brook", "Riacho"), l("Summit", "Cume"), l("Harbor", "Porto"),
    ],
    core: [],
    suffix: [
      l("town", "cidade"), l("ville", "vila"), l("borough", "burgo"), l("field", "campo"),
      l("view", "vista"), l("side", "lado"), l("haven", "refúgio"), l("gate", "portão"),
      l("ford", "vau"), l("point", "ponta"), l("wick", "vila"), l("market", "mercado"),
      l("crest", "crista"), l("falls", "quedas"),
    ],
  },
  cyber: {
    prefix: [
      l("Neo", "Neo"), l("Hyper", "Hiper"), l("Mega", "Mega"), l("Omni", "Omni"),
      l("Sigma", "Sigma"), l("Delta", "Delta"), l("Apex", "Ápice"), l("Vertex", "Vértice"),
      l("Helix", "Hélice"), l("Nova", "Nova"), l("Vector", "Vetor"), l("Quantum", "Quântica"),
      l("Cryo", "Crio"), l("Techno", "Tecno"), l("Synth", "Sinte"), l("Bio", "Bio"),
      l("Data", "Data"), l("Neuro", "Neuro"), l("Zen", "Zen"), l("Arch", "Arco"),
    ],
    core: [],
    suffix: [
      l("core", "núcleo"), l("plex", "plexo"), l("arc", "arco"), l("net", "rede"),
      l("grid", "grade"), l("city", "cidade"), l("district", "distrito"), l("sprawl", "expansão"),
      l("tower", "torre"), l("dome", "cúpula"), l("ward", "setor"), l("line", "linha"),
      l("gate", "portão"), l("port", "porto"), l("com", "com"), l("zone", "zona"),
    ],
  },
};

function composeName(era: TerritoryEra, lang: Lang): string {
  const pool = NAMES[era];
  const p = loc(pick(pool.prefix), lang);
  if (era === "fantasy") {
    const core = loc(pick(pool.core), lang);
    const withSuffix = Math.random() < 0.45;
    const s = withSuffix ? loc(pick(pool.suffix), lang) : "";
    const joined = `${p}${core}${s}`;
    return joined.charAt(0).toUpperCase() + joined.slice(1);
  }
  const s = loc(pick(pool.suffix), lang);
  const joined = `${p}${s}`;
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

// ---------------------------------------------------------------------------
// Ruler titles (keyed by kind within each era)
// ---------------------------------------------------------------------------

const TITLES: Record<TerritoryEra, Record<TerritoryKind, L[]>> = {
  fantasy: {
    kingdom: [l("Queen", "Rainha"), l("King", "Rei"), l("High King", "Alto Rei"), l("Regent", "Regente")],
    country: [l("Queen", "Rainha"), l("King", "Rei"), l("President", "Presidente"), l("Chancellor", "Chanceler")],
    city: [l("Lord Mayor", "Prefeito"), l("Burgomaster", "Burgomestre"), l("Magistrate", "Magistrado"), l("Overlord", "Senhor")],
    company: [l("Guildmaster", "Mestre de Guilda"), l("Factor", "Fator"), l("Master Merchant", "Mestre Comerciante"), l("Steward", "Mordomo")],
    society: [l("Grandmaster", "Grão-Mestre"), l("Dean", "Decano"), l("Archon", "Arconte"), l("Curator", "Curador")],
    guild: [l("Guildmaster", "Mestre de Guilda"), l("Grand Warden", "Grande Guardião"), l("Master of the Hall", "Mestre do Salão")],
    faction: [l("Warlord", "Senhor da Guerra"), l("Spokesperson", "Porta-voz"), l("Cellmaster", "Líder de Célula")],
    cult: [l("High Priest", "Sumo Sacerdote"), l("Oracle", "Oráculo"), l("Pontiff", "Pontífice"), l("Prophet", "Profeta")],
    house: [l("Patriarch", "Patriarca"), l("Matriarch", "Matriarca"), l("Heir", "Herdeiro"), l("Lord", "Senhor")],
    tribe: [l("Chieftain", "Chefe"), l("War Leader", "Líder de Guerra"), l("Elder", "Ancião"), l("Shaman", "Xamã")],
  },
  modern: {
    kingdom: [l("Prime Minister", "Primeiro-Ministro"), l("President", "Presidente"), l("Chancellor", "Chanceler"), l("Governor-General", "Governador-Geral")],
    country: [l("President", "Presidente"), l("Prime Minister", "Primeiro-Ministro"), l("Chancellor", "Chanceler"), l("Premier", "Premiê")],
    city: [l("Mayor", "Prefeito"), l("City Manager", "Gestor Municipal"), l("Burgomaster", "Burgomestre")],
    company: [l("CEO", "CEO"), l("Founder", "Fundador"), l("Managing Director", "Diretor-Geral"), l("Chairperson", "Presidente do Conselho")],
    society: [l("President", "Presidente"), l("Chair", "Presidente"), l("Secretary-General", "Secretário-Geral"), l("Dean", "Decano")],
    guild: [l("Union President", "Presidente do Sindicato"), l("Director", "Diretor"), l("Registrar", "Registrador")],
    faction: [l("Leader", "Líder"), l("Spokesperson", "Porta-voz"), l("Convener", "Convocador")],
    cult: [l("Pastor", "Pastor"), l("Archbishop", "Arcebispo"), l("Founder", "Fundador")],
    house: [l("Patriarch", "Patriarca"), l("Matriarch", "Matriarca"), l("Managing Partner", "Sócio-Gerente")],
    tribe: [l("Elder", "Ancião"), l("Chief", "Chefe"), l("Council Speaker", "Porta-voz do Conselho")],
  },
  cyber: {
    kingdom: [l("Chief Executive", "Diretor-Executivo"), l("Overlord", "Suserano"), l("Arbiter", "Árbitro"), l("Sovereign", "Soberano")],
    country: [l("Corp Director", "Diretor da Corporação"), l("Chancellor", "Chanceler"), l("Steward", "Regente")],
    city: [l("Chief Administrator", "Administrador-Chefe"), l("Corp Governor", "Governador Corporativo"), l("Warden", "Guardião")],
    company: [l("CEO", "CEO"), l("Chief Architect", "Arquiteto-Chefe"), l("Synthesist", "Sintetizador"), l("Board Chair", "Presidente do Conselho")],
    society: [l("Chief Curator", "Curador-Chefe"), l("Oracle", "Oráculo"), l("Moderator", "Moderador")],
    guild: [l("Net Guildmaster", "Mestre da Guilda de Rede"), l("Code Lord", "Senhor do Código"), l("Sysadmin", "Administrador de Sistemas")],
    faction: [l("Node Boss", "Chefe de Nó"), l("Ghost", "Fantasma"), l("Operator", "Operador")],
    cult: [l("Ascendant", "Ascendente"), l("Chosen One", "Escolhido"), l("Seer", "Vidente")],
    house: [l("Dynasty Head", "Chefe da Dinastia"), l("Matriarch", "Matriarca"), l("Heir Apparent", "Herdeiro")],
    tribe: [l("Clan Leader", "Líder do Clã"), l("Packmaster", "Mestre da Matilha"), l("Nomad Chief", "Chefe Nômade")],
  },
};

const RULER_FIRST: Record<TerritoryEra, L[]> = {
  fantasy: [
    l("Aldric", "Aldric"), l("Elara", "Elara"), l("Kaelen", "Kaelen"), l("Mira", "Mira"),
    l("Thorne", "Thorne"), l("Seraphine", "Serafina"), l("Dorian", "Dorian"), l("Isolde", "Isolda"),
    l("Rowan", "Rowan"), l("Freya", "Freya"), l("Cedric", "Cedric"), l("Liora", "Liora"),
    l("Magnus", "Magnus"), l("Sable", "Sable"), l("Corvin", "Corvin"), l("Lyssa", "Lyssa"),
    l("Brenn", "Brenn"), l("Odessa", "Odessa"), l("Theron", "Theron"), l("Ivy", "Ivy"),
  ],
  modern: [
    l("Eleanor", "Eleonor"), l("Marcus", "Marcus"), l("Priya", "Priya"), l("Daniel", "Daniel"),
    l("Sofia", "Sofia"), l("James", "James"), l("Amara", "Amara"), l("Robert", "Roberto"),
    l("Yuki", "Yuki"), l("Thomas", "Tomás"), l("Nadia", "Nádia"), l("Victor", "Vítor"),
    l("Ingrid", "Ingrid"), l("Samuel", "Samuel"), l("Layla", "Laila"), l("Gregor", "Gregor"),
    l("Hannah", "Hannah"), l("Pierre", "Pierre"), l("Zara", "Zara"), l("Elliot", "Eliot"),
  ],
  cyber: [
    l("Kai", "Kai"), l("Rook", "Rook"), l("Nyx", "Nyx"), l("Vex", "Vex"),
    l("Jin", "Jin"), l("Ash", "Ash"), l("Zero", "Zero"), l("Sol", "Sol"),
    l("Onyx", "Onyx"), l("Pulse", "Pulso"), l("Sage", "Sábio"), l("Vortex", "Vórtice"),
    l("Nyla", "Nyla"), l("Dax", "Dax"), l("Echo", "Eco"), l("Lumen", "Lúmen"),
    l("Riya", "Riya"), l("Kestrel", "Kestrel"), l("Faye", "Faye"), l("Nero", "Nero"),
  ],
};

const RULER_LAST: Record<TerritoryEra, L[]> = {
  fantasy: [
    l("of the Iron Keep", "do Forte de Ferro"), l("of Ashwind", "de Vento de Cinzas"),
    l("of the Verdant Crown", "da Coroa Verdejante"), l("of Greyfell", "de Ermo Cinzento"),
    l("of the Ember Court", "da Corte de Brasas"), l("of the Dawnmere", "do Lago do Alvorecer"),
    l("of the Cinder Throne", "do Trono de Cinzas"), l("of the Stormhold", "do Forte da Tempestade"),
    l("of Ravenshadow", "da Sombra do Corvo"), l("of the Golden Vale", "do Vale Dourado"),
  ],
  modern: [
    l("Whitmore", "Whitmore"), l("Alvarez", "Alvarez"), l("Nakamura", "Nakamura"),
    l("Osei", "Osei"), l("Delacroix", "Delacroix"), l("Kowalski", "Kowalski"),
    l("Reyes", "Reyes"), l("Lindqvist", "Lindqvist"), l("Moreau", "Moreau"), l("Haddad", "Haddad"),
  ],
  cyber: [
    l("Volkov", "Volkov"), l("Reyes", "Reyes"), l("Tanaka", "Tanaka"),
    l("Okafor", "Okafor"), l("Stryker", "Stryker"), l("Vane", "Vane"),
    l("Cross", "Cross"), l("Idris", "Idris"), l("Chen", "Chen"), l("Marlowe", "Marlowe"),
  ],
};

// ---------------------------------------------------------------------------
// Field pools (per era) - the "characteristics" the generator rolls
// ---------------------------------------------------------------------------

const GOVERNMENTS: Record<TerritoryEra, L[]> = {
  fantasy: [
    l("hereditary monarchy", "monarquia hereditária"),
    l("an elective monarchy", "uma monarquia eletiva"),
    l("a council of nobles", "um conselho de nobres"),
    l("a theocracy guided by temple law", "uma teocracia guiada pela lei do templo"),
    l("a magocracy of ruling spellcasters", "uma magocracia de conjuradores no poder"),
    l("a merchant republic", "uma república mercantil"),
    l("a war-chief council", "um conselho de chefes de guerra"),
    l("a matriarchal dynasty", "uma dinastia matriarcal"),
    l("a confederation of clans", "uma confederação de clãs"),
    l("a triumvirate of rival houses", "um triunvirato de casas rivais"),
  ],
  modern: [
    l("a parliamentary democracy", "uma democracia parlamentar"),
    l("a constitutional monarchy", "uma monarquia constitucional"),
    l("a federal republic", "uma república federal"),
    l("a presidential republic", "uma república presidencialista"),
    l("a single-party state", "um estado de partido único"),
    l("a technocracy of appointed experts", "uma tecnocracia de especialistas nomeados"),
    l("a plutocracy of the wealthy", "uma plutocracia dos ricos"),
    l("a social democracy", "uma social-democracia"),
    l("a confederation of provinces", "uma confederação de províncias"),
    l("a junta that seized power", "uma junta que tomou o poder"),
  ],
  cyber: [
    l("a megacorporate oligarchy", "uma oligarquia megacorporativa"),
    l("an AI-managed autocracy", "uma autocracia gerida por IA"),
    l("a corporate republic", "uma república corporativa"),
    l("a techno-dynasty", "uma tecnodinastia"),
    l("a network of anarcho-communes", "uma rede de anarco-comunas"),
    l("a police state", "um estado policial"),
    l("a data barony", "uma baronia de dados"),
    l("a synod of shareholders", "um sínodo de acionistas"),
    l("a survivalist council", "um conselho sobrevivencialista"),
    l("an augmented aristocracy", "uma aristocracia aumentada"),
  ],
};

const SCALES: Record<TerritoryEra, L[]> = {
  fantasy: [
    l("a scattering of villages and hamlets", "um punhado de vilas e aldeolas"),
    l("a few thousand souls in walled towns", "poucos milhares de almas em cidades muradas"),
    l("tens of thousands across fortified keeps", "dezenas de milhares entre fortalezas"),
    l("a sprawling realm of hundreds of thousands", "um reino vasto de centenas de milhares"),
    l("a great power whose cities hold millions", "uma grande potência cujas cidades abrigam milhões"),
    l("a thin frontier strip of watchtowers", "uma faixa fronteiriça de torres de vigia"),
    l("a prosperous march of market towns", "uma marcha próspera de cidades de mercado"),
    l("a coastal cluster of fishing villages", "um aglomerado costeiro de vilas de pesca"),
  ],
  modern: [
    l("a small county of towns and farmland", "um pequeno condado de cidades e fazendas"),
    l("a midsized province with a capital city", "uma província média com uma capital"),
    l("a nation of millions with dense urban cores", "uma nação de milhões com núcleos urbanos densos"),
    l("a vast federation of regions and metropolises", "uma vasta federação de regiões e metrópoles"),
    l("a compact city-state with satellite suburbs", "uma cidade-estado compacta com subúrbios"),
    l("an archipelago of islands and coastal cities", "um arquipélago de ilhas e cidades costeiras"),
    l("a landlocked expanse of plains and industrial towns", "uma extensão sem litoral de planícies e cidades industriais"),
  ],
  cyber: [
    l("a megacity of fifty million stacked in arcologies", "uma megacidade de cinquenta milhões empilhada em arcologias"),
    l("a corporate arcology with a million residents", "uma arcologia corporativa com um milhão de moradores"),
    l("a sprawl of a hundred districts, population unknown", "uma expansão de cem distritos, população desconhecida"),
    l("a network of orbital platforms and arcologies", "uma rede de plataformas orbitais e arcologias"),
    l("a collapsed zone of ruins and nomad camps", "uma zona em colapso de ruínas e acampamentos nômades"),
    l("a walled district run by a single corp", "um distrito murado administrado por uma única corporação"),
    l("a data haven with ten million digital citizens", "um paraíso de dados com dez milhões de cidadãos digitais"),
  ],
};

const ECONOMIES: Record<TerritoryEra, L[]> = {
  fantasy: [
    l("iron and steel from deep mountain forges", "ferro e aço das forjas profundas das montanhas"),
    l("wine and grain from terraced vineyards", "vinho e grãos de vinhedos em terraços"),
    l("rare herbs and alchemical reagents", "ervas raras e reagentes alquímicos"),
    l("wool, cloth and fine dyes", "lã, tecidos e corantes finos"),
    l("silver mines and coinage rights", "minas de prata e direitos de cunhagem"),
    l("timber, pitch and shipbuilding", "madeira, piche e construção naval"),
    l("salt, fish and coastal trade", "sal, peixe e comércio costeiro"),
    l("enchanted goods and magic tuition", "bens encantados e ensino de magia"),
    l("hunting, furs and frontier pelts", "caça, peles e peles da fronteira"),
    l("stone, marble and quarrying", "pedra, mármore e mineração"),
  ],
  modern: [
    l("finance and banking services", "serviços financeiros e bancários"),
    l("manufacturing and heavy industry", "manufatura e indústria pesada"),
    l("tech startups and software", "startups de tecnologia e software"),
    l("agriculture and food processing", "agricultura e processamento de alimentos"),
    l("energy and natural resources", "energia e recursos naturais"),
    l("tourism and hospitality", "turismo e hospitalidade"),
    l("shipping and logistics", "navegação e logística"),
    l("healthcare and pharmaceuticals", "saúde e produtos farmacêuticos"),
  ],
  cyber: [
    l("corporate data brokering", "corretagem corporativa de dados"),
    l("neurochrome and cyberware production", "produção de neurocromo e ciberimplantes"),
    l("grid infrastructure and server farms", "infraestrutura de rede e fazendas de servidores"),
    l("biotech and gene tailoring", "biotecnologia e edição genética"),
    l("weapons and security contracts", "armas e contratos de segurança"),
    l("memory mining and dream recording", "mineração de memórias e gravação de sonhos"),
    l("clone labor and organ farms", "mão de obra clonada e fazendas de órgãos"),
    l("crypto and black-market exchange", "criptomoedas e câmbio de mercado negro"),
  ],
};

const MILITARIES: Record<TerritoryEra, L[]> = {
  fantasy: [
    l("a small standing army of knights and men-at-arms", "um pequeno exército permanente de cavaleiros e soldados"),
    l("a levy militia that musters at the horns", "uma milícia convocada ao som das trompas"),
    l("an elite royal guard and hired sellswords", "uma guarda real de elite e espadachins mercenários"),
    l("border rangers and hardened hunters", "patrulheiros de fronteira e caçadores endurecidos"),
    l("a mighty host of pikemen and crossbowmen", "uma hoste poderosa de lanceiros e besteiros"),
    l("a navy that rules the straits", "uma marinha que domina os estreitos"),
    l("war-mages bound by oath", "magos de guerra ligados por juramento"),
    l("a crumbling garrison too poor to feed itself", "uma guarnição decadente pobre demais para se sustentar"),
    l("shield-wall veterans of a hundred skirmishes", "veteranos de muro de escudos de cem escaramuças"),
  ],
  modern: [
    l("a professional standing army", "um exército profissional permanente"),
    l("a conscripted force with modern hardware", "uma força de conscritos com equipamento moderno"),
    l("a gendarmerie and police-state apparatus", "uma gendarmaria e um aparato de estado policial"),
    l("a small elite special-forces cadre", "um pequeno quadro de elite de forças especiais"),
    l("a neutral force focused on peacekeeping", "uma força neutra focada na manutenção da paz"),
    l("a heavily armed militia with light armor", "uma milícia fortemente armada com blindagem leve"),
    l("an air force that dominates its skies", "uma força aérea que domina seus céus"),
  ],
  cyber: [
    l("corp security divisions with military hardware", "divisões de segurança corporativa com equipamento militar"),
    l("a private army of mercenary contractors", "um exército privado de contratados mercenários"),
    l("an AI-coordinated drone swarm defense", "uma defesa de enxames de drones coordenada por IA"),
    l("cyber-warfare units and net-runner squads", "unidades de ciberguerra e esquadrões de netrunners"),
    l("a brutal enforcement wing of the local syndicate", "uma ala de repressão brutal do sindicato local"),
    l("riot-control and neural-lace patrols", "patrulhas de controle de distúrbios e rendas neurais"),
  ],
};

const TRAITS: Record<TerritoryEra, L[]> = {
  fantasy: [
    l("its towers are carved from living stone", "suas torres são esculpidas em pedra viva"),
    l("a great wall rings the capital", "uma grande muralha cerca a capital"),
    l("dragons once roosted in the peaks above", "dragões já aninharam nos picos acima"),
    l("its roads are paved with white marble", "suas estradas são pavimentadas com mármore branco"),
    l("the fields glow faintly after harvest", "os campos brilham fracamente após a colheita"),
    l("a curse lingers on the royal line", "uma maldição paira sobre a linhagem real"),
    l("its markets are the finest east of the mountains", "seus mercados são os melhores a leste das montanhas"),
    l("wolves are sacred here", "lobos são sagrados aqui"),
    l("an ancient tree grows in the center of the throne room", "uma árvore ancestral cresce no centro da sala do trono"),
    l("lanterns are lit at dusk for the drowned", "lanternas são acesas ao entardecer pelos afogados"),
  ],
  modern: [
    l("its skyline is crowned by a single crystal spire", "seu horizonte é coroado por uma única torre de cristal"),
    l("the city runs on geothermal power", "a cidade funciona com energia geotérmica"),
    l("a canal network threads every district", "uma rede de canais atravessa todos os distritos"),
    l("its university draws scholars from everywhere", "sua universidade atrai estudiosos de toda parte"),
    l("the national sport borders on a religion", "o esporte nacional beira uma religião"),
    l("its old quarter is a protected heritage site", "seu centro histórico é um patrimônio protegido"),
    l("a famous annual assembly votes on the budget", "uma famosa assembleia anual vota o orçamento"),
  ],
  cyber: [
    l("an arcology dome gleams above the district", "uma cúpula de arcologia brilha sobre o distrito"),
    l("a sentient AI quietly manages the water supply", "uma IA senciente gerencia silenciosamente o abastecimento de água"),
    l("the neon streets run with constant adverts", "as ruas de neon são inundadas de anúncios"),
    l("its citizens carry a mandatory neural feed", "seus cidadãos carregam um feed neural obrigatório"),
    l("a dead satellite was rebuilt into a market", "um satélite morto foi reconstruído em mercado"),
    l("the whole district is wired into one network", "todo o distrito está ligado a uma única rede"),
    l("holographic idols are the local religion", "ídolos holográficos são a religião local"),
  ],
};

const CULTURES: Record<TerritoryEra, L[]> = {
  fantasy: [
    l("hospitality is law - no guest is turned away", "a hospitalidade é lei - nenhum hóspede é recusado"),
    l("duels of honor settle every dispute", "duelos de honra resolvem toda disputa"),
    l("the dead are buried with their tools and weapons", "os mortos são enterrados com suas ferramentas e armas"),
    l("storytellers hold the highest rank after the crown", "contadores de histórias têm o posto mais alto depois da coroa"),
    l("oaths are sworn on iron and fire", "juramentos são feitos sobre ferro e fogo"),
    l("masked festivals mark the turning of the year", "festivais mascarados marcam a virada do ano"),
    l("law is spoken by wandering judges", "a lei é proclamada por juízes itinerantes"),
  ],
  modern: [
    l("coffee houses are the heart of public life", "as casas de café são o coração da vida pública"),
    l("civic festivals celebrate local history", "festivais cívicos celebram a história local"),
    l("sports rivalries define social identity", "rivalidades esportivas definem a identidade social"),
    l("neighborhood councils decide local matters", "conselhos de bairro decidem questões locais"),
    l("the arts are publicly funded and fiercely debated", "as artes são financiadas publicamente e acirradamente debatidas"),
    l("volunteering and mutual aid are a point of pride", "voluntariado e ajuda mútua são motivo de orgulho"),
  ],
  cyber: [
    l("privacy is the ultimate status symbol", "privacidade é o símbolo máximo de status"),
    l("body modification marks social rank", "modificação corporal marca a posição social"),
    l("street slang shifts faster than the news", "a gíria das ruas muda mais rápido que as notícias"),
    l("loyalty is to the block, not the state", "a lealdade é ao quarteirão, não ao estado"),
    l("digital avatars outrank physical faces", "avatares digitais superam rostos físicos"),
    l("anonymity is a birthright everyone rents", "anonimato é um direito que todos alugam"),
  ],
};

const MAGIC_TECH: Record<TerritoryEra, L[]> = {
  fantasy: [
    l("high magic - spellcasters are common and public", "alta magia - conjuradores são comuns e públicos"),
    l("low magic - spells are rare and whispered about", "baixa magia - feitiços são raros e sussurrados"),
    l("arcane academies control most magic", "academias arcanas controlam a maior parte da magia"),
    l("divine magic flows from the state religion", "magia divina flui da religião oficial"),
    l("magic is outlawed outside licensed guilds", "magia é proibida fora das guildas licenciadas"),
    l("wild magic storms crackle on the borders", "tempestades de magia selvagem crepitam nas fronteiras"),
    l("ancient elven wards still hold the gates", "antigos selos élficos ainda protegem os portões"),
  ],
  modern: [
    l("technology at mid-21st-century level", "tecnologia de meados do século XXI"),
    l("strong digital infrastructure and automation", "forte infraestrutura digital e automação"),
    l("an industrial economy transitioning to services", "uma economia industrial em transição para serviços"),
    l("advanced medical and biotech sectors", "setores médicos e de biotecnologia avançados"),
    l("aging infrastructure in need of renewal", "infraestrutura envelhecida que precisa de renovação"),
  ],
  cyber: [
    l("bleeding-edge cybertech in every home", "cibertecnologia de ponta em todas as casas"),
    l("neural interfaces are the norm", "interfaces neurais são a norma"),
    l("netrunning tech advances weekly", "a tecnologia de netrunning avança toda semana"),
    l("augmented reality overlays the streets", "realidade aumentada sobrepõe as ruas"),
    l("genetic engineering is commercially mainstream", "engenharia genética é comercialmente comum"),
  ],
};

const FACTIONS: Record<TerritoryEra, L[]> = {
  fantasy: [
    l("the Crown Faction vs the Assembly of Nobles", "a Facção da Coroa contra a Assembleia dos Nobres"),
    l("the Temple vs the Wizards' Circle", "o Templo contra o Círculo dos Magos"),
    l("the Merchant Cartel vs the Guild of Crafters", "o Cartel dos Mercadores contra a Guilda dos Artesãos"),
    l("the Border Lords vs the King's Wardens", "os Senhores da Fronteira contra os Guardiões do Rei"),
    l("the Old Blood vs the New Money", "o Sangue Antigo contra o Dinheiro Novo"),
    l("the Hunters' Lodge vs the Forest Wardens", "a Loja dos Caçadores contra os Guardiões da Floresta"),
    l("the Sea Captains vs the Harbor Council", "os Capitães do Mar contra o Conselho do Porto"),
    l("the Peasant Leagues vs the Landed Gentry", "as Ligas Camponesas contra a Gentry de Terras"),
  ],
  modern: [
    l("the Ruling Party vs the Opposition Bloc", "o Partido no Poder contra o Bloco de Oposição"),
    l("the Unions vs the Employers' Federation", "os Sindicatos contra a Federação dos Empregadores"),
    l("the Environmentalists vs the Industrialists", "os Ambientalistas contra os Industrialistas"),
    l("the Progressives vs the Traditionalists", "os Progressistas contra os Tradicionalistas"),
    l("the Military Command vs the Civilian Bureaucracy", "o Comando Militar contra a Burocracia Civil"),
    l("the Regional Governors vs the Federal Core", "os Governadores Regionais contra o Núcleo Federal"),
  ],
  cyber: [
    l("the Corp Board vs the Founder's Heirs", "o Conselho da Corporação contra os Herdeiros do Fundador"),
    l("the Netrunner Syndicate vs the Grid Authority", "o Sindicato dos Netrunners contra a Autoridade da Grade"),
    l("the Street Clans vs the Corporate Districts", "os Clãs das Ruas contra os Distritos Corporativos"),
    l("the Biotech Lab vs the Medical Guild", "o Laboratório de Biotecnologia contra a Guilda Médica"),
    l("the Data Guild vs the Free-Info Hackers", "a Guilda de Dados contra os Hackers de Informação Livre"),
    l("the Enforcers vs the Shadow Brokers", "os Executores contra os Corretores das Sombras"),
  ],
};

const CONFLICTS: Record<TerritoryEra, L[]> = {
  fantasy: [
    l("a disputed succession has split the court", "uma sucessão disputada dividiu a corte"),
    l("border raids from a rival realm grow bolder", "incursões fronteiriças de um reino rival ficam mais ousadas"),
    l("a plague stalks the grain roads", "uma praga assombra as estradas de grãos"),
    l("an ancient bargain is coming due", "um pacto antigo está vencendo"),
    l("bandits prey on the trade routes", "bandidos atacam as rotas comerciais"),
    l("the harvest failed two years running", "a colheita falhou dois anos seguidos"),
    l("a dragon demands tribute from the high passes", "um dragão exige tributo dos altos desfiladeiros"),
    l("a magical blight gnaws at the fields", "uma praga mágica corrói os campos"),
    l("the coin has been debased and merchants rage", "a moeda foi desvalorizada e os mercadores se enfurecem"),
  ],
  modern: [
    l("an election looms and tensions run high", "uma eleição se aproxima e as tensões aumentam"),
    l("a debt crisis threatens the budget", "uma crise de dívida ameaça o orçamento"),
    l("strikes have shut the industrial belt", "greves paralisaram o cinturão industrial"),
    l("a scandal reaches the highest office", "um escândalo atinge o cargo mais alto"),
    l("water rights are fought over in court and street", "direitos de água são disputados nos tribunais e nas ruas"),
    l("a refugee wave strains the border towns", "uma onda de refugiados sobrecarrega as cidades fronteiriças"),
    l("a disputed border with a neighbor nation", "uma fronteira disputada com uma nação vizinha"),
    l("an epidemic tests the health system", "uma epidemia testa o sistema de saúde"),
  ],
  cyber: [
    l("a data heist has torn the board apart", "um roubo de dados despedaçou o conselho"),
    l("an AI uprising is rumored in the deep grids", "rumores de levante de IA nas grades profundas"),
    l("corp rivalries are escalating to open firefights", "rivalidades corporativas escalam para tiroteios abertos"),
    l("the grid is dying district by district", "a grade está morrendo distrito por distrito"),
    l("a shadow syndicate is buying the streets", "um sindicato das sombras está comprando as ruas"),
    l("an orbital disaster threatens the arcologies", "um desastre orbital ameaça as arcologias"),
    l("a memory plague scrambles the citizen feed", "uma praga de memória embaralha o feed dos cidadãos"),
    l("the water supply has been seized as leverage", "o abastecimento de água foi tomado como moeda de troca"),
  ],
};

const SECRETS: Record<TerritoryEra, L[]> = {
  fantasy: [
    l("the royal line is not what it claims to be", "a linhagem real não é o que afirma ser"),
    l("a sealed vault lies beneath the throne", "um cofre selado jaz sob o trono"),
    l("the crown's wealth is long gone - the treasury is fiction", "a riqueza da coroa se foi - o tesouro é ficção"),
    l("the court diviner is a fraud", "o adivinho da corte é uma fraude"),
    l("an exiled heir lives in hiding", "um herdeiro exilado vive escondido"),
    l("the capital was built on a dead god's bones", "a capital foi construída sobre os ossos de um deus morto"),
    l("the border garrisons were never paid", "as guarnições de fronteira nunca foram pagas"),
  ],
  modern: [
    l("the census has been padded for decades", "o censo é inflado há décadas"),
    l("a former leader is alive in hiding", "um ex-líder está vivo e escondido"),
    l("the national archive hides a sealed file", "o arquivo nacional esconde um processo lacrado"),
    l("key officials took a foreign loan", "altos funcionários aceitaram um empréstimo estrangeiro"),
    l("the power grid has a secret backup network", "a rede elétrica tem uma rede reserva secreta"),
    l("a beloved landmark is quietly failing", "um ponto turístico querido está falhando silenciosamente"),
  ],
  cyber: [
    l("the city's core AI is running on stolen code", "a IA central da cidade roda em código roubado"),
    l("the corp's flagship product is a lie", "o produto carro-chefe da corporação é uma mentira"),
    l("the district's water is owned by a ghost company", "a água do distrito pertence a uma empresa fantasma"),
    l("a frozen mind runs the stock exchange", "uma mente congelada administra a bolsa de valores"),
    l("the surveillance network has a blind spot - and someone lives in it", "a rede de vigilância tem um ponto cego - e alguém vive nele"),
    l("the arcology was never certified safe", "a arcologia nunca foi certificada como segura"),
  ],
};

const RELATIONS: Record<TerritoryEra, L[]> = {
  fantasy: [
    l("bound by treaty to the coastal realm", "ligado por tratado ao reino costeiro"),
    l("at cold war with the mountain clans", "em guerra fria com os clãs das montanhas"),
    l("allied by marriage to the neighboring kingdom", "aliado por casamento ao reino vizinho"),
    l("owes a centuries-old debt to the temple", "deve uma dívida centenária ao templo"),
    l("trade rivals with the river federation", "rival comercial da federação do rio"),
    l("shares a contested border with the marchlands", "compartilha uma fronteira disputada com as marchas"),
    l("in secret correspondence with a foreign power", "em correspondência secreta com uma potência estrangeira"),
    l("hostage-lords guarantee peace with the north", "senhores reféns garantem a paz com o norte"),
  ],
  modern: [
    l("member of a regional trade pact", "membro de um pacto comercial regional"),
    l("locked in a tariff war with its neighbor", "travado em guerra tarifária com seu vizinho"),
    l("bound by a mutual-defense treaty", "ligado por um tratado de defesa mútua"),
    l("mediating a dispute between two other nations", "mediando uma disputa entre outras duas nações"),
    l("strained by a refugee agreement", "desgastado por um acordo de refugiados"),
    l("shares a currency union with its allies", "compartilha uma união monetária com seus aliados"),
  ],
  cyber: [
    l("sells grid access to a rival megacity", "vende acesso à grade para uma megacidade rival"),
    l("in a cold data war with the neighboring corp", "em guerra fria de dados com a corporação vizinha"),
    l("under contract to an off-world colony", "sob contrato com uma colônia fora do mundo"),
    l("shelters a network of corporate defectors", "abriga uma rede de desertores corporativos"),
    l("keeps a fragile truce with the syndicates", "mantém uma trégua frágil com os sindicatos"),
    l("leases its arcology topside to foreign investors", "aluga o topo de sua arcologia a investidores estrangeiros"),
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type TerritoryField =
  | "name"
  | "ruler"
  | "government"
  | "scale"
  | "economy"
  | "military"
  | "trait"
  | "culture"
  | "magicTech"
  | "factions"
  | "conflict"
  | "secret"
  | "relations";

function genRuler(era: TerritoryEra, kind: TerritoryKind, lang: Lang): string {
  const title = loc(pick(TITLES[era][kind]), lang);
  const first = loc(pick(RULER_FIRST[era]), lang);
  if (era === "fantasy" || kind === "house") {
    return `${title} ${first} ${loc(pick(RULER_LAST[era]), lang)}`;
  }
  return `${title} ${first} ${loc(pick(RULER_LAST[era]), lang)}`;
}

function genFactions(era: TerritoryEra, lang: Lang): string[] {
  return pickN(FACTIONS[era], Math.random() < 0.35 ? 2 : 1).map((f) => loc(f, lang));
}

export function generateTerritory(
  kind: TerritoryKind,
  era: TerritoryEra,
  lang: Lang = "en",
): Omit<Territory, "id" | "updatedAt"> {
  return {
    kind,
    era,
    lang,
    name: composeName(era, lang),
    ruler: genRuler(era, kind, lang),
    government: loc(pick(GOVERNMENTS[era]), lang),
    scale: loc(pick(SCALES[era]), lang),
    economy: loc(pick(ECONOMIES[era]), lang),
    military: loc(pick(MILITARIES[era]), lang),
    trait: loc(pick(TRAITS[era]), lang),
    culture: loc(pick(CULTURES[era]), lang),
    magicTech: loc(pick(MAGIC_TECH[era]), lang),
    factions: genFactions(era, lang),
    conflict: loc(pick(CONFLICTS[era]), lang),
    secret: loc(pick(SECRETS[era]), lang),
    relations: loc(pick(RELATIONS[era]), lang),
    note: "",
  };
}

export function createTerritory(
  kind: TerritoryKind,
  era: TerritoryEra,
  lang: Lang = "en",
): Territory {
  return {
    ...generateTerritory(kind, era, lang),
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
    updatedAt: Date.now(),
  };
}

export function rerollTerritoryField(
  t: Territory,
  field: TerritoryField,
): Territory {
  const { era, kind, lang } = t;
  const fresh = generateTerritory(kind, era, lang);
  return {
    ...t,
    [field]: field === "factions" ? fresh.factions : fresh[field],
    updatedAt: Date.now(),
  };
}

export function rebuildTerritory(t: Territory): Territory {
  return {
    ...generateTerritory(t.kind, t.era, t.lang),
    id: t.id,
    note: t.note,
    updatedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const KIND_WORD: Record<TerritoryKind, L> = {
  kingdom: l("Kingdom", "Reino"),
  country: l("Country", "País"),
  city: l("City", "Cidade"),
  company: l("Company", "Empresa"),
  society: l("Society", "Sociedade"),
  guild: l("Guild", "Guilda"),
  faction: l("Faction", "Facção"),
  cult: l("Cult", "Seita"),
  house: l("House", "Casa"),
  tribe: l("Tribe", "Tribo"),
};

/** One-line pitch: "The Kingdom of Valdoria is a realm where its towers are
 *  carved from living stone. Queen Elara of the Iron Keep rules..." */
export function territorySummary(t: Territory, lang: Lang = t.lang): string {
  const kind = loc(KIND_WORD[t.kind], lang);
  const name = t.name.toLowerCase().startsWith("the ") ? t.name : `The ${t.name}`;
  return lang === "pt-BR"
    ? `${name}, ${kind} onde ${t.trait}. ${t.ruler} governa sob ${t.government}; sua riqueza vem de ${t.economy}. ${capitalize(t.conflict)}.`
    : `${name}, a ${kind} where ${t.trait}. ${t.ruler} rules under ${t.government}; its wealth comes from ${t.economy}. ${capitalize(t.conflict)}.`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Compact block injected into the AI GM's context so generated territories
 *  stay consistent across the campaign. */
export function territoriesContext(
  territories: Territory[],
  lang: Lang = "en",
): string {
  if (!territories.length) return "";
  const lines = territories.map((t) => {
    const kind = loc(KIND_WORD[t.kind], lang);
    const factions = t.factions.join(" · ");
    const rows = [
      `Ruler: ${t.ruler}`,
      `Government: ${t.government}`,
      `Scale: ${t.scale}`,
      `Economy: ${t.economy}`,
      `Military: ${t.military}`,
      lang === "pt-BR" ? `Magia/Tecnologia: ${t.magicTech}` : `Magic/Tech: ${t.magicTech}`,
      `Culture: ${t.culture}`,
      `Factions: ${factions || "—"}`,
      `Current conflict: ${t.conflict}`,
      `Secret: ${t.secret}`,
      `Relations: ${t.relations}`,
    ];
    if (t.note) rows.push(`Note: ${t.note}`);
    return `- ${kind} of ${t.name} (${loc(TERRITORY_ERA_LABEL[t.era], lang)})\n    ${rows.join("\n    ")}`;
  });
  return (
    `WORLD TERRITORIES (places and powers in this campaign - keep every detail consistent when the player visits them):\n` +
    lines.join("\n")
  );
}
