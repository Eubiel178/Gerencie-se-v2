"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "@/db/client";
import { users, userPreferences } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";
import { validationSchema } from "@/validation/profile-schema";
import { changePasswordSchema } from "@/validation/change-password-schema";

import type { ActionResult } from "@/types/action-result";

// Mesmo custo de hash usado no cadastro (`src/features/auth/actions.ts`)
// — nunca deve divergir entre os dois lugares que geram um hash novo.
const BCRYPT_SALT_ROUNDS = 12;

export async function updateProfileAction(data: unknown): Promise<ActionResult> {
  const parsed = validationSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const userId = await requireUserId();

    // Duas tabelas, de propósito: nome mora em `users` (Auth.js), gênero é
    // só uma preferência de exibição em `user_preference` — nunca precisou
    // virar coluna de `users`.
    await Promise.all([
      db.update(users).set({ name: parsed.data.name }).where(eq(users.id, userId)),
      db
        .insert(userPreferences)
        .values({ userId, gender: parsed.data.gender })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: { gender: parsed.data.gender },
        }),
    ]);

    revalidatePath("/home", "layout");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar. Tente novamente." };
  }
}

/** Só funciona pra quem tem senha própria (login por e-mail/senha) —
 * conta só-Google não tem `passwordHash` pra conferir contra. A tela de
 * Configurações já só mostra este formulário nesse caso (ver
 * `isGoogleAccountLinked`), mas a Server Action confere de novo aqui:
 * nunca confia só na condição já ter sido checada no lado do cliente. */
export async function changePasswordAction(data: unknown): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const userId = await requireUserId();

    const [user] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.passwordHash) {
      return { error: "Esta conta não tem senha própria (login feito com Google)." };
    }

    const currentPasswordMatches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);

    if (!currentPasswordMatches) {
      return { error: "Senha atual incorreta." };
    }

    const newPasswordHash = await bcrypt.hash(parsed.data.newPassword, BCRYPT_SALT_ROUNDS);
    await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, userId));

    return { error: null };
  } catch {
    return { error: "Não foi possível trocar a senha. Tente novamente." };
  }
}

function isValidIanaTimezone(value: string): boolean {
  try {
    // `Intl.DateTimeFormat` lança `RangeError` pra um nome de fuso que não
    // existe — mais confiável que uma regex (nomes IANA têm formatos
    // demais pra validar por padrão de string).
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * Chamado uma vez por sessão pelo navegador (ver `useCaptureTimezone` em
 * `src/components/header`) informando o fuso IANA de verdade do usuário —
 * nunca calculado no servidor (ver comentário da coluna `timezone` em
 * `src/db/schema.ts`, e o porquê em `src/lib/google-calendar.ts`).
 * Silencioso de propósito (sem toast/erro visível): é uma sincronização
 * de bastidor, não uma ação que o usuário pediu.
 */
export async function saveUserTimezoneAction(timezone: string): Promise<void> {
  if (typeof timezone !== "string" || !isValidIanaTimezone(timezone)) return;

  try {
    const userId = await requireUserId();

    await db
      .insert(userPreferences)
      .values({ userId, timezone })
      .onConflictDoUpdate({ target: userPreferences.userId, set: { timezone } });
  } catch {
    // Nunca deve quebrar a navegação por causa disso — na pior hipótese,
    // a sincronização com o Google Agenda continua usando o fuso do
    // servidor até a próxima tentativa (ver `getUserTimezone`).
  }
}
