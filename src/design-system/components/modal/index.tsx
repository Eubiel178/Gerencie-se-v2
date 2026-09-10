"use client";

import {
  HTMLAttributes,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

import styles from "./modal.module.css";

interface ModalRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  /** Rótulo acessível do diálogo quando não há `Modal.Title` visível. */
  "aria-label"?: string;
}

const ModalContext = createContext<{ requestClose: () => void } | null>(null);

/**
 * Usa o elemento nativo `<dialog>`: foco travado dentro do modal, fechar
 * com Esc e camada de topo (`::backdrop`) vêm de graça do navegador — não
 * precisamos reimplementar isso em JS. A única coisa que orquestramos é a
 * transição de saída (esperar a animação antes de `close()` de verdade).
 */
function Root({ open, onOpenChange, children, ...rest }: ModalRootProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closingRef = useRef(false);

  const requestClose = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || closingRef.current) return;

    closingRef.current = true;
    dialog.dataset.state = "closing";

    const finish = () => {
      dialog.close();
      closingRef.current = false;
    };

    const fallback = setTimeout(finish, 250);
    dialog.addEventListener(
      "transitionend",
      () => {
        clearTimeout(fallback);
        finish();
      },
      { once: true }
    );
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      // Muda o atributo depois do próximo frame para o navegador aplicar o
      // estado inicial (opacity/transform) antes da transição começar.
      requestAnimationFrame(() => {
        dialog.dataset.state = "open";
      });
    } else if (!open && dialog.open) {
      requestClose();
    }
  }, [open, requestClose]);

  // Esc e clique fora do conteúdo disparam o evento nativo `close` do
  // <dialog> — sincronizamos o estado do React com isso.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function handleClose() {
      onOpenChange(false);
    }

    function handleClick(event: MouseEvent) {
      if (event.target === dialog) {
        onOpenChange(false);
      }
    }

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("click", handleClick);

    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("click", handleClick);
    };
  }, [onOpenChange]);

  return (
    <dialog ref={dialogRef} className={styles.dialog} {...rest}>
      <ModalContext.Provider value={{ requestClose }}>
        {open && children}
      </ModalContext.Provider>
    </dialog>
  );
}

function Header({ children }: { children: ReactNode }) {
  const ctx = useContext(ModalContext);

  return (
    <div className={styles.header}>
      <div>{children}</div>
      <button
        type="button"
        className={styles.closeButton}
        aria-label="Fechar"
        onClick={() => ctx?.requestClose()}
      >
        ×
      </button>
    </div>
  );
}

function Title({ children }: { children: ReactNode }) {
  return <h2 className={styles.title}>{children}</h2>;
}

function Content({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={[styles.content, className ?? ""].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}

function Footer({ children }: { children: ReactNode }) {
  return <div className={styles.footer}>{children}</div>;
}

/**
 * `<Modal open={open} onOpenChange={setOpen}>` + `Modal.Header/Title/Content/Footer`.
 * Foco, Esc e clique-fora já funcionam nativamente via `<dialog>`.
 */
export const Modal = Object.assign(Root, { Header, Title, Content, Footer });
