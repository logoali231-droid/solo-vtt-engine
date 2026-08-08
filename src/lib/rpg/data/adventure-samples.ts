export const dndTestCases = {
  mecanicas: [
    {
      instruction:
        "Sistema: D&D 5e. Ficha: Gareth (Guerreiro Nível 1), Inteligência 8 (-1), Bônus de Proficiência +2, Proficiente em Investigação (Total +1). Ação: Examinar as gárgulas no topo do muro do Castelo Ravenloft para determinar se são estátuas comuns ou criaturas vivas. Rolagem de Dado: d20 bruto tirou 15.",
      output: JSON.stringify({
        narracao:
          "Você estuda minuciosamente os relevos e as fissuras das gárgulas no alto do portal. Com o resultado total de 16 no seu teste de Investigação (15 no dado - 1 de Inteligência + 2 de Proficiência), você identifica detalhes sutis no corte da pedra e acúmulo antigo de musgo, confirmando que são meramente peças decorativas inanimadas.",
        teste_sucesso: true,
        dados_alterados: {},
      }),
    },
    {
      instruction:
        "Sistema: D&D 5e. Ficha: Gareth (Guerreiro Nível 1), Inteligência 8 (-1), Bônus de Proficiência +2, Proficiente em Investigação (Total +1). Ação: Investigar se as gárgulas do castelo possuem vida. Rolagem de Dado: d20 bruto tirou 7.",
      output: JSON.stringify({
        narracao:
          "Você olha rapidamente para as gárgulas no topo da muralha. Com o resultado total de 8 no seu teste de Investigação (7 no dado - 1 de Inteligência + 2 de Proficiência), contra a Classe de Dificuldade 15, elas parecem para você como simples e antigas decorações de pedra desgastadas pelo tempo.",
        teste_sucesso: false,
        dados_alterados: {},
      }),
    },
    {
      instruction:
        "Sistema: D&D 5e. Ficha: Elaena (Elfa da Floresta Nível 1), Sabedoria 13 (+1), Bônus de Proficiência +2, Proficiente em Percepção (Total +3). Traço Racial: Sentidos Aguçados. Situação: Ouvir ruídos no ambiente com Vantagem devido ao silêncio absoluto da noite. Rolagens de Dado: d20 obteve 4 e 18.",
      output: JSON.stringify({
        narracao:
          "Aproveitando a vantagem proporcionada pelo silêncio da noite e seus sentidos aguçados élficos, você utiliza o maior resultado (18). O seu total em Percepção atinge 21 (18 no dado + 1 de Sabedoria + 2 de Proficiência), superando com folga a CD 12. Você capta claramente o som suave de passos furtivos se aproximando na névoa.",
        teste_sucesso: true,
        dados_alterados: {},
      }),
    },
    {
      instruction:
        "Sistema: D&D 5e. Ficha: Thorin (Anão Nível 2), Destreza 10 (+0), Bônus de Proficiência +2. Situação: Terreno coberto por lodo viscoso impondo Desvantagem em Teste de Resistência de Destreza (CD 13). Rolagens de Dado: d20 obteve 17 e 5.",
      output: JSON.stringify({
        narracao:
          "Devido ao piso extremamente escorregadio, você realiza o teste de resistência com desvantagem. Selecionando o menor dado (5), seu resultado total é 5 (5 no dado + 0 de Destreza), falhando em superar a CD 13. Suas botas perdem a aderência e você cai no chão úmido.",
        teste_sucesso: false,
        dados_alterados: {
          condicoes_adicionadas: ["caido"],
        },
      }),
    },
    {
      instruction:
        "Sistema: D&D 5e. Ficha: Bruenor Martelo de Batalha (Anão da Montanha Nível 1), Constituição 16 (+3), Proficiência em Testes de Resistência de Constituição (+2). Traço Racial: Resiliência Anã (Vantagem contra Veneno). Situação: Teste de Resistência de Constituição contra toxina (CD 14). Rolagens de Dado: d20 obteve 8 e 20.",
      output: JSON.stringify({
        narracao:
          "Com a Vantagem concedida pela Resiliência Anã, você obtém um Sucesso Crítico (20 Natural no dado)! O sangue resistente dos anões flui pelas suas veias, ignorando completamente os efeitos da toxina sem sofrer dano ou envenenamento.",
        teste_sucesso: true,
        dados_alterados: {
          dano_sofrido: 0,
          condicoes_removidas: ["envenenado"],
        },
      }),
    },
    {
      instruction:
        "Sistema: D&D 5e. Ficha: Valeros (Guerreiro Nível 1), Força 17 (+3), Proficiente em Atletismo (+5). Ação: Saltar um precipício subterrâneo de 3 metros de largura (CD 10). Rolagem de Dado: d20 bruto tirou 1.",
      output: JSON.stringify({
        narracao:
          "Falha Crítica (1 Natural no d20)! Você ganha impulso para o salto, mas a pedra na borda do precipício farela sob sua bota antes do arranque. Você perde totalmente o apoio e despenca no poço raso abaixo.",
        teste_sucesso: false,
        dados_alterados: {
          hp_atualizado: -4,
          condicoes_adicionadas: ["caido"],
        },
      }),
    },
  ],

  atributos: [
    {
      instruction:
        "Sistema: D&D 5e. Contexto: Criação de Personagem. Raça: Anão da Montanha (+2 FOR, +2 CON). Distribuição Padrão de Valores: FOR 15, CON 14, SAB 13, CAR 12, DES 10, INT 8. Classe: Guerreiro (Dado de Vida 1d10, PV Nível 1 = 10 + Mod. CON). Ação: Calcular valores finais de habilidades, modificadores e Pontos de Vida (PV) máximos de 1º Nível.",
      output: JSON.stringify({
        narracao:
          "Criação de personagem realizada com base nas regras do Capítulo 1 e 2! Aplicando os incrementos raciais do Anão da Montanha (+2 Força e +2 Constituição), seus valores finais são: Força 17 (+3), Constituição 16 (+3), Sabedoria 13 (+1), Carisma 12 (+1), Destreza 10 (+0) e Inteligência 8 (-1). No 1º nível de Guerreiro, seus Pontos de Vida máximos são 13 (10 do d10 + 3 de Constituição).",
        teste_sucesso: true,
        dados_alterados: {
          forca: 17,
          destreza: 10,
          constituicao: 16,
          inteligencia: 8,
          sabedoria: 13,
          carisma: 12,
          hp_maximo: 13,
          hp_atual: 13,
          deslocamento_m: 7.5,
        },
      }),
    },
    {
      instruction:
        "Sistema: D&D 5e. Contexto: Criação de Personagem. Raça: Alto Elfo (+2 DES, +1 INT). Distribuição Padrão: INT 15, DES 14, CON 13, SAB 12, CAR 10, FOR 8. Classe: Mago (Dado de Vida 1d6, PV Nível 1 = 6 + Mod. CON). Ação: Registrar atributos finais, PV inicial, proficiências raciais e características.",
      output: JSON.stringify({
        narracao:
          "Personagem registrado de acordo com as regras de criação. Com os bônus raciais de Alto Elfo (+2 Destreza, +1 Inteligência), seus atributos são: Inteligência 16 (+3), Destreza 16 (+3), Constituição 13 (+1), Sabedoria 12 (+1), Carisma 10 (+0) e Força 8 (-1). Seus Pontos de Vida iniciais totalizam 7 (6 do d6 + 1 de CON). Você adquire proficiência nas armas élficas e na perícia Percepção, além do recurso Transe e 1 Truque de Mago.",
        teste_sucesso: true,
        dados_alterados: {
          inteligencia: 16,
          destreza: 16,
          constituicao: 13,
          sabedoria: 12,
          carisma: 10,
          forca: 8,
          hp_maximo: 7,
          hp_atual: 7,
          deslocamento_m: 9.0,
          idiomas: ["Comum", "Élfico", "Adicional"],
        },
      }),
    },
    {
      instruction:
        "Sistema: D&D 5e. Contexto: Evolução de Personagem. Ficha: Bruenor (Guerreiro Nível 7), Constituição 17 (+3). Ação: Subir para o Nível 8 e escolher Aumento no Valor de Habilidade em Constituição (+1 ponto, elevando a 18 e o modificador de +3 para +4). Calcular o acréscimo retroativo e atual de Pontos de Vida.",
      output: JSON.stringify({
        narracao:
          "Conforme a regra de Avanço de Personagem, quando o modificador de Constituição aumenta para um valor par (+4 no 18), seus Pontos de Vida máximos aumentam retroativamente em 1 ponto por nível (8 PV nos níveis 1 a 8) e somam os PV do novo nível (média do d10 = 6 + 4 de CON = 10 PV). O ganho total neste nível é de 18 Pontos de Vida.",
        teste_sucesso: true,
        dados_alterados: {
          constituicao: 18,
          mod_constituicao: 4,
          hp_maximo_incremento: 18,
        },
      }),
    },
    {
      instruction:
        "Sistema: D&D 5e. Contexto: Cálculo de Classe de Armadura (CA). Ficha: Bruenor (Guerreiro Nível 1), Força 17 (+3), Destreza 10 (+0). Equipamento: Cota de Malha (CA pesada 16) e Escudo (+2 CA). Ação: Equipar a cota de malha e o escudo e determinar a CA final e deslocamento.",
      output: JSON.stringify({
        narracao:
          "Equipando a Cota de Malha (CA 16, sem modificador de Destreza) e empunhando o Escudo (+2), sua Classe de Armadura (CA) atinge 18. Por ser da raça Anão, seu deslocamento base de 7,5 metros não é reduzido pelo peso da armadura pesada.",
        teste_sucesso: true,
        dados_alterados: {
          ca: 18,
          deslocamento_m: 7.5,
        },
      }),
    },
    {
      instruction:
        "Sistema: D&D 5e. Contexto: Personalização por Compra de Pontos (27 Pontos). Ação: Tentar alocar valor base 16 em Força antes de modificadores raciais.",
      output: JSON.stringify({
        narracao:
          "Ação recusada. De acordo com a regra de 'Variação: Personalizando os Valores de Habilidade' (Capítulo 1), o valor máximo absoluto que pode ser comprado com pontos antes de aplicar os bônus raciais é 15 (ao custo de 9 pontos).",
        teste_sucesso: false,
        dados_alterados: {},
      }),
    },
  ],

  combate: [
    {
      instruction:
        "Sistema: D&D 5e. Ficha: Bruenor (Guerreiro Nível 1), Força 17 (+3), Bônus de Proficiência +2. Arma: Machado de Batalha (Proficiente, dano 1d8+3 cortante corpo a corpo). Alvo: Orc com Classe de Armadura (CA) 13. Ação: Realizar jogada de ataque corpo a corpo e dano. Rolagem de Dado: d20 bruto tirou 11. Rolagem de Dano: d8 bruto tirou 5.",
      output: JSON.stringify({
        narracao:
          "Você avança firme e golpeia com seu machado de batalha. A jogada de ataque totaliza 16 (11 no d20 + 3 de Força + 2 de Proficiência), superando a CA 13 do Orc. Seu golpe causa 8 pontos de dano cortante (5 no dado + 3 de Força).",
        teste_sucesso: true,
        dados_alterados: {
          dano_causado: 8,
          alvo_hp_reduzido: 8,
        },
      }),
    },
    {
      instruction:
        "Sistema: D&D 5e. Ficha: Bruenor (Guerreiro Nível 1), Força 17 (+3), Bônus de Proficiência +2. Arma: Machado de Batalha (dano 1d8+3 cortante). Alvo: Goblin com CA 15. Ação: Realizar ataque corpo a corpo. Rolagem de Dado: d20 bruto tirou 20. Rolagem de Dano: 2d8 nos dados tirou 6 e 7.",
      output: JSON.stringify({
        narracao:
          "Acerto Crítico! Um 20 Natural no d20! Seu machado de batalha penetra direto na armadura do Goblin. Em um acerto crítico, você rola o dobro dos dados de dano (2d8 + 3), resultando em devastadores 16 pontos de dano cortante (6 + 7 nos dados + 3 de Força).",
        teste_sucesso: true,
        dados_alterados: {
          acerto_critico: true,
          dano_causado: 16,
          alvo_hp_reduzido: 16,
        },
      }),
    },
    {
      instruction:
        "Sistema: D&D 5e. Ficha: Bruenor (Guerreiro Nível 1), Força 17 (+3), Bônus de Proficiência +2. Arma: Machadinha arremessada (Propriedade Arremesso usa Força, dano 1d6+3). Alvo: Bandido a 6 metros com CA 14. Ação: Arremessar machadinha a distância. Rolagem de Dado: d20 bruto tirou 6.",
      output: JSON.stringify({
        narracao:
          "Você arremessa a machadinha, mas o ataque totaliza apenas 11 (6 no d20 + 3 de Força + 2 de Proficiência), o que não alcança a CA 14 do alvo. A machadinha se crava inofensivamente na madeira atrás do bandido.",
        teste_sucesso: false,
        dados_alterados: {},
      }),
    },
    {
      instruction:
        "Sistema: D&D 5e. Ficha: Gareth (Guerreiro Nível 1), Força 15 (+2), Bônus de Proficiência +2. Arma: Espada Longa. Alvo: Esqueleto com CA 12. Ação: Realizar ataque corpo a corpo. Rolagem de Dado: d20 bruto tirou 1.",
      output: JSON.stringify({
        narracao:
          "Falha Crítica! Um 1 Natural no d20! Você desvibra a espada com vigor, mas perde o apoio ao pisar em uma pedra solta, errando o alvo automaticamente e ficando desequilibrado.",
        teste_sucesso: false,
        dados_alterados: {
          falha_critica: true,
        },
      }),
    },
    {
      instruction:
        "Sistema: D&D 5e. Ficha: Drizzt (Drow Nível 1), Destreza 17 (+3), Bônus de Proficiência +2. Arma: Cimitarra. Traço Racial: Sensibilidade à Luz Solar. Condição: Luta sob luz solar direta. Alvo: Hobgoblin com CA 13. Ação: Atacar com cimitarra sob o sol. Rolagens de Dado: d20 obteve 18 e 4.",
      output: JSON.stringify({
        narracao:
          "A luz solar direta atinge seus olhos sensíveis de Drow, impondo Desvantagem na jogada de ataque. Utilizando o menor resultado (4), o total do seu ataque é 9 (4 no d20 + 3 de Destreza + 2 de Proficiência), resultando em uma falha contra a CA 13 do inimigo.",
        teste_sucesso: false,
        dados_alterados: {},
      }),
    },
    {
      instruction:
        "Sistema: D&D 5e. Ficha: Caelen (Elfo da Floresta Nível 1), Destreza 16 (+3), Proficiência em Furtividade (+2). Traço Racial: Máscara da Natureza. Condição: Chuva forte e névoa leve na floresta. Ação: Tentar se esconder de batedores inimigos (Percepção Passiva 12). Rolagem de Dado: d20 bruto tirou 14.",
      output: JSON.stringify({
        narracao:
          "Graças ao traço Máscara da Natureza, você consegue tentar se esconder mesmo estando apenas levemente coberto pela névoa e chuva. Com o total de 19 em Furtividade (14 no dado + 3 de Destreza + 2 de Proficiência), você supera a Percepção dos inimigos e desaparece na folhagem.",
        teste_sucesso: true,
        dados_alterados: {
          condicoes_adicionadas: ["escondido"],
        },
      }),
    },
  ],
} as const;

