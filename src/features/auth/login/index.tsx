import { Suspense } from "react";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isEmailVerified } from "@/lib/email";

import styles from "../auth-page.module.css";
import { Figure, Main } from "../components";
import { shouldRedirectAuthenticatedToHome } from "../should-redirect-authenticated";

import { Auth } from "./components";

/**
 * Mesmo raciocínio de `Register` - a checagem de "já autenticado e
 * verificado, não faz sentido mostrar login de novo" mora aqui (Server
 * Component com banco), não no `proxy.ts` (Edge, só JWT). Uma sessão
 * logada mas ainda não verificada continua vendo o formulário de login
 * normalmente - entrar de novo (mesma conta ou outra) é uma ação
 * deliberada da pessoa, nunca um bounce automático.
 */
export async function Login() {
  const session = await auth();
  const userId = session?.user?.id;
  const isVerified = userId ? await isEmailVerified(userId) : false;
  if (shouldRedirectAuthenticatedToHome(userId, isVerified)) {
    redirect("/home");
  }

  return (
    <div className={styles.authPage}>
      <Figure />

      <Main>
        {/* `Auth` lê `useSearchParams()` para mostrar o motivo quando o
            Google redireciona de volta com `?error=...` — isso exige um
            limite de Suspense em volta dela. */}
        <Suspense fallback={null}>
          <Auth />
        </Suspense>
      </Main>
    </div>
  );
}
