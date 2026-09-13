"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { ModalContextProvider } from "./modal-context";
import { getFocusableElements } from "./get-focusable-elements";

import styles from "./styles.module.css";

type ModalProps = React.ComponentProps<"div"> & {
  /** Clicar fora da caixa do modal (no fundo escurecido) fecha, quando
   * informado — mesmo comportamento do X no `ModalHeader`. */
  onClose?: () => void;
};

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
export const Modal = ({ children, className, onClose, ...rest }: ModalProps) => {
  const isClient = useSyncExternalStore(
    subscribeNoop,
    getIsClientSnapshot,
    getIsClientServerSnapshot
  );
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  // `onClose` quase sempre chega com uma identidade nova a cada
  // renderização (quem chama define `closeModal`/`onSubmit` inline, sem
  // `useCallback`) — colocá-la no array de dependências do efeito
  // principal abaixo faria ele inteiro reiniciar a cada tecla digitada no
  // formulário, recapturando "o que tinha foco antes" como o próprio
  // campo sendo digitado, não o botão que abriu o modal. Esta ref
  // sincronizada a cada render (mas nunca lida durante a própria
  // renderização) evita isso: o efeito principal roda só uma vez por
  // montagem/desmontagem de verdade, e o handler de teclado sempre lê a
  // versão mais recente de `onClose` através dela.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Captura o elemento focado ANTES do modal existir — de propósito
  // durante a renderização, não num efeito: campos com `autoFocus` (ex.
  // o campo de título dos formulários) roubam o foco durante o commit,
  // uma fase que sempre acontece antes de `useEffect` (mesmo
  // `useLayoutEffect` do próprio Modal rodaria tarde demais, depois do
  // filho já ter aplicado seu `autoFocus`). Guardado numa ref pra só
  // capturar uma vez, não a cada nova renderização enquanto o modal
  // segue aberto.
  const previouslyFocusedRef = useRef<HTMLElement | null | undefined>(undefined);
  if (previouslyFocusedRef.current === undefined) {
    previouslyFocusedRef.current = (isClient ? document.activeElement : null) as HTMLElement | null;
  }

  // Trava de foco/teclado/scroll — roda uma vez por montagem (o Modal só
  // existe enquanto estiver aberto, controlado por `{isOpen && <Modal>}`
  // em quem chama, então "montar" já é "abrir").
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = previouslyFocusedRef.current;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Se nada dentro do modal já pegou foco sozinho (ex.: `autoFocus` num
    // campo do formulário), foca o primeiro elemento focável — nunca
    // deixa o foco "solto" atrás do modal, invisível pro usuário.
    if (!container.contains(document.activeElement)) {
      const [firstFocusable] = getFocusableElements(container);
      (firstFocusable ?? container).focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current?.();
        return;
      }

      if (event.key !== "Tab" || !container) return;

      // Focus trap: Tab/Shift+Tab nunca escapam do modal pro resto da
      // página atrás dele.
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      // Devolve o foco pra quem abriu o modal (o botão "Editar", etc.) —
      // sem isso, depois de fechar, o foco do teclado fica em lugar
      // nenhum (o botão trigger nem sempre está mais montado como antes).
      previouslyFocused?.focus?.();
    };
  }, []);

  if (!isClient) return null;

  const classNames = `${styles.modal} ${className || ""}`;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={(event) => {
        // Só fecha se o clique foi no próprio fundo — nunca quando ele
        // começa dentro da caixa do modal e "borbulha" até aqui.
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={containerRef}
        className={classNames}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        {...rest}
      >
        <ModalContextProvider value={{ titleId }}>{children}</ModalContextProvider>
      </div>
    </div>,
    document.body
  );
};
