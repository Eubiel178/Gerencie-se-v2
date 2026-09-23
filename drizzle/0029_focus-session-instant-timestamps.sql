-- Antes desta migration, postgres-js enviava `Date` como `timestamptz`,
-- enquanto as colunas eram `timestamp` sem fuso. O Postgres convertia o
-- instante para o fuso da sessão e perdia essa informação ao salvar. Como o
-- app não executa `SET TIME ZONE`, o fuso padrão atual do banco é exatamente
-- o que foi usado na gravação histórica. Reinterpretar cada relógio nesse
-- mesmo fuso preserva o instante original na conversão para `timestamptz`.
ALTER TABLE "focus_session"
  ALTER COLUMN "started_at" TYPE timestamp with time zone
  USING "started_at" AT TIME ZONE current_setting('TimeZone');--> statement-breakpoint
ALTER TABLE "focus_session"
  ALTER COLUMN "ended_at" TYPE timestamp with time zone
  USING "ended_at" AT TIME ZONE current_setting('TimeZone');
