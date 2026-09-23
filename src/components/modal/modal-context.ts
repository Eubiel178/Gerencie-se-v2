"use client";

import { createContext, useContext } from "react";

interface ModalContextValue {
  /** Id gerado por `Modal` (via `useId`) e aplicado por `ModalHeader` no
   * `<h3>` do título — é o que permite `aria-labelledby` no modal
   * apontar pro texto certo sem os dois componentes precisarem se
   * conhecer além disso. */
  titleId: string;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export const ModalContextProvider = ModalContext.Provider;

export function useModalTitleId(): string | undefined {
  return useContext(ModalContext)?.titleId;
}
