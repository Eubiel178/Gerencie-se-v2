import { Auth } from "./components";
import { Figure, Main } from "../components";
import styles from "../auth-page.module.css";

export function ForgotPassword() {
  return (
    <div className={styles.authPage}>
      <Figure />

      <Main>
        <Auth />
      </Main>
    </div>
  );
}
