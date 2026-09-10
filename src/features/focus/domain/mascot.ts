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

export interface MascotLevelInfo {
  level: number;
  xpIntoCurrentLevel: number;
  xpForNextLevel: number;
}

/** Deriva nível e progresso dentro do nível a partir do XP total — função
 * pura, sem banco, para ser testável isoladamente (ver `mascot.test.ts`). */
export function calculateMascotLevel(totalXp: number): MascotLevelInfo {
  const safeXp = Math.max(0, totalXp);

  return {
    level: Math.floor(safeXp / XP_PER_LEVEL) + 1,
    xpIntoCurrentLevel: safeXp % XP_PER_LEVEL,
    xpForNextLevel: XP_PER_LEVEL,
  };
}
