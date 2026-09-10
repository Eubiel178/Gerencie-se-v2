import { HTMLAttributes } from "react";

import styles from "./card.module.css";

interface CardRootProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

function Root({ interactive, className, children, ...rest }: CardRootProps) {
  const classNames = [styles.card, interactive ? styles.interactive : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
}

function Header({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={[styles.header, className ?? ""].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}

function Content({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={[styles.content, className ?? ""].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}

function Footer({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={[styles.footer, className ?? ""].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}

/**
 * Composition Pattern: `<Card><Card.Header/><Card.Content/><Card.Footer/></Card>`.
 * Cada slot é opcional — use só o que a tela precisar.
 */
export const Card = Object.assign(Root, { Header, Content, Footer });
