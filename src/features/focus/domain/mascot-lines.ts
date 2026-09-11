import { IMascotState, MascotPersonality } from "./mascot";

export type MascotEvent = "idle" | "working" | "happy";

/** Falas curtas do mascote, por personalidade × evento. "sarcástico" é
 * implicante no tom (estilo "treinador grosso"), nunca ofensivo de
 * verdade — a piada é no deboche, não em xingar o usuário. */
const LINES: Record<MascotPersonality, Record<MascotEvent, string[]>> = {
  afetuoso: {
    idle: ["Tô aqui, na torcida por você.", "Quando quiser começar, eu tô pronto."],
    working: ["Isso aí, só mais um pouco!", "Você tá indo bem, continua assim."],
    happy: ["Mandou muito bem!", "Que orgulho de você!"],
  },
  sarcastico: {
    idle: ["De novo aqui parado?", "Vai começar ou só vai ficar me olhando?"],
    working: ["Trabalhando de verdade ou só fingindo?", "Continua, ainda dá tempo de não decepcionar."],
    happy: ["Ah, então você consegue quando quer, hein.", "Milagre do dia: você terminou algo."],
  },
};

/** Escolha determinística (não muda a cada re-render): usa o XP total
 * do mascote pra indexar dentro do banco de falas do evento atual. */
export function getMascotLine(personality: MascotPersonality, event: MascotEvent, mascot: IMascotState): string {
  const lines = LINES[personality][event];
  const index = mascot.totalXp % lines.length;

  return lines[index];
}
