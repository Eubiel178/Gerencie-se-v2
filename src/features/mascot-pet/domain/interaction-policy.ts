/**
 * Regra de prioridade/substituição do Companion — domínio-agnóstica de
 * propósito (hoje só Tarefas usa isso, ver
 * `features/execution-companion/hooks/use-tasks-companion.ts`, mas a
 * mesma regra serve pra qualquer domínio futuro que decida "o mascote
 * tem algo a dizer agora"). Não sabe nada de tarefa, sessão de execução
 * ou personalidade — só resolve UMA pergunta: dado o que já está sendo
 * mostrado (se algo estiver), um candidato novo merece substituir?
 *
 * "meaningful" = aconteceu uma coisa real e rara (começou/terminou uma
 * tarefa, prazo perto) - sempre pode interromper. "casual" = presença/
 * ociosidade/bate-papo (cutucão, saudação, sessão longa) - só substitui
 * outro "casual", nunca atropela um "meaningful" ainda no ar.
 */
export type InteractionPriority = "meaningful" | "casual";

export interface CurrentInteraction {
  priority: InteractionPriority;
}

/** Verdadeiro se um candidato novo deve substituir o que já está sendo
 * mostrado (ou não há nada sendo mostrado). */
export function shouldReplaceInteraction(
  current: CurrentInteraction | null,
  candidatePriority: InteractionPriority
): boolean {
  if (!current) return true;
  if (candidatePriority === "meaningful") return true;
  return current.priority === "casual";
}
