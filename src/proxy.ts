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
  // o código - ver `requireUserId()` em `VerifyEmail`), mas nunca deveria
  // aparecer em `isOnAuthPage` abaixo: lá embaixo, "logado" bounces pra
  // /home - aqui é o oposto, só chega logado mesmo.
  const isOnProtectedArea =
    req.nextUrl.pathname.startsWith("/home") || req.nextUrl.pathname.startsWith("/verify-email");
  const isOnAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");

  if (isOnProtectedArea && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (isOnAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/home", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/home/:path*", "/login", "/register", "/verify-email"],
};
