-- Thalita passa a ser a voz padrão do app. Quem ainda não escolheu outra
-- voz está com o default antigo (`pt-BR-FranciscaNeural`) gravado na linha
-- — o default novo da coluna (0052) só vale pra registros futuros, então
-- reescreve aqui os existentes. Escolhas EXPLÍCITAS diferentes (Thalita
-- multilíngue, Antônio) não são tocadas.
UPDATE "user_preference"
SET "assistant_voice_id" = 'pt-BR-ThalitaNeural'
WHERE "assistant_voice_id" = 'pt-BR-FranciscaNeural';