import styles from "../../../auth-page.module.css";

type MainProps = React.ComponentProps<"main">;

export function Main({ children }: MainProps) {
  return <main className={styles.main}>{children}</main>;
}
