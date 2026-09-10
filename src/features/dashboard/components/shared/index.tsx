import Link from "next/link";

import styles from "./shared.module.css";

interface CardProps {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}

/** Bloco de seção do dashboard: título + link opcional "ver tudo" +
 * conteúdo. Compartilhado por todos os widgets do resumo. */
export function Card({ title, href, linkLabel, children }: CardProps) {
  return (
    <section className={styles.card}>
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
