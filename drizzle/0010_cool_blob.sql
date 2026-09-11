-- Remapeia valores antigos de espécie (mascote CSS/3D abandonados) para
-- os novos animais de fazenda, antes de mudar o default — nenhuma linha
-- existente deve ficar com uma espécie sem sprite correspondente.
UPDATE "mascot_state" SET "species" = 'galinha' WHERE "species" = 'blob';--> statement-breakpoint
UPDATE "mascot_state" SET "species" = 'vaca' WHERE "species" = 'gato';--> statement-breakpoint
UPDATE "mascot_state" SET "species" = 'porco' WHERE "species" = 'cachorro';--> statement-breakpoint
ALTER TABLE "mascot_state" ALTER COLUMN "species" SET DEFAULT 'galinha';--> statement-breakpoint
ALTER TABLE "mascot_state" DROP COLUMN "render_mode";