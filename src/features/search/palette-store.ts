"use client";

import { create } from "zustand";

interface PaletteStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/** Estado mínimo compartilhado entre o botão de busca no Header (mobile,
 * sem teclado físico) e o listener global de Cmd/Ctrl+K (`CommandPalette`)
 * — os dois moram em componentes irmãos, não pai/filho. */
export const usePaletteStore = create<PaletteStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
