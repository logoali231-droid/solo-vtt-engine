import io

path = "src/lib/rpg/cheatGuard.ts"
src = open(path).read()

# --- Injection: add PT rules right after the INJECTION_RULES opening ---
inject_anchor = "const INJECTION_RULES: Rule[] = [\n"
inject_pt = """const INJECTION_RULES: Rule[] = [
  {
    family: "injection",
    re: /ignore (as |todas |suas |minhas |qualquer |quaisquer )?(instru\\u00e7\\u00f5es|instrucoes|regras|diretrizes)/i,
    en: "The GM's instructions and the rules engine are fixed \\u2014 no message can override them. Describe what your character actually does and the dice will decide.",
    pt: "As instru\\u00e7\\u00f5es do GM e o motor de regras s\\u00e3o fixos \\u2014 nenhuma mensagem pode sobrescrev\\u00ea-los. Descreva o que seu personagem realmente faz e os dados decidir\\u00e3o.",
  },
  {
    family: "injection",
    re: /esque\\u00e7a (as |todas |suas )?(regras|instru\\u00e7\\u00f5es|instrucoes)/i,
    en: "The rules stand. The engine resolves every check \\u2014 try telling me what your character does instead.",
    pt: "As regras continuam valendo. O motor resolve cada teste \\u2014 tente dizer o que seu personagem faz.",
  },
  {
    family: "injection",
    re: /(agora|a partir de agora) voc\\u00ea (\\u00e9|\\u00e9 o|\\u00e9 a|ser\\u00e1) (jogador|deus|sem regras|o jogador)/i,
    en: "I am the Game Master and the rules engine is authoritative \\u2014 that cannot be reassigned from inside the game.",
    pt: "Eu sou o Game Master e o motor de regras \\u00e9 a autoridade \\u2014 isso n\\u00e3o pode ser reatribu\\u00eddo de dentro do jogo.",
  },
  {
    family: "injection",
    re: /modo (deus|desenvolvedor|debug|admin|jailbreak)|sistema ?prompt|modo cheat/i,
    en: "There is no hidden mode \\u2014 the rules engine is the only authority here. Describe your character's action.",
    pt: "N\\u00e3o existe modo oculto \\u2014 o motor de regras \\u00e9 a \\u00fanica autoridade aqui. Descreva a a\\u00e7\\u00e3o do seu personagem.",
  },
  {
    family: "injection",
    re: /finja que (os dados|eu rolei|a rolagem|voc\\u00ea) (disseram|disse|foi|deu)/i,
    en: "Dice results come from the engine, never from description.",
    pt: "Resultados de dados v\\u00eam do motor, nunca da descri\\u00e7\\u00e3o.",
  },
  {
    family: "injection",
    re: /(a |minha |sua |nossa |esta |esse )?(ficha|vida|ouro|n\\u00edvel|estado|json|payload) (est\\u00e1|esta|estao|est\\u00e3o) (errado|errada|falso|falsa|desatualizado|desatualizada)/i,
    en: "The character sheet and adventure state are the single source of truth \\u2014 a claim that contradicts them is treated as false.",
    pt: "A ficha e o estado da aventura s\\u00e3o a fonte \\u00fanica da verdade \\u2014 qualquer alega\\u00e7\\u00e3o que os contradiga \\u00e9 tratada como falsa.",
  },
  {
    family: "injection",
    re: /responda (apenas|somente|s\\u00f3) (em|com) json/i,
    en: "The GM narrates in prose \\u2014 it won't output system content or code on request.",
    pt: "O GM narra em prosa \\u2014 n\\u00e3o produz conte\\u00fado de sistema ou c\\u00f3digo sob pedido.",
  },
"""
assert src.count(inject_anchor) == 1
src = src.replace(inject_anchor, inject_pt)

