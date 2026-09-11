import { IMascotState, MascotPersonality, MascotRenderMode, MascotSpecies } from "./mascot";

// Cria o estado do mascote na primeira chamada (linha ainda não existe
// pra usuários que nunca focaram) — sempre devolve um estado válido,
// nunca null.
export type GetMascotState = {
  getMascot: () => Promise<IMascotState>;
};

export type AddMascotXp = {
  addXp: (amount: number) => Promise<IMascotState>;
};

export interface IMascotPatch {
  name?: string;
  personality?: MascotPersonality;
  species?: MascotSpecies;
  renderMode?: MascotRenderMode;
}

export type UpdateMascot = {
  updateMascot: (patch: IMascotPatch) => Promise<void>;
};
