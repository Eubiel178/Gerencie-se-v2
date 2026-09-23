import { Button } from "../../button";
import { useModalTitleId } from "../modal-context";

import styles from "./styles.module.css";

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
}

/** Cabeçalho padrão de todo modal do app: título + botão de fechar (X).
 * Sempre o primeiro filho dentro de `<Modal>`. O `id` do `<h3>` vem do
 * `Modal` pai via contexto — é o que `aria-labelledby` do modal aponta
 * (leitor de tela anuncia este texto ao entrar no diálogo). */
export function ModalHeader({ title, onClose }: ModalHeaderProps) {
  const titleId = useModalTitleId();

  return (
    <div className={styles.header}>
      <h3 id={titleId}>{title}</h3>

      <Button.Preset
        icon={{ name: "MdClose" }}
        root={{ tone: "muted", "aria-label": "Fechar", onClick: onClose }}
      />
    </div>
  );
}