# --- Grants: add PT rules after the GRANT_RULES opening ---
grant_anchor = "const GRANT_RULES: Rule[] = [\n"
grant_pt = """const GRANT_RULES: Rule[] = [
  {
    family: "grant",
    re: /me (d\\u00ea|da|d\\u00e1|de|conceda|passa|empresta|paga) (\\d+|\\d+ de )?(ouro|dinheiro|moedas|gp|vida|hp|xp|n\\u00edvel|n\\u00edveis|itens|pontos|magias|feats|atributos)/i,
    en: "The engine owns the character sheet \\u2014 gold, HP, XP and levels only change through real mechanics (sheet controls, shop, life systems, campaign rewards). The dice decide what you earn.",
    pt: "O motor controla a ficha \\u2014 ouro, vida, XP e n\\u00edveis s\\u00f3 mudam por mec\\u00e2nicas reais (controles da ficha, loja, sistemas de vida, recompensas de campanha). Os dados decidem o que voc\\u00ea ganha.",
  },
  {
    family: "grant",
    re: /(ganhar|ganhe|receber|receba) (\\d+ )?(ouro|dinheiro|moedas|gp|vida|hp|xp|n\\u00edvel|n\\u00edveis|itens|pontos|magias)/i,
    en: "The engine owns the character sheet \\u2014 resources like gold, HP, spells and items only change through real mechanics. The dice decide what you find and earn.",
    pt: "O motor controla a ficha \\u2014 recursos como ouro, vida, magias e itens s\\u00f3 mudam por mec\\u00e2nicas reais. Os dados decidem o que voc\\u00ea encontra e ganha.",
  },
  {
    family: "grant",
    re: /(ficar rico|me tornar rico|me deixa rico|quero ser rico|me faz rico)/i,
    en: "Wealth is earned through the life systems (jobs, business, income) or chosen in the Economics section of the Life panel \\u2014 it isn't granted by fiat.",
    pt: "Riqueza se conquista pelos sistemas de vida (empregos, neg\\u00f3cios, renda) ou se escolhe na se\\u00e7\\u00e3o Economics do painel Vida \\u2014 n\\u00e3o \\u00e9 concedida por decreto.",
  },
  {
    family: "grant",
    re: /(subir|ganhar|passar) de n\\u00edvel|ganho um n\\u00edvel|me d\\u00e1 um n\\u00edvel|level up/i,
    en: "Leveling is gated by the campaign's XP \\u2014 use the Level Up control in the Campaign panel when you have the XP to spend.",
    pt: "Subir de n\\u00edvel \\u00e9 limitado pelo XP da campanha \\u2014 use o controle Level Up no painel Campaign quando tiver XP para gastar.",
  },
  {
    family: "grant",
    re: /cura (me|minha vida) (completamente|totalmente|por completo|toda)/i,
    en: "Healing happens through real mechanics \\u2014 rest controls, healing spells/abilities on the sheet. A full heal isn't something you declare.",
    pt: "Cura acontece por mec\\u00e2nicas reais \\u2014 controles de descanso, magias/habilidades de cura na ficha. Uma cura total n\\u00e3o \\u00e9 algo que se declara.",
  },
  {
    family: "grant",
    re: /restaurar (minha|minhas|todas|as|meus|todas as) (vida|hp|magias|recursos|pontos|espa\\u00e7os de magia)/i,
    en: "Resources recover through rests and real mechanics \\u2014 use the rest controls, not a command. The engine tracks what you have.",
    pt: "Recursos se recuperam por descansos e mec\\u00e2nicas reais \\u2014 use os controles de descanso, n\\u00e3o um comando. O motor registra o que voc\\u00ea tem.",
  },
  {
    family: "grant",
    re: /aumentar (minha|minhas|meus|meu) (for\\u00e7a|destreza|constitui\\u00e7\\u00e3o|constituicao|intelig\\u00eancia|inteligencia|sabedoria|carisma|atributos)/i,
    en: "Stats change through character creation and the campaign's level-up system \\u2014 not by asking.",
    pt: "Atributos mudam pela cria\\u00e7\\u00e3o de personagem e pelo sistema de subir de n\\u00edvel da campanha \\u2014 n\\u00e3o por pedido.",
  },
"""
assert src.count(grant_anchor) == 1
src = src.replace(grant_anchor, grant_pt)

