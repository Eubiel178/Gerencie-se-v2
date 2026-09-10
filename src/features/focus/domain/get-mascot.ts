import { IMascotState } from "./mascot";

// Cria o estado do mascote na primeira chamada (linha ainda não existe
// pra usuários que nunca focaram) — sempre devolve um estado válido,
// nunca null.
export type GetMascotState = {
  getMascot: () => Promise<IMascotState>;
};

export type AddMascotXp = {
  addXp: (amount: number) => Promise<IMascotState>;
};
