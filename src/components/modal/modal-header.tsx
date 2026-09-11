import { MdClose } from "react-icons/md";

import { Button } from "../button";

import styles from "./modal-header.module.css";

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
}

/** Cabeçalho padrão de todo modal do app: título + botão de fechar (X).
 * Sempre o primeiro filho dentro de `<Modal>`. */
export function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <div className={styles.header}>
      <h3>{title}</h3>

      <Button.IconButtonPreset tone="muted" aria-label="Fechar" onClick={onClose}>
        <MdClose />
      </Button.IconButtonPreset>
    </div>
  );
}
