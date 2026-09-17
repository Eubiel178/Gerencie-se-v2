"use client";

import { create } from "zustand";

interface MobileNavStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/** Estado do painel de navegação mobile (o "Menu" no cabeçalho, abaixo de
 * 720px) — precisa viver fora do `Header` porque o Guided Tour
 * (`features/guided-tour`) também precisa abrir esse painel sozinho, pra
 * apontar pro item de navegação certo quando ele só existe DENTRO do
 * painel (a `<aside>` de desktop fica com `display:none` nesse
 * viewport). Mesmo raciocínio de `usePaletteStore` (busca) — dois
 * componentes irmãos, não pai/filho, precisando do mesmo estado.
 */
export const useMobileNavStore = create<MobileNavStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
