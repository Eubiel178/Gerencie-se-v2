"use client";

import { useState } from "react";

import { Icon } from "../icon";

import styles from "./collapsible-section.module.css";

interface CollapsibleSectionProps {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

/**
 * Recolhe campos secundários (lembrete, compartilhar, sincronizar) atrás
 * de um "Mais opções" — o formulário abre leve (só o essencial visível),
 * sem esconder nada de quem precisa. Usado nos modais de
 * adicionar/editar de tarefa, hábito, objetivo, rotina e evento.
 */
export function CollapsibleSection({ label, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Icon name="MdExpandMore" className={styles.chevron} data-open={isOpen} aria-hidden="true" />
        {label}
      </button>

      {isOpen && <div className={styles.content}>{children}</div>}
    </div>
  );
}
