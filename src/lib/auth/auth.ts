import "server-only";

import NextAuth from "next-auth";

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/db/client";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { normalizeEmail } from "@/utils/normalize-email";

import authConfig from "./config";
import { handleFailedLoginAttempt, handleSuccessfulLogin } from "./login-attempt-tracker";

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
  events: {
    // `profile()` em `auth.config.ts` preenche `emailVerified` ao CRIAR
    // uma conta via Google. Quando o Google é vinculado a uma conta local
    // que já existe, porém, o adapter reutiliza a linha e não reaplica os
    // campos do profile. O callback `signIn` acontece antes desse vínculo;
    // este evento acontece depois, quando `user.id` já é o ID real da
    // conta local. Assim ela não cai no gate de `/verify-email` nem espera
    // por um código que o login Google não deve exigir.
    async signIn({ account, profile, user }) {
      if (
        account?.provider !== "google" ||
        !user.id ||
        !profile ||
        !("email_verified" in profile) ||
        profile.email_verified !== true
      ) {
        return;
      }

      await db
        .update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.id, user.id));
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

        const normalizedEmail = normalizeEmail(email);

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
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
