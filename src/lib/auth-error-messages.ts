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
      return "Já existe uma conta com este e-mail cadastrada de outra forma. Entre com e-mail e senha, ou use uma opção de vincular sua conta Google nas configurações depois de entrar.";
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
