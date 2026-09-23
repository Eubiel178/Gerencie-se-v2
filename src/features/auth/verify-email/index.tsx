import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";


import { db } from "@/db/client";
import { users } from "@/db/schema";
import { requireUserId } from "@/lib/auth";
import { isEmailVerified } from "@/lib/email";

import styles from "../auth-page.module.css";
import { Figure, Main } from "../components";

import { Auth } from "./components";

interface VerifyEmailProps {
  deliveryFailed?: boolean;
  resumed?: boolean;
}

export async function VerifyEmail({ deliveryFailed = false, resumed = false }: VerifyEmailProps) {
  const userId = await requireUserId();

  // Quem já verificou (ou nunca precisou, como Google) não tem nada a
  // fazer aqui — bookmark antigo, botão "voltar" do navegador, etc.
  if (await isEmailVerified(userId)) {
    redirect("/home");
  }

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return (
    <div className={styles.authPage}>
      <Figure />

      <Main>
        <Auth email={user?.email ?? null} deliveryFailed={deliveryFailed} resumed={resumed} />
      </Main>
    </div>
  );
}
