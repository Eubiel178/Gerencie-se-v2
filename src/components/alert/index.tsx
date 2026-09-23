import styles from "./styles.module.css";

export type AlertVariant = "error" | "success" | "warning" | "info";

export interface AlertProps {
  variant: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

const ROLE_BY_VARIANT: Record<AlertVariant, "alert" | "status"> = {
  error: "alert",
  warning: "alert",
  success: "status",
  info: "status",
};

/**
 * Mensagem de feedback com cor semântica (nunca a mesma cor pra erro e
 * sucesso) — substitui a classe `.formError` reimplementada à mão em
 * cada feature, que em vários lugares usava `--color-info` (azul) pra
 * mensagens de ERRO por engano (achado numa auditoria de acessibilidade).
 */
export function Alert({ variant, children, className }: AlertProps) {
  return (
    <p
      role={ROLE_BY_VARIANT[variant]}
      className={`${styles.alert} ${styles[variant]} ${className ?? ""}`}
    >
      {children}
    </p>
  );
}
