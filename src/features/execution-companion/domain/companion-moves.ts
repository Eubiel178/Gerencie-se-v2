import type { CompanionFact } from "./companion-phrasing";

/**
 * Repertório PEQUENO e de propósito do Companion — cada "situação" real
 * (`CompanionFact`) mapeia pra um CONJUNTO de movimentos candidatos
 * (nunca um só, fixo), e o movimento realmente usado é escolhido depois
 * (determinístico por padrão; pela IA quando há espaço real de variação
 * — ver `resolveCompanionMessageAction`). Isso é o que separa "eventos
 * viram sempre a mesma frase" de "o mesmo evento pode soar como um
 * comentário, uma comemoração ou uma oferta de ajuda, dependendo de
 * quem é o Companion agora".
 *
 * De propósito só 8 movimentos - o suficiente pra diferenças de
 * comportamento genuínas, não uma entrada por nuance de tom (humor, por
 * exemplo, é uma FLAG sobre o movimento escolhido — `humorEligible` no
 * perfil de personalidade —, não um movimento à parte).
 */
export type CompanionMove =
  | "iniciar" // abre uma interação nova (saudação, começo de tarefa)
  | "observar" // comenta o que está acontecendo, sem pedir nada
  | "reconhecer" // nota neutra sobre algo (retomada, reabertura, troca) sem julgamento
  | "comemorar" // reconhece conclusão/marco com energia positiva
  | "oferecer-ajuda" // oferece ajuda concreta — carrega ação (aceitar/recusar)
  | "sugerir" // propõe uma pequena ação opcional — carrega ação (aceitar/recusar)
  | "perguntar" // pergunta algo que precisa resposta — carrega ação (confirmar/recusar)
  | "dar-espaco"; // recua ativamente, com poucas palavras

export const ALL_COMPANION_MOVES: readonly CompanionMove[] = [
  "iniciar",
  "observar",
  "reconhecer",
  "comemorar",
  "oferecer-ajuda",
  "sugerir",
  "perguntar",
  "dar-espaco",
];

export function isCompanionMove(value: unknown): value is CompanionMove {
  return typeof value === "string" && (ALL_COMPANION_MOVES as string[]).includes(value);
}

/**
 * Movimentos candidatos por SITUAÇÃO, em ordem de preferência padrão
 * (usada como critério de desempate determinístico — primeiro da lista
 * que sobreviver aos filtros de personalidade/limite/cota vence quando
 * a IA não decide). Isto é 100% determinístico e nunca muda em tempo de
 * execução — é o "teto" de possibilidades que a IA (quando elegível)
 * pode escolher dentro, nunca além.
 */
export const SITUATION_ELIGIBLE_MOVES: Record<CompanionFact["kind"], CompanionMove[]> = {
  "presence-greeting": ["iniciar", "observar"],
  "execution-started": ["iniciar", "observar"],
  "execution-completed": ["comemorar", "reconhecer"],
  "execution-idle-nudge": ["observar", "oferecer-ajuda"],
  "return-after-absence": ["reconhecer", "observar"],
  "long-session": ["observar", "oferecer-ajuda"],
  "deadline-approaching": ["observar", "oferecer-ajuda"],
  "overdue-task": ["reconhecer", "oferecer-ajuda"],
  "progress-milestone": ["comemorar", "reconhecer"],
  "reopened-task": ["reconhecer"],
  "task-switching": ["observar", "sugerir"],
  "repeated-reopen": ["oferecer-ajuda", "sugerir"],
  "quiet-win": ["comemorar", "reconhecer"],
  "ask-quiet-check": ["perguntar"],
};

/** Durante um limite de espaço ativo (`quietUntil`), eventos MEANINGFUL
 * ainda podem se manifestar (um prazo vencido continua importante), mas
 * só nos movimentos mais discretos - nunca oferecer ajuda/sugerir/
 * perguntar/iniciar, que pedem mais atenção de quem só pediu silêncio. */
export const QUIET_SAFE_MOVES: readonly CompanionMove[] = ["observar", "reconhecer", "comemorar", "dar-espaco"];

/** Situações onde humor NUNCA é apropriado, mesmo que a personalidade
 * goste de brincar — atraso e reabertura repetida já carregam uma
 * dificuldade real, uma pergunta sobre limite pessoal precisa ser
 * tomada a sério. Aplicado POR CIMA de `PersonalityBehaviorProfile.
 * humorEligible` (a interseção das duas é que decide, nunca uma sozinha). */
export const NEVER_HUMOR_SITUATIONS: ReadonlyArray<CompanionFact["kind"]> = [
  "overdue-task",
  "reopened-task",
  "repeated-reopen",
  "ask-quiet-check",
];

export interface CompanionActionOption {
  id: string;
  kind: "accept" | "decline" | "confirm";
  label: string;
}

/** Rótulos por personalidade+kind — DETERMINÍSTICOS de propósito (nunca
 * gerados pela IA): um botão de decisão precisa ser sempre confiável e
 * previsível, diferente do texto livre do balão. Pequena variação de
 * voz por personalidade já evita "sempre os 3 mesmos botões", sem abrir
 * mão de segurança nessa superfície. */
const ACTION_LABELS: Record<"afetuoso" | "sarcastico" | "engracado" | "motivador" | "zen", Record<CompanionActionOption["kind"], string>> = {
  afetuoso: { accept: "Me ajuda", decline: "Consigo sozinho", confirm: "Pode sim", },
  sarcastico: { accept: "Vai, me ajuda", decline: "Deixa que eu resolvo", confirm: "Pode", },
  engracado: { accept: "Bora, me ajuda", decline: "Hoje não, chefe", confirm: "Fechado", },
  motivador: { accept: "Me ajuda a avançar", decline: "Sigo sozinho", confirm: "Bora", },
  zen: { accept: "Aceito uma mão", decline: "Prefiro sozinho", confirm: "Pode ser", },
};

const DECLINE_ONLY_LABEL: Record<"afetuoso" | "sarcastico" | "engracado" | "motivador" | "zen", string> = {
  afetuoso: "Agora não",
  sarcastico: "Não precisa",
  engracado: "Deixa quieto",
  motivador: "Agora não",
  zen: "Não, obrigado",
};

/** Quais movimentos carregam ações rápidas — e de que tipo. Movimentos
 * de comentário puro (`observar`/`reconhecer`/`comemorar`/`iniciar`/
 * `dar-espaco`) nunca ganham botão: forçar uma decisão numa frase que
 * só está reconhecendo algo transformaria o balão de volta numa barra
 * de ferramentas (pedido explícito: "não colocar botão em toda
 * mensagem"). */
export function getActionsForMove(
  move: CompanionMove,
  personality: "afetuoso" | "sarcastico" | "engracado" | "motivador" | "zen"
): CompanionActionOption[] {
  const labels = ACTION_LABELS[personality];

  switch (move) {
    case "oferecer-ajuda":
      return [
        { id: "accept-help", kind: "accept", label: labels.accept },
        { id: "decline-help", kind: "decline", label: DECLINE_ONLY_LABEL[personality] },
      ];
    case "sugerir":
      return [
        { id: "accept-suggestion", kind: "accept", label: labels.accept },
        { id: "decline-suggestion", kind: "decline", label: DECLINE_ONLY_LABEL[personality] },
      ];
    case "perguntar":
      return [
        { id: "confirm-quiet", kind: "confirm", label: labels.confirm },
        { id: "decline-quiet", kind: "decline", label: DECLINE_ONLY_LABEL[personality] },
      ];
    default:
      return [];
  }
}
