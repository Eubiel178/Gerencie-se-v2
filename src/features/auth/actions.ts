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
    // `redirect: false` faz o `signIn` nunca redirecionar sozinho — nem em
    // caso de sucesso, nem de falha. Assim o catch abaixo só recebe erro de
    // credencial de verdade (nunca o redirect interno de sucesso disfarçado
    // de erro), e o redirect pro /home é sempre o nosso, explícito, depois
    // do try/catch.
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: GENERIC_LOGIN_ERROR };
    }

    return {
      error: "Não foi possível entrar agora. Tente novamente.",
    };
  }

  redirect("/home");
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
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    // A conta já foi criada; se o login automático falhar por algum motivo
    // inesperado, mandamos para o login manual em vez de perder o cadastro.
    redirect("/login");
  }

  redirect("/home");
}
