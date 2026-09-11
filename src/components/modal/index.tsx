"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import styles from "./styles.module.css";

type ModalProps = React.ComponentProps<"div">;

// `document` não existe no servidor — usa o mesmo padrão de
// `useSyncExternalStore` já usado em `use-theme.ts`/`widget` pra saber se já
// está no cliente sem `useEffect` + `setState` (dispararia
// `react-hooks/set-state-in-effect`).
function subscribeNoop() {
  return () => {};
}
function getIsClientSnapshot() {
  return true;
}
function getIsClientServerSnapshot() {
  return false;
}

/**
 * Sempre renderiza via portal em `document.body` — nunca como filho direto
 * de quem o chama. Antes disso, um `<Modal>` aberto de dentro da sidebar
 * (que tem `overflow-y: auto`) ficava CLIPADO pelas bordas dela mesmo sendo
 * `position: fixed`: um elemento fixed que é descendente de um ancestral
 * com overflow não-visível continua sendo recortado pelo box desse
 * ancestral na hora de pintar a tela — o overlay "sumia"/aparecia cortado
 * em vez de cobrir a tela toda. O portal escapa desse problema (e de
 * qualquer stacking context futuro) de uma vez por todas.
 */
export const Modal = ({ children, className, ...rest }: ModalProps) => {
  const isClient = useSyncExternalStore(
    subscribeNoop,
    getIsClientSnapshot,
    getIsClientServerSnapshot
  );

  if (!isClient) return null;

  const classNames = `${styles.modal} ${className || ""}`;

  return createPortal(
    <div className={styles.overlay}>
      <div className={classNames} {...rest}>
        {children}
      </div>
    </div>,
    document.body
  );
};
