/**
 * Popula o banco com um usuário de demonstração e as tarefas/eventos de
 * exemplo que existiam em `src/@fakeapi/db.json` (json-server), para que a
 * base de exemplo não se perca na migração para o SQLite/Drizzle.
 *
 * Uso: `npm run db:seed`
 *
 * Idempotente: pode ser rodado mais de uma vez sem duplicar o usuário
 * de demonstração (upsert por e-mail) — tarefas/eventos de exemplo só são
 * inseridos na primeira vez (se o usuário demo ainda não tiver nenhum).
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";
import fakeDb from "../@fakeapi/db.json";

const DEMO_EMAIL = "demo@gerencie-se.local";
const DEMO_PASSWORD = "demo1234";

async function main() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  const client = createClient({ url: databaseUrl });
  await client.execute("PRAGMA foreign_keys = ON");
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

  const [existingTask] = await db
    .select({ id: schema.tasks.id })
    .from(schema.tasks)
    .where(eq(schema.tasks.userId, userId))
    .limit(1);

  if (!existingTask) {
    const tasks = (fakeDb.tasks ?? []) as Array<{
      tag: string;
      title: string;
      description: string;
    }>;

    for (const task of tasks) {
      await db.insert(schema.tasks).values({
        id: crypto.randomUUID(),
        userId,
        tag: task.tag,
        title: task.title,
        description: task.description,
      });
    }

    console.log(`${tasks.length} tarefa(s) de exemplo inserida(s).`);
  } else {
    console.log("Usuário demo já tem tarefas — nada a inserir.");
  }

  const [existingEvent] = await db
    .select({ id: schema.events.id })
    .from(schema.events)
    .where(eq(schema.events.userId, userId))
    .limit(1);

  if (!existingEvent) {
    const events = (fakeDb.events ?? []) as Array<{
      title: string;
      description: string;
      start: string;
      end?: string;
      url?: string;
      backgroundColor?: string;
    }>;

    for (const event of events) {
      await db.insert(schema.events).values({
        id: crypto.randomUUID(),
        userId,
        title: event.title,
        description: event.description,
        start: event.start,
        end: event.end || null,
        url: event.url || null,
        backgroundColor: event.backgroundColor || null,
      });
    }

    console.log(`${events.length} evento(s) de exemplo inserido(s).`);
  } else {
    console.log("Usuário demo já tem eventos — nada a inserir.");
  }

  client.close();
}

main().catch((error) => {
  console.error("Falha ao popular o banco:", error);
  process.exit(1);
});