type TestCase = { instruction: string; output: string };

/** Flatten a golden example's JSON output into a single readable line. */
function formatExample(c: TestCase): string {
  try {
    const o = JSON.parse(c.output) as {
      narracao?: string;
      teste_sucesso?: boolean;
      dados_alterados?: Record<string, unknown>;
    };
    const parts: string[] = [];
    if (typeof o.teste_sucesso === "boolean") {
      parts.push(o.teste_sucesso ? "outcome: success" : "outcome: failure");
    }
    if (o.narracao) parts.push(o.narracao);
    if (o.dados_alterados && Object.keys(o.dados_alterados).length > 0) {
      parts.push(`state changes: ${JSON.stringify(o.dados_alterados)}`);
    }
    return parts.join(" — ");
  } catch {
    return c.output;
  }
}

/** Format the D&D 5e golden rules corpus into a compact prompt block. Feed this
 *  to the AI GM as system context whenever the adventure runs D&D 5e, so it
 *  narrates dice outcomes faithfully and applies modifiers/DCs/state changes
 *  exactly like the engine. */
export function dndRulesContext(): string {
  const sections: { title: string; cases: readonly TestCase[] }[] = [
    { title: "SKILL CHECKS & SAVING THROWS", cases: dndTestCases.mecanicas },
    { title: "ATTRIBUTES, HP & AC", cases: dndTestCases.atributos },
    { title: "COMBAT", cases: dndTestCases.combate },
  ];
  const lines: string[] = [
    "D&D 5E RULES & NARRATION EXAMPLES (golden reference from the Oraculum rules corpus).",
    "The engine rolls the dice and resolves outcomes — you only narrate. Study these examples to narrate faithfully: apply the exact modifiers and DCs shown, honor advantage/disadvantage and criticals, and reflect state changes (HP, conditions, resources) in the scene.",
    "The example narrations below are drawn from a Portuguese rules corpus — match the player's language, not the examples'.",
  ];
  for (const s of sections) {
    lines.push(`[${s.title}]`);
    s.cases.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.instruction}`);
      lines.push(`   → ${formatExample(c)}`);
    });
  }
  return lines.join("\n");
}

export default dndTestCases;