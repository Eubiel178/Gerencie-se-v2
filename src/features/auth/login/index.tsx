import { Suspense } from "react";

import { Auth } from "./components";
import { Figure, Main } from "../components";
import styles from "../auth-page.module.css";

export function Login() {
  return (
    <div className={styles.authPage}>
      <Figure />

      <Main>
        {/* `Auth` lê `useSearchParams()` para mostrar o motivo quando o
            Google redireciona de volta com `?error=...` — isso exige um
            limite de Suspense para não impedir a pré-renderização estática
            desta página. */}
        <Suspense fallback={null}>
          <Auth />
        </Suspense>
      </Main>
    </div>
  );
}