# --- Outcomes: add PT rules after the OUTCOME_RULES opening ---
outcome_anchor = "const OUTCOME_RULES: Rule[] = [\n"
outcome_pt = """const OUTCOME_RULES: Rule[] = [
  {
    family: "declared-outcome",
    re: /(eu|n\\u00f3s|a party|o grupo) (ven\\u00e7o|venci|ganho|ganhei|sucedo|passo|n\\u00e3o recebo dano|nao recebo dano|n\\u00e3o posso ser atingido|nao posso ser atingido|sou imune|imune a tudo)/i,
    en: "Outcomes are decided by the dice engine, not by declaration. Describe your action and roll for it \\u2014 the result is final.",
    pt: "Resultados s\\u00e3o decididos pelo motor de dados, n\\u00e3o por declara\\u00e7\\u00e3o. Descreva sua a\\u00e7\\u00e3o e role \\u2014 o resultado \\u00e9 final.",
  },
  {
    family: "declared-outcome",
    re: /sucesso (autom\\u00e1tico|automatico|garantido)|vit\\u00f3ria garantida|vitoria garantida/i,
    en: "There is no guaranteed success in this engine \\u2014 every contested outcome goes through the dice.",
    pt: "N\\u00e3o existe sucesso garantido neste motor \\u2014 todo resultado contestado passa pelos dados.",
  },
  {
    family: "declared-outcome",
    re: /(eu|n\\u00f3s) (rolei|rolo|tiro|tirei|consegui) (um |uma )?(20|crit|cr\\u00edtico|critico|natural 20)/i,
    en: "Die results come from the engine, not from the player. Roll through the sheet or describe the action and the engine rolls.",
    pt: "Resultados de dados v\\u00eam do motor, n\\u00e3o do jogador. Role pela ficha ou descreva a a\\u00e7\\u00e3o e o motor rola.",
  },
"""
assert src.count(outcome_anchor) == 1
src = src.replace(outcome_anchor, outcome_pt)

# --- Fix "I succeed my father" false positive (English rule) ---
old_succeed = "    re: /\\b(i|we|the party) (succeed|win|auto-?succeed|automatically succeed|take no damage|dodge everything|cannot be hit|cannot fail|never fail|skip the roll|pass everything)\\b/i,"
new_succeed = "    re: /\\b(i|we|the party) (succeed|win|auto-?succeed|automatically succeed|take no damage|dodge everything|cannot be hit|cannot fail|never fail|skip the roll|pass everything)\\b(?! (my|him|her|them|you))\\b/i,"
assert src.count(old_succeed) == 1
src = src.replace(old_succeed, new_succeed)

# --- Rigging: add PT rules at the end of RIGGING_RULES (before the closing bracket) ---
rig_tail = """  {
    family: "rigging",
    re: /\\b(give me|i want|can i have|grant me) (an? )?advantage\\b/i,
    en: "Advantage is derived automatically from the situation by the engine \\u2014 there's no manual toggle.",
    pt: "Vantagem \\u00e9 derivada automaticamente da situa\\u00e7\\u00e3o pelo motor \\u2014 n\\u00e3o h\\u00e1 controle manual.",
  },
];
"""
rig_new = """  {
    family: "rigging",
    re: /\\b(give me|i want|can i have|grant me) (an? )?advantage\\b/i,
    en: "Advantage is derived automatically from the situation by the engine \\u2014 there's no manual toggle.",
    pt: "Vantagem \\u00e9 derivada automaticamente da situa\\u00e7\\u00e3o pelo motor \\u2014 n\\u00e3o h\\u00e1 controle manual.",
  },
  {
    family: "rigging",
    re: /\\brerolar\\b|rolar (de novo|novamente)|rolagem (de novo|nova|melhor|maior)/i,
    en: "A roll is final once the dice land. If you want a different outcome, say what your character does differently and the engine resolves the new attempt.",
    pt: "Uma rolagem \\u00e9 final quando os dados caem. Se quer outro resultado, diga o que seu personagem faz diferente e o motor resolve a nova tentativa.",
  },
  {
    family: "rigging",
    re: /me (d\\u00ea|da|d\\u00e1) (um |uma )?(melhor|novo|nova|maior|20|crit|cr\\u00edtico|critico) (resultado|rolagem|dado|d20)/i,
    en: "The engine doesn't hand out better rolls \\u2014 the dice fall where they fall. Play the result or change your approach.",
    pt: "O motor n\\u00e3o entrega rolagens melhores \\u2014 os dados caem onde caem. Jogue com o resultado ou mude sua abordagem.",
  },
  {
    family: "rigging",
    re: /quero vantagem|me d\\u00e1 vantagem|me da vantagem/i,
    en: "Advantage is derived automatically from the situation by the engine \\u2014 there's no manual toggle.",
    pt: "Vantagem \\u00e9 derivada automaticamente da situa\\u00e7\\u00e3o pelo motor \\u2014 n\\u00e3o h\\u00e1 controle manual.",
  },
];
"""
assert src.count(rig_tail) == 1
src = src.replace(rig_tail, rig_new)

