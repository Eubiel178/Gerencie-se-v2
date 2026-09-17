/**
 * Traduz os códigos de erro que o Auth.js coloca na URL de callback
 * (`/login?error=...`) quando o login com Google falha, em mensagens que
 * fazem sentido pro usuário — nunca deixamos a tela de login "sem
 * explicação nenhuma" nesses casos, e nunca criamos uma sessão inválida.
 */

type AuthErrorCode =
  | "OAuthAccountNotLinked"
  | "AccessDenied"
  | "OAuthCallbackError"
  | "OAuthSignin"
  | "OAuthCreateAccount"
  | "Configuration";

const authErrorMessages: Record<AuthErrorCode, string> = {
  OAuthAccountNotLinked:
    "Não foi possível concluir o login com Google agora. Tente novamente, ou entre com e-mail e senha.",
  AccessDenied:
    "Não foi possível concluir o login com Google. Tente novamente ou entre com e-mail e senha.",
  OAuthCallbackError:
    "Não foi possível concluir o login com Google agora. Tente novamente em instantes.",
  OAuthSignin:
    "Não foi possível concluir o login com Google agora. Tente novamente em instantes.",
  OAuthCreateAccount:
    "Não foi possível concluir o login com Google agora. Tente novamente em instantes.",
  Configuration:
    "O login com Google não está configurado corretamente. Tente entrar com e-mail e senha.",
};

export function authErrorMessage(code: string | null): string | null {
  if (!code) return null;

  if (Object.hasOwn(authErrorMessages, code)) {
    return authErrorMessages[code as AuthErrorCode];
  }

  return "Não foi possível concluir o login. Tente novamente.";
}
