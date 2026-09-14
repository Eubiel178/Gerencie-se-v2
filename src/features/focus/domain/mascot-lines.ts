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
    (p) => `Boa ${periodOfDay(p.hour)}! Tô aqui, na torcida por você.`,
    (p) => `Faltam só ${p.xpToNextLevel} XP pro nível ${p.level + 1}. Quando quiser começar, eu tô pronto.`,
    () => "Sem pressa nenhuma. Eu espero você começar quando estiver bem.",
  ],
  working: [
    () => "Isso aí, só mais um pouco!",
    (p) => `Você tá indo bem. Faltam ${p.xpToNextLevel} XP pro próximo nível.`,
    () => "Continua, eu acredito em você.",
  ],
  happy: [
    (p) => `Mandou muito bem! Nível ${p.level} por aqui.`,
    () => "Que orgulho de você!",
    (p) => `Boa ${periodOfDay(p.hour)} produtiva, hein?`,
  ],
};

// Deboche com tempero baiano de propósito (pedido explícito) — gírias e
// interjeições ("oxente", "vixe", "eita", "véi") entram no meio da
// implicância, sem depender de gênero de quem lê (nada de "meu rei"/
// "minha rainha" — o app não presume gênero de ninguém pra se dirigir a
// elas).
const SARCASTICO: Record<MascotEvent, Line[]> = {
  idle: [
    (p) => `Oxente, boa ${periodOfDay(p.hour)}. Reparei que produtividade não é bem o seu forte hoje.`,
    (p) => `Vixe, faltam ${p.xpToNextLevel} XP pro nível ${p.level + 1}. Nesse ritmo eu chego lá primeiro, véi.`,
    () => "Eita, sentado aí só admirando o vazio? Vai fazer alguma coisa hoje ou não?",
  ],
  working: [
    () => "Ata, véi, hoje é dia de fingir que trabalha. Que evolução.",
    (p) => `Faltam ${p.xpToNextLevel} XP. Continua assim que talvez eu pare de duvidar de você, viu? Talvez.`,
    () => "Olha só, focado de verdade. Vixe, anota a data, isso não acontece todo dia.",
  ],
  happy: [
    () => "Terminou? Oxente, alguém me belisca, isso é surreal.",
    (p) => `Nível ${p.level}, véi. Guarda esse print, porque duvido que se repita amanhã.`,
    (p) => `Boa ${periodOfDay(p.hour)} produtiva? Eita, quem diria. Nem eu apostava nisso.`,
  ],
};

const ENGRACADO: Record<MascotEvent, Line[]> = {
  idle: [
    (p) => `Boa ${periodOfDay(p.hour)}! Bora fazer alguma coisa antes que eu comece a contar piada ruim.`,
    (p) => `Faltam ${p.xpToNextLevel} XP pro nível ${p.level + 1}, quase tão longe quanto minha vontade de trabalhar.`,
    () => "Tic-tac, tic-tac. Ok, eu não sei fazer relógio, mas o tempo tá passando.",
  ],
  working: [
    () => "Modo foco ativado! Bipe bipe, sons de robô bem convincentes.",
    (p) => `Faltam ${p.xpToNextLevel} XP, mais rápido que eu contando até três.`,
    () => "Psiu, não me distrai, eu tô fingindo que também tô trabalhando.",
  ],
  happy: [
    (p) => `Nível ${p.level}! Chama a imprensa, ou pelo menos sua mãe.`,
    () => "Confete imaginário voando por todo lado. Imagina aí.",
    (p) => `Boa ${periodOfDay(p.hour)} de quem venceu! Ou de quem teve sorte. Dá no mesmo hoje.`,
  ],
};

const MOTIVADOR: Record<MascotEvent, Line[]> = {
  idle: [
    (p) => `Boa ${periodOfDay(p.hour)}! Hoje é um ótimo dia pra começar de novo.`,
    (p) => `Só ${p.xpToNextLevel} XP separam você do próximo nível. Vamos lá!`,
    () => "O primeiro passo é sempre o mais difícil, e você já tá aqui. Então já começou.",
  ],
  working: [
    () => "Isso! Cada minuto de foco é uma vitória.",
    (p) => `Faltam ${p.xpToNextLevel} XP. Você tá mais perto do que imagina.`,
    () => "Não pare agora, o resultado já tá vindo.",
  ],
  happy: [
    (p) => `Nível ${p.level} conquistado! Isso é disciplina de verdade.`,
    () => "Você provou pra si mesmo que é capaz, de novo.",
    (p) => `Essa ${periodOfDay(p.hour)} valeu a pena, e amanhã vale ainda mais.`,
  ],
};

const ZEN: Record<MascotEvent, Line[]> = {
  idle: [
    (p) => `Boa ${periodOfDay(p.hour)}. Respire fundo. Quando estiver pronto, eu estarei aqui.`,
    (p) => `Faltam ${p.xpToNextLevel} XP pro nível ${p.level + 1}. Sem pressa, um passo de cada vez.`,
    () => "Nem todo momento precisa de produtividade. Este pode ser só de pausa.",
  ],
  working: [
    () => "Presente, aqui, agora. Só isso já é o suficiente.",
    (p) => `Faltam ${p.xpToNextLevel} XP. O caminho importa tanto quanto o fim dele.`,
    () => "Um foco de cada vez. O resto pode esperar.",
  ],
  happy: [
    (p) => `Nível ${p.level}. Reconheça esse momento, com calma.`,
    () => "Uma conquista tranquila também é uma conquista.",
    (p) => `Uma ${periodOfDay(p.hour)} bem vivida, sem pressa nenhuma.`,
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
