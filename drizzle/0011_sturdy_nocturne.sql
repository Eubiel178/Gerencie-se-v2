ALTER TABLE "mascot_state" ADD COLUMN "breed" text DEFAULT 'preta' NOT NULL;--> statement-breakpoint
-- Remapeia espécies antigas (mascote de fazenda abandonado) para as
-- novas (bichos de estimação) e ajusta a raça de cada uma pra uma
-- combinação válida — só "galinha" mantém o default 'preta' já
-- aplicado acima.
UPDATE "mascot_state" SET "species" = 'cachorro', "breed" = 'vira-lata' WHERE "species" = 'vaca';--> statement-breakpoint
UPDATE "mascot_state" SET "species" = 'coelho', "breed" = 'comum' WHERE "species" = 'porco';--> statement-breakpoint
UPDATE "mascot_state" SET "species" = 'gato', "breed" = 'cinza' WHERE "species" = 'cabra';