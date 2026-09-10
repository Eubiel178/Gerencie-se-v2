"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { signIn } from "@/lib/auth";
import { validationSchema as loginSchema } from "@/validation/login-schema";
import { validationSchema as registerSchema } from "@/validation/register-schema";

export type AuthActionState = {
  error: string | null;
};

const GENERIC_LOGIN_ERROR = "E-mail ou senha inválidos.";

export async function loginAction(
  data: unknown
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(data);

  if (!parsed.success) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/home",
    });

    return { error: null };
  } catch (error) {
    // `signIn` usa um redirect interno do Next.js para navegar em caso de
    // sucesso — isso chega aqui como um erro especial que precisa
    // continuar subindo, nunca ser tratado como falha de login.
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }

    if (error instanceof AuthError) {
      return { error: GENERIC_LOGIN_ERROR };
    }

    return {
      error: "Não foi possível entrar agora. Tente novamente.",
    };
  }
}

export async function registerAction(
  data: unknown
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "Verifique os dados informados." };
  }

  const { name, email, password } = parsed.data;

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return {
      error:
        "Já existe uma conta com este e-mail. Tente entrar, ou use \"Continuar com Google\" se foi assim que você se cadastrou.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({ name, email, passwordHash });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/home",
    });

    return { error: null };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }

    // A conta já foi criada; se o login automático falhar por algum motivo
    // inesperado, mandamos para o login manual em vez de perder o cadastro.
    redirect("/login");
  }
}
