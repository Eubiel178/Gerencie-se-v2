import "server-only";

import postgres, { type Sql } from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

/**
 * Cliente de banco único para toda a aplicação (Server Components, Server
 * Actions e rotas de API). `postgres` (postgres-js) é o driver recomendado
 * pelo Drizzle para Postgres em ambiente Node — sem binários nativos, com
 * pool de conexões embutido.
 *
 * Em desenvolvimento, o Next.js recarrega módulos a cada mudança; guardamos
 * a instância em `globalThis` para não abrir um novo pool a cada hot-reload.
 */
declare global {
  var __postgres__: Sql | undefined;
}

// `postgres()` não conecta na hora de ser chamado — a conexão TCP só é
// aberta na primeira query de verdade. Por isso não validamos aqui: sem
// isso, o Next.js quebraria o build ao coletar dados de rota (que importa
// este módulo, mesmo sem nunca rodar uma query) em qualquer ambiente sem
// DATABASE_URL configurada ainda. Se a variável estiver ausente/errada, o
// erro aparece de forma natural na primeira query, com uma mensagem clara
// do próprio driver.
const databaseUrl = process.env.DATABASE_URL ?? "";

const client = globalThis.__postgres__ ?? postgres(databaseUrl);

if (process.env.NODE_ENV !== "production") {
  globalThis.__postgres__ = client;
}

export const db = drizzle(client, { schema });
