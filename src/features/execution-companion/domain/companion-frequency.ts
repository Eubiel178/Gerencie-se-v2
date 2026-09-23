/**
 * Controle de FREQUÊNCIA das falas espontâneas do Companion — substitui
 * a cota diária por contagem (achado real: um teto de 12 "meaningful" +
 * 4 "casual" era atingido no MEIO de um dia de uso real, calando o
 * Companion pelo resto do dia - o oposto de "presença contínua").
 *
 * Valores iniciais CONSERVADORES e centralizados aqui de propósito - o
 * pedido explícito foi "não definir números arbitrários sem poder
 * ajustar depois com facilidade". Mexer só nestes números, nunca
 * espalhar cópias em outro lugar.
 */
export const COMPANION_FREQUENCY = {
  /** Depois de uma fala MEANINGFUL, quanto tempo até a próxima
   * (qualquer prioridade) ser considerada "não cansativa" - curto de
   * propósito, eventos importantes não deveriam esperar muito, mas um
   * evento importante bem em cima do anterior ainda pode ser silencioso
   * (pedido explícito: "meaningful" não significa "sempre falar"). */
  MEANINGFUL_MIN_GAP_MS: 3 * 60 * 1000,
  /** Intervalo mínimo pra uma fala CASUAL (saudação, sessão longa,
   * troca de tarefa) - bem maior, casual é o que mais cansa se repetir. */
  CASUAL_MIN_GAP_MS: 12 * 60 * 1000,
  /** Mesmo intervalo casual, mas quando o usuário está engajado
   * conversando no chat do Widget - o Companion já está dando atenção
   * por outro canal, uma interrupção espontânea a mais na página de
   * Tarefas tem menos motivo pra existir. */
  CASUAL_MIN_GAP_WHILE_ENGAGED_MS: 25 * 60 * 1000,
  /** Freio de emergência (não o mecanismo principal) - teto de falas por
   * dia alto o bastante pra um uso real, mesmo pesado, nunca esbarrar
   * nele; existe só pra pegar um bug de loop disparando repetidamente. */
  ABUSE_GUARD_DAILY_MAX: 60,
} as const;

export interface CompanionFrequencyParams {
  priority: "meaningful" | "casual";
  /** Situações raras/urgentes o bastante (conclusão de tarefa, prazo
   * vencido, vitória silenciosa) pra ignorar o intervalo mínimo normal -
   * ver `frequencyBypass` em `companion-interaction-config.ts`. O gate
   * por-evento (nunca repetir o MESMO evento, ver `use-tasks-companion.ts`)
   * já garante que isto é sempre uma ocorrência nova de verdade, nunca
   * repetição - o bypass só afeta o intervalo desde a ÚLTIMA FALA, não
   * remove nenhuma outra proteção. */
  frequencyBypass: boolean;
  lastSpokeAt: Date | null;
  now: Date;
  isEngagedViaChat: boolean;
  /** `true` quando o freio de emergência (contagem diária) já foi
   * atingido hoje - ver `ABUSE_GUARD_DAILY_MAX`. */
  abuseGuardTriggered: boolean;
}

/**
 * Decide se já se passou tempo suficiente desde a última fala do
 * Companion pra esta nova interação não soar cansativa. Pura e
 * determinística - nunca chama IA, nunca lê banco (quem chama já leu
 * `lastSpokeAt`/`abuseGuardTriggered` antes).
 */
export function isCompanionFrequencyAllowed(params: CompanionFrequencyParams): boolean {
  if (!params.lastSpokeAt) return true;
  const elapsedMs = params.now.getTime() - params.lastSpokeAt.getTime();

  if (params.abuseGuardTriggered) {
    // Freio de emergência: ignora prioridade e bypass, exige o MAIOR
    // intervalo de todos - nunca bloqueia por completo (nunca "mudo pelo
    // resto do dia"), só torna a fala rara até a data virar.
    return elapsedMs >= COMPANION_FREQUENCY.CASUAL_MIN_GAP_WHILE_ENGAGED_MS;
  }

  if (params.frequencyBypass) return true;

  const minGap =
    params.priority === "meaningful"
      ? COMPANION_FREQUENCY.MEANINGFUL_MIN_GAP_MS
      : params.isEngagedViaChat
        ? COMPANION_FREQUENCY.CASUAL_MIN_GAP_WHILE_ENGAGED_MS
        : COMPANION_FREQUENCY.CASUAL_MIN_GAP_MS;

  return elapsedMs >= minGap;
}
