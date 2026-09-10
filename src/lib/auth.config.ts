import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Configuração "edge-safe" do Auth.js: só o que roda em qualquer runtime,
 * inclusive o Edge Runtime usado pelo `middleware.ts`.
 *
 * Não inclui o adapter (Drizzle/@libsql/client, que é Node-only) nem o
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
  // O app roda localmente, na máquina do próprio usuário, sem domínio
  // público nem proxy reverso na frente — não há um "Host" de terceiros
  // pra validar contra ataques de Host header injection, cenário que essa
  // proteção do Auth.js existe para cobrir. Documentado como decisão
  // consciente: numa eventual versão hospedada atrás de um proxy, isso
  // deveria dar lugar a `AUTH_URL`/`AUTH_TRUST_HOST` configurados no
  // ambiente de produção real, não a esta flag fixa no código.
  trustHost: true,
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
