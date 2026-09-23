-- Espécies removidas (coelho/galinha nunca tiveram um personagem no
-- mascote que anda pela tela) — usuários que tinham uma delas caem pro
-- padrão em vez de ficar com um valor que o app não reconhece mais.
UPDATE "mascot_state" SET "species" = 'gato' WHERE "species" NOT IN ('gato', 'cachorro');--> statement-breakpoint
ALTER TABLE "mascot_state" ALTER COLUMN "species" SET DEFAULT 'gato';--> statement-breakpoint
ALTER TABLE "mascot_state" DROP COLUMN "breed";