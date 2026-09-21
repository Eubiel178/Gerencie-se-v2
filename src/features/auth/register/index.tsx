import styles from "../auth-page.module.css";
import { Figure, Main } from "../components";

import { Auth } from "./components";

export function Register() {
  return (
    <div className={styles.authPage}>
      <Figure />

      <Main>
        <Auth />
      </Main>
    </div>
  );
}
