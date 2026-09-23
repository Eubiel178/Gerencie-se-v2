/**
 * `/login` e `/register` só fazem sentido pra quem NÃO tem uma sessão já
 * autenticada e verificada - uma sessão autenticada mas com cadastro
 * PENDENTE de verificação continua vendo o formulário normalmente (achado
 * real: o `proxy.ts`, Edge Runtime sem acesso ao banco, tratava qualquer
 * sessão logada como motivo pra bounce pra /home, prendendo quem tinha um
 * cadastro abandonado sem conseguir alcançar /login OU /register de novo -
 * ver `src/proxy.ts`). Extraído puro só pra ser testável sem precisar
 * simular `auth()`/Server Components.
 */
export function shouldRedirectAuthenticatedToHome(
  userId: string | null | undefined,
  isVerified: boolean
): boolean {
  return !!userId && isVerified;
}
