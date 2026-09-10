// 100 XP por nível — número redondo, fácil de comunicar na interface
// ("faltam 35 XP pro próximo nível"). Não precisa ser sofisticado: é só
// uma progressão simples que dá sensação de avanço a cada sessão de foco.
export const XP_PER_LEVEL = 100;

export interface IMascotState {
  userId: string;
  name: string;
  totalXp: number;
  // Calculado a partir de `totalXp` (nunca guardado — mesma lógica de
  // "progresso calculado, nunca persistido" usada em Goals/Habits).
  level: number;
  xpIntoCurrentLevel: number;
  xpForNextLevel: number;
}
