import styles from "../../auth-page.module.css";

type MainProps = React.ComponentProps<"main">;

/** Coluna do formulário nas telas de autenticação — era duplicada byte a
 * byte em `login`/`register` antes de existir aqui. */
export function Main({ children }: MainProps) {
  return <main className={styles.main}>{children}</main>;
}
