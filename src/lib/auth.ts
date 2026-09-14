import "server-only";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { handleFailedLoginAttempt, handleSuccessfulLogin } from "@/lib/login-attempt-tracker";

import authConfig from "./auth.config";

/**
 * Configuração completa do Auth.js — usada nas rotas de API, Server Actions
 * e Server Components. Estende `auth.config.ts` (edge-safe, usada também
 * pelo `middleware.ts`) adicionando o adapter do banco e o Credentials
 * provider, ambos Node-only.
 */
export const { handlers, auth, signIn } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    ...authConfig.callbacks,
    // Sobrescreve o `session` do `auth.config.ts` (edge-safe, sem banco) —
    // a sessão usa estratégia JWT, então `session.user.name`/`.image`
    // normalmente ficam CONGELADOS no valor de quando o token foi emitido
    // (login), mesmo depois de editar o perfil ou trocar o avatar em
    // Configurações → Conta (achado ao testar essa tela: editar nome/foto
    // "funcionava" no banco, mas nunca aparecia atualizado sem sair e
    // entrar de novo). Essa versão relê nome/avatar direto do banco a
    // cada `auth()` — consulta indexada por chave primária, barata.
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;

        const [freshUser] = await db
          .select({ name: users.name, image: users.image })
          .from(users)
          .where(eq(users.id, token.sub))
          .limit(1);

        if (freshUser) {
          session.user.name = freshUser.name;
          session.user.image = freshUser.image;
        }
      }

      return session;
    },
  },
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        // Usuário não existe, ou só tem conta Google (sem senha definida):
        // não revelamos qual dos dois motivos foi, para não vazar quais
        // e-mails já têm cadastro.
        if (!user || !user.passwordHash) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(
          password,
          user.passwordHash
        );

        if (!passwordMatches) {
          // Só rastreia pra quem EXISTE (ver `handleFailedLoginAttempt`) —
          // nunca atrasa nem muda o retorno pro chamador; a mensagem de
          // erro de login continua idêntica não importa o que acontecer
          // aqui.
          await handleFailedLoginAttempt(user.id);
          return null;
        }

        await handleSuccessfulLogin(user.id);

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
});

/**
 * Diz se o usuário tem uma conta Google vinculada para LOGIN — isto é, uma
 * linha em `account` com `provider = "google"`, criada pelo Auth.js quando
 * ele entra (ou se cadastra) via "Continuar com Google".
 *
 * Isso é completamente independente de `getGoogleConnection`
 * (`src/lib/google-calendar.ts`), que diz se o Google Agenda está
 * conectado. Um usuário pode ter feito login com Google e nunca ter
 * conectado a Agenda, e vice-versa (login local + Agenda conectada depois)
 * — por isso a tela de Configurações mostra "Conta" e "Integrações" como
 * duas seções separadas, cada uma consultando sua própria fonte.
 */
export async function isGoogleAccountLinked(userId: string): Promise<boolean> {
  const [account] = await db
    .select({ provider: accounts.provider })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, "google")))
    .limit(1);

  return !!account;
}
