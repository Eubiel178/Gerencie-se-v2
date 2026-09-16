import type { NextAuthConfig } from "next-auth";
import Google, { type GoogleProfile } from "next-auth/providers/google";

/**
 * Configuração "edge-safe" do Auth.js: só o que roda em qualquer runtime,
 * inclusive o Edge Runtime usado pelo `middleware.ts`.
 *
 * Não inclui o adapter (Drizzle/postgres-js, que é Node-only) nem o
 * Credentials provider (seu `authorize()` faz bcrypt + consulta ao banco,
 * também Node-only). O middleware só precisa validar o *token* de sessão
 * (JWT) para decidir redirecionar ou não — ele nunca chama `authorize()`
 * nem toca no banco diretamente, então essa config reduzida é suficiente
 * para ele. A configuração completa, com adapter e os dois providers, fica
 * em `src/lib/auth.ts` e é usada nas rotas de API, Server Actions e Server
 * Components.
 */
export default {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  // Confia no header Host só quando sabemos que é seguro: em
  // desenvolvimento local não há proxy de terceiros na frente (é a sua
  // própria máquina), e na Vercel (`VERCEL` é definida automaticamente em
  // toda function rodando lá) o X-Forwarded-Host vem corretamente do
  // proxy deles. Fora desses dois casos (self-host atrás de outro proxy),
  // só confia se `AUTH_TRUST_HOST=true` for definida explicitamente —
  // nunca por padrão, para não abrir brecha de Host header injection num
  // ambiente que não controlamos.
  trustHost:
    process.env.NODE_ENV !== "production" ||
    process.env.VERCEL === "1" ||
    process.env.AUTH_TRUST_HOST === "true",
  providers: [
    Google({
      // Escopo mínimo para login — NÃO inclui Calendar. O acesso ao Google
      // Agenda é uma autorização inteiramente separada (ver
      // src/lib/google-calendar.ts e a rota /api/google-calendar/connect).
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
      // Por padrão o Auth.js se recusa a vincular um login Google a uma
      // conta já existente com o mesmo e-mail (erro `OAuthAccountNotLinked`,
      // mensagem "já existe uma conta cadastrada de outra forma") — mesmo
      // quando o Google já confirmou a posse daquele e-mail no próprio
      // login. É uma proteção padrão contra um provedor que NÃO garanta
      // e-mail verificado poder sequestrar uma conta só citando o e-mail
      // certo. Achado real (relato de usuária): conta criada com e-mail/
      // senha, tentou entrar com Google (mesmo e-mail) depois, ficou presa
      // sem conseguir usar nenhum dos dois caminhos até redefinir a senha
      // manualmente - a mensagem de erro promete "vincular sua conta
      // Google nas configurações depois de entrar", mas essa função nunca
      // existiu no app.
      //
      // Habilitado aqui porque, PRA ESTE PROVEDOR ESPECIFICAMENTE, o risco
      // que essa proteção evita já é fechado de outro jeito: o Google
      // sempre garante `email_verified` de verdade (só mapeamos pra
      // `emailVerified` quando `true`, ver `profile()` abaixo), e desde a
      // verificação de e-mail por código no cadastro
      // (`email-verification.ts`), uma conta local só existe depois de
      // provar posse real daquele e-mail também. As duas pontas verificam
      // o mesmo e-mail de forma confiável, então vincular automaticamente
      // não abre uma forma nova de sequestrar conta - só deixa de travar
      // a pessoa legítima fora dela mesma.
      allowDangerousEmailAccountLinking: true,
      // Por padrão o provedor Google do Auth.js NÃO mapeia
      // `profile.email_verified` pra `emailVerified` do adapter — precisa
      // deste `profile()` explícito. Sem isso, uma conta criada via
      // Google ficaria com `emailVerified: null`, igual a uma conta local
      // recém-cadastrada ainda não confirmada, e cairia sem necessidade no
      // gate de `/verify-email` (ver `email-verification.ts`) — mesmo o
      // Google já tendo confirmado a posse do e-mail durante o próprio
      // login (é o provedor quem autentica).
      profile(profile: GoogleProfile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
