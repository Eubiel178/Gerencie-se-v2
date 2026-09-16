/**
 * Traduz os códigos de erro que o Auth.js coloca na URL de callback
 * (`/login?error=...`) quando o login com Google falha, em mensagens que
 * fazem sentido pro usuário — nunca deixamos a tela de login "sem
 * explicação nenhuma" nesses casos, e nunca criamos uma sessão inválida.
 */
export function authErrorMessage(code: string | null): string | null {
  if (!code) return null;

  switch (code) {
    case "OAuthAccountNotLinked":
      // Com `allowDangerousEmailAccountLinking` (ver `auth.config.ts`),
      // esse erro não dispara mais pro caso comum (e-mail já cadastrado
      // por senha, tentando entrar com Google depois) - o Auth.js já
      // vincula sozinho nesse caso. O que sobra aqui é o resíduo de algo
      // realmente ter dado errado no meio do processo - pedir pra tentar
      // de novo é honesto; prometer uma tela de "vincular conta" que não
      // existe não era (achado real: usuária ficou presa acreditando
      // nessa opção).
      return "Não foi possível concluir o login com Google agora. Tente novamente, ou entre com e-mail e senha.";
    case "AccessDenied":
      return "O acesso à sua conta Google foi cancelado. Você pode tentar novamente ou entrar com e-mail e senha.";
    case "OAuthCallbackError":
    case "OAuthSignin":
    case "OAuthCreateAccount":
      return "Não foi possível concluir o login com Google agora. Tente novamente em instantes.";
    case "Configuration":
      return "O login com Google não está configurado corretamente. Tente entrar com e-mail e senha.";
    default:
      return "Não foi possível concluir o login. Tente novamente.";
  }
}
