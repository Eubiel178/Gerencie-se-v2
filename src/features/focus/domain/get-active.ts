import { IFocusSession } from "./focus-session";

// Devolve a sessão "running" do usuário, se existir — usado pro Server
// Component saber se deve mostrar o cronômetro contando (retomando após
// um F5) ou a tela de "iniciar foco".
export type GetActiveFocusSession = {
  getActive: () => Promise<IFocusSession | null>;
};
