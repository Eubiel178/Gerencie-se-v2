import Link from "next/link";

import styles from "./styles.module.css";

interface CardProps {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
  /** Repassado como atributo pro `<section>` - usado pelo tour guiado
   * (ver `features/guided-tour`) pra apontar pra um widget específico
   * sem precisar de um wrapper extra só pra isso. */
  "data-tour"?: string;
}

/** Bloco de seção do dashboard: título + link opcional "ver tudo" +
 * conteúdo. Compartilhado por todos os widgets do resumo. */
export function Card({ title, href, linkLabel, children, ...rest }: CardProps) {
  return (
    <section className={styles.card} {...rest}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {href && (
          <Link href={href} className={styles.link}>
            {linkLabel ?? "Ver tudo"}
          </Link>
        )}
      </header>

      {children}
    </section>
  );
}

type BadgeTone = "danger" | "warning" | "info" | "success" | "neutral";

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {children}
    </span>
  );
}
