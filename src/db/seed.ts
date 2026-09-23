/**
 * Popula o banco com um usuário de demonstração, para facilitar testar o
 * app localmente sem precisar cadastrar uma conta manualmente.
 *
 * Uso: `npm run db:seed`
 *
 * Idempotente: pode ser rodado mais de uma vez sem duplicar o usuário
 * de demonstração (upsert por e-mail).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const DEMO_EMAIL = "demo@gerencie-se.local";
const DEMO_PASSWORD = "demo1234";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL não configurada — defina-a no .env antes de rodar o seed.");
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client, { schema });

  const [existingUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, DEMO_EMAIL))
    .limit(1);

  const userId = existingUser?.id ?? crypto.randomUUID();

  if (!existingUser) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    await db.insert(schema.users).values({
      id: userId,
      name: "Usuário de demonstração",
      email: DEMO_EMAIL,
      passwordHash,
    });

    console.log(`Usuário de demonstração criado: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  } else {
    console.log(`Usuário de demonstração já existia: ${DEMO_EMAIL}`);
  }

  await client.end();
}

main().catch((error) => {
  console.error("Falha ao popular o banco:", error);
  process.exit(1);
});
