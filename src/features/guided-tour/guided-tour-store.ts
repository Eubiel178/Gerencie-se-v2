"use client";

import { create } from "zustand";

interface GuidedTourStore {
  /** `true` só enquanto o `GuidedTour` está de fato mostrando um
   * tooltip na tela (não apenas "ativo" no banco) - ver `GuidedTour`. */
  isActive: boolean;
  setActive: (active: boolean) => void;
}

/**
 * Precisa viver fora do `GuidedTour` porque o Companion de Tarefas
 * (`useTasksCompanion`) também precisa saber disso, pra nunca competir
 * com o tooltip do tour pelo mesmo espaço de tela - achado real: a
 * saudação de presença espontânea do Companion aparecia por cima/atrás
 * do tooltip do passo "Criar uma tarefa" em `/home/tasks`, com o texto
 * cortado. Mesmo raciocínio de `useMobileNavStore` (dois componentes
 * irmãos, não pai/filho, precisando do mesmo estado).
 */
export const useGuidedTourStore = create<GuidedTourStore>((set) => ({
  isActive: false,
  setActive: (active) => set({ isActive: active }),
}));
