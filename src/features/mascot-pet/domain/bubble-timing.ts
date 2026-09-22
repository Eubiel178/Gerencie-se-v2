// Duração de exibição do balão de fala, calculada a partir do tamanho do
// texto em vez de um timeout fixo minúsculo — uma mensagem de uma linha
// não pode durar o mesmo tanto que uma de duas frases, senão ou some
// rápido demais pra ler ou fica grudada tempo demais na tela.
const BASE_MS = 1500;
const MS_PER_CHAR = 55;
const MIN_DISPLAY_MS = 4000;
const MAX_DISPLAY_MS = 12000;

// Interações com uma decisão real (botões) e eventos meaningful pedem
// mais tempo de leitura — não porque o TEXTO seja maior, mas porque há
// mais coisa acontecendo na tela (ler + decidir, ou só "isso importa
// mais"). Somado ao cálculo por tamanho, nunca o substitui.
const HAS_ACTIONS_EXTRA_MS = 5000;
const MEANINGFUL_EXTRA_MS = 2000;
// Teto mais alto quando há uma decisão pendente — nunca vale a pena um
// botão sumir antes de alguém conseguir clicar nele.
const MAX_DISPLAY_WITH_ACTIONS_MS = 20000;

export interface BubbleTimingOptions {
  hasActions?: boolean;
  priority?: "meaningful" | "casual";
}

export function computeBubbleDisplayMs(text: string, options: BubbleTimingOptions = {}): number {
  const estimated = BASE_MS + text.length * MS_PER_CHAR;
  let withExtras = estimated;
  if (options.hasActions) withExtras += HAS_ACTIONS_EXTRA_MS;
  if (options.priority === "meaningful") withExtras += MEANINGFUL_EXTRA_MS;

  const ceiling = options.hasActions ? MAX_DISPLAY_WITH_ACTIONS_MS : MAX_DISPLAY_MS;
  return Math.min(ceiling, Math.max(MIN_DISPLAY_MS, withExtras));
}
