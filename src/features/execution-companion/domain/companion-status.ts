/**
 * O que aparece quando a pessoa CLICA no mascote (sem arrastar) - uma
 * combinação pequena e determinística de sinais REAIS já disponíveis no
 * Companion, nunca dados inventados nem uma pergunta nova pra IA a cada
 * clique (ver comentário completo em `companion-status-phrasing.ts` pro
 * porquê disso ser puro/determinístico de propósito).
 *
 * "Continuidade" nasce de graça aqui: como cada categoria só muda quando
 * algo REAL aconteceu (uma ajuda foi aceita/recusada, uma comemoração
 * rolou, o limite de espaço foi pedido), cliques repetidos sem nenhum
 * evento no meio SEMPRE devolvem a mesma categoria - nunca uma resposta
 * nova por acaso.
 */
export type CompanionStatusCategory =
  | "quiet" // limite de espaço ativo agora - clicar ainda funciona, mas reconhece o pedido
  | "declined-recently" // uma oferta de ajuda/sugestão foi recusada há pouco
  | "accepted-recently" // uma oferta de ajuda foi aceita há pouco
  | "celebrated-recently" // uma comemoração real aconteceu há pouco
  | "active-task" // há uma tarefa em andamento agora, sem nada mais notável
  | "calm"; // nada notável - resposta honesta e comum, não uma falha

export interface CompanionStatusSnapshot {
  category: CompanionStatusCategory;
  taskTitle: string | null;
}

export interface CompanionStatusInput {
  isQuiet: boolean;
  declinedRecently: boolean;
  acceptedRecently: { taskTitle: string | null } | null;
  recentCelebration: { taskTitle: string | null } | null;
  activeTask: { title: string } | null;
}

/** Ordem de prioridade é o produto de uma decisão de UX, não um detalhe -
 * um pedido de espaço recente ou uma recusa merecem ser reconhecidos
 * antes de qualquer "olha a tarefa ativa", senão o clique pareceria
 * ignorar o que acabou de acontecer entre vocês dois. */
export function computeCompanionStatus(input: CompanionStatusInput): CompanionStatusSnapshot {
  if (input.isQuiet) return { category: "quiet", taskTitle: null };
  if (input.declinedRecently) return { category: "declined-recently", taskTitle: null };
  if (input.acceptedRecently) return { category: "accepted-recently", taskTitle: input.acceptedRecently.taskTitle };
  if (input.recentCelebration) return { category: "celebrated-recently", taskTitle: input.recentCelebration.taskTitle };
  if (input.activeTask) return { category: "active-task", taskTitle: input.activeTask.title };
  return { category: "calm", taskTitle: null };
}
