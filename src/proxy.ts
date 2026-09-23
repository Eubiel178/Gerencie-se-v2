import NextAuth from "next-auth";

import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth";

// O middleware roda no Edge Runtime, que não suporta o driver `postgres`
// (Node-only). Por isso ele usa a config "edge-safe" (`auth.config.ts`, sem
// adapter nem Credentials provider) em vez de `@/lib/auth` — só precisa ler
// o JWT da sessão para decidir se redireciona, nunca toca no banco.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  // `/verify-email` exige estar logado (precisa saber PRA QUEM verificar
  // o código - ver `requireUserId()` em `VerifyEmail`).
  const isOnProtectedArea =
    req.nextUrl.pathname.startsWith("/home") || req.nextUrl.pathname.startsWith("/verify-email");

  if (isOnProtectedArea && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  // Bug real corrigido: isto ANTES redirecionava QUALQUER sessão logada
  // pra fora de /login e /register direto pra /home - mas o middleware
  // roda no Edge Runtime (ver comentário no import de `authConfig` acima),
  // que não pode consultar o banco pra saber se o e-mail já foi
  // verificado. O JWT sozinho não sabe distinguir "logado e verificado"
  // de "logado com cadastro pendente" - então uma sessão pendente (comum:
  // alguém que começou um cadastro e nunca confirmou o código) ficava
  // presa, incapaz de alcançar /login OU /register, sempre caindo em
  // /verify-email não importa o que clicasse (achado relatado: "Entrar
  // levou pra verificação de e-mail"). A checagem de "já autenticado E
  // verificado, não faz sentido mostrar login de novo" agora vive nas
  // próprias páginas (`Login`/`Register`, Server Components com acesso
  // real ao banco via `auth()`/`isEmailVerified()`), não aqui.
  return NextResponse.next();
});

export const config = {
  matcher: ["/home/:path*", "/login", "/register", "/verify-email"],
};
