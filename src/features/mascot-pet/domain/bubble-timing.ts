// Duração de exibição do balão de fala, calculada a partir do tamanho do
// texto em vez de um timeout fixo minúsculo — uma mensagem de uma linha
// não pode durar o mesmo tanto que uma de duas frases, senão ou some
// rápido demais pra ler ou fica grudada tempo demais na tela.
const BASE_MS = 1500;
const MS_PER_CHAR = 55;
const MIN_DISPLAY_MS = 4000;
const MAX_DISPLAY_MS = 12000;

export function computeBubbleDisplayMs(text: string): number {
  const estimated = BASE_MS + text.length * MS_PER_CHAR;
  return Math.min(MAX_DISPLAY_MS, Math.max(MIN_DISPLAY_MS, estimated));
}
