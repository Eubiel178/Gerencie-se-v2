import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

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

// Na Vercel cada invocação pode rodar numa instância de function isolada;
// sob carga, a plataforma escala para várias instâncias concorrentes, cada
// uma com o seu próprio pool. Com o `max` padrão do driver (10), muitas
// instâncias concorrentes somadas podem estourar o limite de conexões do
// Postgres hospedado (planos gratuitos costumam permitir bem menos que
// isso). `max: 1` mantém cada instância enxuta; combine com uma connection
// string com pooler (ex. Neon/Supabase em modo "pooled") para produção —
// ver `docs/DEPLOY.md`. Fora da Vercel (dev local), mantém o padrão do
// driver, que já é adequado para um único processo de longa duração.
const client = globalThis.__postgres__ ?? postgres(databaseUrl, process.env.VERCEL ? { max: 1 } : undefined);

if (process.env.NODE_ENV !== "production") {
  globalThis.__postgres__ = client;
}

export const db = drizzle(client, { schema });
