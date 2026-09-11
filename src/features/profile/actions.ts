"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users, userPreferences } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";
import { validationSchema } from "@/validation/profile-schema";

type ActionResult = { error: string | null };

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
