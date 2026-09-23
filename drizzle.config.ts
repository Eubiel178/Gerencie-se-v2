import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Placeholder só para o `drizzle-kit generate` (que não precisa de
    // conexão real) não quebrar sem DATABASE_URL definida. `db:migrate`
    // precisa de uma URL real de verdade.
    url: process.env.DATABASE_URL ?? "postgres://user:password@localhost:5432/gerencie_se",
  },
} satisfies Config;
