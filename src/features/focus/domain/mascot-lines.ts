import { IMascotState, MascotPersonality } from "./mascot";

export type MascotEvent = "idle" | "working" | "happy";

interface LineParts {
  level: number;
  xpToNextLevel: number;
  hour: number;
}

type Line = (parts: LineParts) => string;

function periodOfDay(hour: number): "manhã" | "tarde" | "noite" {
  if (hour < 12) return "manhã";
  if (hour < 18) return "tarde";
  return "noite";
}

/** Falas por personalidade × evento — cada uma é uma função que monta o
 * texto com dados reais do mascote (nível, XP que falta pro próximo,
 * período do dia) em vez de um texto sempre igual. "sarcástico" é
 * implicante no tom (estilo "treinador grosso"), nunca ofensivo de
 * verdade — a piada é no deboche, não em xingar o usuário.
 *
 * Regra de escrita pra TODAS as falas (o mesmo texto é lido em voz alta
 * pelo botão de ouvir, ver `Mascot`/`speak`): frases curtas e em ordem
 * natural de fala, sem reticências, travessão, dois-pontos, asteriscos de
 * "ação" ou parênteses de gênero — tudo isso ou lê estranho ou é lido ao
 * pé da letra por um sintetizador de voz. */
const AFETUOSO: Record<MascotEvent, Line[]> = {
  idle: [
    (p) => `Boa ${periodOfDay(p.hour)}. Nada ainda por aqui, tudo bem, eu tô com paciência hoje.`,
    (p) => `Faltam ${p.xpToNextLevel} XP pro nível ${p.level + 1}. Sem prazo pra isso, viu.`,
    () => "Fica à vontade. Eu só tô aqui fazendo companhia mesmo.",
  ],
  working: [
    () => "Boa, você entrou. Isso já conta.",
    (p) => `Mais um pouco e são ${p.xpToNextLevel} XP a menos no caminho.`,
    () => "Vou ficar quietinho aqui do lado pra não atrapalhar.",
  ],
  happy: [
    (p) => `Nível ${p.level} agora. Fiquei genuinamente feliz por você.`,
    () => "Foi bonito ver você terminando isso.",
    (p) => `Essa ${periodOfDay(p.hour)} valeu a pena, hein. Descansa um pouco agora.`,
  ],
};

// Deboche com tempero baiano de propósito (pedido explícito) — gírias e
// interjeições ("oxente", "vixe", "eita", "vei") entram no meio da
// implicância, sem depender de gênero de quem lê (nada de "meu rei"/
// "minha rainha" — o app não presume gênero de ninguém pra se dirigir a
// elas).
const SARCASTICO: Record<MascotEvent, Line[]> = {
  idle: [
    (p) => `Boa ${periodOfDay(p.hour)}. Já reparei que a tela tá aberta faz tempo e nada acontece.`,
    (p) => `${p.xpToNextLevel} XP faltando pro nível ${p.level + 1}. Nesse ritmo isso vira aposentadoria, vei.`,
    () => "Oxente, tá esperando o quê, uma intimação?",
  ],
  working: [
    () => "Ata, hoje resolveu trabalhar. Marca no calendário.",
    (p) => `Faltam ${p.xpToNextLevel} XP. Vai que cola essa fase de pessoa produtiva.`,
    () => "Foco de verdade? Vixe, isso sim que é plot twist.",
  ],
  happy: [
    () => "Terminou. Nem eu apostava, confesso.",
    (p) => `Nível ${p.level}, vei. Guarda esse dia, ele é raro.`,
    (p) => `Boa ${periodOfDay(p.hour)} produtiva. Quem te viu, quem te vê.`,
  ],
};

