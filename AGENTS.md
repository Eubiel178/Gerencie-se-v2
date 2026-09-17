<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

@AGENTS.md

prefira essa abordagem de if else const errorMessages: Record<AuthErrorCode, string> = {
OAuthAccountNotLinked:
"Não foi possível concluir o login com Google agora. Tente novamente, ou entre com e-mail e senha.",
AccessDenied:
"O acesso à sua conta Google foi cancelado. Você pode tentar novamente ou entrar com e-mail e senha.",
OAuthCallbackError:
"Não foi possível concluir o login com Google agora. Tente novamente em instantes.",
OAuthSignin:
"Não foi possível concluir o login com Google agora. Tente novamente em instantes.",
OAuthCreateAccount:
"Não foi possível concluir o login com Google agora. Tente novamente em instantes.",
Configuration:
"O login com Google não está configurado corretamente. Tente entrar com e-mail e senha.",
};

return (
errorMessages[code] || "Não foi possível concluir o login. Tente novamente."
);

ao inves de

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
