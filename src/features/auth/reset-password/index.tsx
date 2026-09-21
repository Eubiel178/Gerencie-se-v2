import { Suspense } from "react";

import styles from "../auth-page.module.css";
import { Figure, Main } from "../components";

import { Auth } from "./components";

export function ResetPassword() {
  return (
    <div className={styles.authPage}>
      <Figure />

      <Main>
        {/* `Auth` lê `useSearchParams()` para pegar o token da URL — isso
            exige um limite de Suspense para não impedir a pré-renderização
            estática desta página (mesmo motivo do `Login`). */}
        <Suspense fallback={null}>
          <Auth />
        </Suspense>
      </Main>
    </div>
  );
}