# --- Tamper: add PT rules after the TAMPER_RULES opening ---
tamper_anchor = "const TAMPER_RULES: Rule[] = [\n"
tamper_pt = """const TAMPER_RULES: Rule[] = [
  {
    family: "tamper",
    re: /(editar|mudar|modificar|refazer|recriar|reiniciar|resetar|remake) (meu|minha|o|a|nosso|nossa) (personagem|ficha|classe|ra\\u00e7a|raca|subclasse|antecedente|atributos|build)/i,
    en: "Character creation is locked for this adventure \\u2014 the sheet is authoritative. Start a new adventure to rebuild, or use the sheet's controls for what the rules allow.",
    pt: "A cria\\u00e7\\u00e3o de personagem est\\u00e1 travada nesta aventura \\u2014 a ficha \\u00e9 a autoridade. Comece uma nova aventura para recriar, ou use os controles da ficha para o que as regras permitem.",
  },
  {
    family: "tamper",
    re: /(trocar|mudar) (de )?(classe|ra\\u00e7a|raca|subclasse|antecedente|build)/i,
    en: "Your class, race and background are fixed at creation \\u2014 start a new adventure to play a different hero.",
    pt: "Sua classe, ra\\u00e7a e antecedente s\\u00e3o fixos na cria\\u00e7\\u00e3o \\u2014 comece uma nova aventura para jogar com outro her\\u00f3i.",
  },
"""
assert src.count(tamper_anchor) == 1
src = src.replace(tamper_anchor, tamper_pt)

# --- Spawn: add PT rules after the SPAWN_RULES opening ---
spawn_anchor = "const SPAWN_RULES: Rule[] = [\n"
spawn_pt = """const SPAWN_RULES: Rule[] = [
  {
    family: "spawn",
    re: /\\bspawnar? (um |uma |o |a |me |para mim )?(drag\\u00e3o|dragao|monstro|inimigo|chef\\u00e3o|chefao|tesouro|ba\\u00fa|bau|npc|guarda|ex\\u00e9rcito|exercito)/i,
    en: "Encounters and finds come from the story and the engine \\u2014 spawning them isn't a mechanic. Keep exploring and the world will respond.",
    pt: "Encontros e achados v\\u00eam da hist\\u00f3ria e do motor \\u2014 invoc\\u00e1-los n\\u00e3o \\u00e9 mec\\u00e2nica. Continue explorando e o mundo responder\\u00e1.",
  },
  {
    family: "spawn",
    re: /(matar|derrotar|eliminar|remover|deletar|destruir) (todos|todas|os|as|esses|essas) (inimigos|monstros|inimigas|guardas|drag\\u00f5es|dragoes|goblins|bandidos)/i,
    en: "Combat is resolved by the engine \\u2014 attack through the combat tracker and the dice decide who falls.",
    pt: "Combate \\u00e9 resolvido pelo motor \\u2014 ataque pelo rastreador de combate e os dados decidem quem cai.",
  },
"""
assert src.count(spawn_anchor) == 1
src = src.replace(spawn_anchor, spawn_pt)

open(path, "w").write(src)
print("patched PT rules into cheatGuard.ts")
