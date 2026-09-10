import "server-only";

import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

/**
 * Cliente de banco único para toda a aplicação (Server Components, Server
 * Actions e rotas de API). `@libsql/client` fala o protocolo SQLite nativo
 * (arquivo local, sem servidor) e, ao contrário do `better-sqlite3` que
 * usávamos antes, publica binários pré-compilados para Windows/macOS/Linux
 * — não exige node-gyp/Python instalados na máquina de quem for rodar o
 * projeto.
 *
 * Em desenvolvimento, o Next.js recarrega módulos a cada mudança; guardamos
 * a instância em `globalThis` para não abrir um novo arquivo de banco a
 * cada hot-reload.
 */
declare global {
  var __libsql__: Client | undefined;
}

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

const client = globalThis.__libsql__ ?? createClient({ url: databaseUrl });

if (process.env.NODE_ENV !== "production") {
  globalThis.__libsql__ = client;
}

// Não usamos top-level await aqui de propósito (evita depender de suporte a
// ESM assíncrono no bundler do Next). O client mantém uma única conexão e
// processa comandos em ordem de chamada, então este PRAGMA sempre roda antes
// de qualquer query feita depois da primeira importação deste módulo.
client.execute("PRAGMA foreign_keys = ON").catch((error) => {
  console.error("Falha ao configurar PRAGMA foreign_keys:", error);
});

export const db = drizzle(client, { schema });