const ENGRACADO: Record<MascotEvent, Line[]> = {
  idle: [
    (p) => `Boa ${periodOfDay(p.hour)}. Eu já ensaiei três piadas esperando você abrir alguma tarefa.`,
    (p) => `Faltam ${p.xpToNextLevel} XP pro nível ${p.level + 1}, ou seja, uma eternidade e meia.`,
    () => "O cursor pisca, o tempo passa, e eu aqui de plantão sem plateia.",
  ],
  working: [
    () => "Modo foco ligado. Prometo não fazer barulho, quase.",
    (p) => `Faltam ${p.xpToNextLevel} XP. Rápido assim até parece que você combinou com alguém.`,
    () => "Psiu, deixa eu fingir que também tô ocupado.",
  ],
  happy: [
    (p) => `Nível ${p.level}. Alguém chama a família, isso merece uma nota de rodapé na história.`,
    () => "Se existisse aplauso de mentirinha, era agora.",
    (p) => `Boa ${periodOfDay(p.hour)}, campeão ou sortudo, tanto faz, deu certo.`,
  ],
};

const MOTIVADOR: Record<MascotEvent, Line[]> = {
  idle: [
    (p) => `Boa ${periodOfDay(p.hour)}. Ainda dá tempo de fazer esse dia valer.`,
    (p) => `${p.xpToNextLevel} XP separam você do nível ${p.level + 1}. Começa pelo mais fácil.`,
    () => "Ninguém precisa do dia perfeito pra começar. Só precisa começar.",
  ],
  working: [
    () => "Isso, mantém o ritmo, é só isso que importa agora.",
    (p) => `Faltam ${p.xpToNextLevel} XP. Você já passou da parte mais difícil, que é começar.`,
    () => "Cansaço no meio é normal. Só não para.",
  ],
  happy: [
    (p) => `Nível ${p.level}. Isso não caiu do céu, foi trabalho seu.`,
    () => "Guarda esse resultado, ele prova o que você é capaz de fazer.",
    (p) => `Boa ${periodOfDay(p.hour)}. Amanhã você repete, só isso.`,
  ],
};

const ZEN: Record<MascotEvent, Line[]> = {
  idle: [
    (p) => `Boa ${periodOfDay(p.hour)}. Não tem nada urgente aqui, só quando você quiser.`,
    (p) => `Faltam ${p.xpToNextLevel} XP pro nível ${p.level + 1}. Isso pode esperar o tempo que precisar.`,
    () => "Ficar parado um pouco também é permitido.",
  ],
  working: [
    () => "Você tá aqui, é o que basta por enquanto.",
    (p) => `Faltam ${p.xpToNextLevel} XP. Sem pressa, um de cada vez chega lá.`,
    () => "Não precisa terminar rápido, só precisa continuar.",
  ],
  happy: [
    (p) => `Nível ${p.level}. Vale parar um segundo antes de seguir pro próximo.`,
    () => "Terminou. Aproveita essa sensação sem já pensar no que vem depois.",
    (p) => `Essa ${periodOfDay(p.hour)} rendeu. Descansa sem culpa agora.`,
  ],
};

const LINES: Record<MascotPersonality, Record<MascotEvent, Line[]>> = {
  afetuoso: AFETUOSO,
  sarcastico: SARCASTICO,
  engracado: ENGRACADO,
  motivador: MOTIVADOR,
  zen: ZEN,
};

/** Escolha determinística (nunca `Math.random()` — não pode mudar sozinha
 * a cada re-render): XP total indexa dentro do banco de falas do evento
 * atual, e a fala escolhida é montada com nível/XP restante/hora reais —
 * ou seja, muda conforme o mascote progride e a hora do dia, não fica
 * presa a um texto fixo repetido pra sempre. */
export function getMascotLine(
  personality: MascotPersonality,
  event: MascotEvent,
  mascot: IMascotState,
  now: Date = new Date()
): string {
  const builders = LINES[personality][event];
  const index = mascot.totalXp % builders.length;

  return builders[index]({
    level: mascot.level,
    xpToNextLevel: mascot.xpForNextLevel - mascot.xpIntoCurrentLevel,
    hour: now.getHours(),
  });
}
