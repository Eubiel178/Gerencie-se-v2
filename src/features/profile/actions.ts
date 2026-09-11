"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";
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

    await db.update(users).set({ name: parsed.data.name }).where(eq(users.id, userId));

    revalidatePath("/home", "layout");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar. Tente novamente." };
  }
}
