import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  // "turso" é o dialeto do drizzle-kit para bancos falados via libSQL —
  // usamos o mesmo aqui mesmo sendo um arquivo local (sem servidor Turso),
  // porque é o dialeto que faz o drizzle-kit usar @libsql/client por baixo
  // (o mesmo driver do runtime da aplicação) em vez do better-sqlite3.
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  },
} satisfies Config;
