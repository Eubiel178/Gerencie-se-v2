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
 * verdade — a piada é no deboche, não em xingar o usuário. */
const AFETUOSO: Record<MascotEvent, Line[]> = {
  idle: [
    (p) => `Boa ${periodOfDay(p.hour)}! Tô aqui, na torcida por você.`,
    (p) => `Faltam só ${p.xpToNextLevel} XP pro nível ${p.level + 1} — quando quiser começar, eu tô pronto.`,
    () => "Sem pressa nenhuma. Eu espero você começar quando estiver bem.",
  ],
  working: [
    () => "Isso aí, só mais um pouco!",
    (p) => `Você tá indo bem — faltam ${p.xpToNextLevel} XP pro próximo nível.`,
    () => "Continua, eu acredito em você.",
  ],
  happy: [
    (p) => `Mandou muito bem! Nível ${p.level} por aqui.`,
    () => "Que orgulho de você!",
    (p) => `Boa ${periodOfDay(p.hour)} produtiva, hein?`,
  ],
};

const SARCASTICO: Record<MascotEvent, Line[]> = {
  idle: [
    (p) => `Boa ${periodOfDay(p.hour)}... parado de novo, eu vejo.`,
    (p) => `Faltam ${p.xpToNextLevel} XP pro nível ${p.level + 1}. Vai ficar aí olhando ou vai começar?`,
    () => "Vai começar ou só vai ficar me olhando?",
  ],
  working: [
    () => "Trabalhando de verdade ou só fingindo?",
    (p) => `Só mais ${p.xpToNextLevel} XP e eu paro de zoar. Talvez.`,
    () => "Continua, ainda dá tempo de não decepcionar.",
  ],
  happy: [
    () => "Ah, então você consegue quando quer, hein.",
    (p) => `Milagre do dia: nível ${p.level}. Chega perto de impressionar.`,
    (p) => `Boa ${periodOfDay(p.hour)} pra você — não faça beicinho, foi um elogio.`,
  ],
};

const LINES: Record<MascotPersonality, Record<MascotEvent, Line[]>> = {
  afetuoso: AFETUOSO,
  sarcastico: SARCASTICO,
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
