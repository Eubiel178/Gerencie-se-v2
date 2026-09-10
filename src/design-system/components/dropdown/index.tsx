"use client";

import {
  ButtonHTMLAttributes,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import styles from "./styles.module.css";

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("Dropdown.* precisa estar dentro de <Dropdown.Root>");
  return ctx;
}

interface RootProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Root({ children, open: controlledOpen, onOpenChange }: RootProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className={styles.wrapper} ref={wrapperRef}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

function Trigger({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useDropdownContext();

  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      {...rest}
    >
      {children}
    </button>
  );
}

function Menu({ children }: { children: ReactNode }) {
  const { open } = useDropdownContext();

  return (
    <div
      role="menu"
      className={[styles.menu, open ? styles.menuOpen : ""].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}

function Item({
  children,
  onSelect,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { onSelect?: () => void }) {
  const { setOpen } = useDropdownContext();

  return (
    <button
      type="button"
      role="menuitem"
      className={styles.item}
      onClick={() => {
        onSelect?.();
        setOpen(false);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * `<Dropdown><Dropdown.Trigger/><Dropdown.Menu><Dropdown.Item/></Dropdown.Menu></Dropdown>`.
 * Fecha ao clicar fora, ao apertar Esc, ou ao selecionar um item.
 */
export const Dropdown = Object.assign(Root, { Trigger, Menu, Item });
