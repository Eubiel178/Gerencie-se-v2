import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isEmailVerified } from "@/lib/email";

import styles from "../auth-page.module.css";
import { Figure, Main } from "../components";
import { shouldRedirectAuthenticatedToHome } from "../should-redirect-authenticated";

import { Auth } from "./components";

/**
 * Checagem de "já autenticado" mora AQUI (Server Component com acesso
 * real ao banco), não no `proxy.ts` (Edge Runtime, só lê o JWT, nunca
 * consegue saber se o e-mail foi verificado - ver comentário em
 * `proxy.ts`). Só redireciona pra /home quando a sessão está VERIFICADA
 * de verdade - uma sessão logada mas com cadastro pendente (comum: começou
 * um cadastro antes e nunca confirmou o código) continua vendo o
 * formulário normalmente, nunca é forçada pra /verify-email só por visitar
 * esta página.
 */
export async function Register() {
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
        <Auth />
      </Main>
    </div>
  );
}
