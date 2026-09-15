import styles from "./empty-state.module.css";

export interface EmptyStateProps {
  /**
   * "box" (listas principais): caixa com borda tracejada, usada em
   * listas que são o CONTEÚDO principal da página (tarefas, hábitos,
   * objetivos, rotina) — precisa de destaque, é a primeira coisa que a
   * pessoa vê ao abrir a tela sem nenhum item ainda.
   * "inline": só o texto, sem caixa — usada em widgets secundários e
   * históricos (corrida, ciclo, histórico de foco) — onde uma caixa
   * grande chamaria mais atenção do que o vazio merece.
   */
  variant?: "box" | "inline";
  /** "muted": versão ainda mais discreta do "inline" (cinza, texto
   * pequeno) — os cards compactos do dashboard (tarefas pendentes,
   * hábitos de hoje, progresso das metas) usavam essa versão antes de
   * existir este componente; o "inline" padrão (azul, tamanho médio)
   * chamaria atenção demais num card pequeno lado a lado com outros. */
  tone?: "default" | "muted";
  className?: string;
  children: React.ReactNode;
}

/**
 * Estado vazio de uma lista — antes cada feature copiava o mesmo bloco de
 * CSS (caixa tracejada, texto solto, ou a versão discreta dos cards do
 * dashboard) no próprio módulo, com nomes de classe diferentes a cada
 * cópia (`empty`, `emptyMessage`, `emptyState`, `hint`...) - ver
 * auditoria de duplicação. Variante + tom cobrem os padrões visuais já
 * em uso no app; não força um único molde onde os contextos (lista
 * principal vs. widget secundário vs. card compacto) são legitimamente
 * diferentes.
 */
export function EmptyState({ variant = "inline", tone = "default", className, children }: EmptyStateProps) {
  if (variant === "box") {
    return (
      <div className={`${styles.box} ${className ?? ""}`}>
        <p className={styles.message} data-tone={tone}>
          {children}
        </p>
      </div>
    );
  }

  return (
    <p className={`${styles.message} ${className ?? ""}`} data-tone={tone}>
      {children}
    </p>
  );
}
