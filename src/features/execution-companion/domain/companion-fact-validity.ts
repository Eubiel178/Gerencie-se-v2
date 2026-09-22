import type { ITask } from "@/features/tasks/domain";

import type { CompanionFact } from "./companion-phrasing";

/**
 * Revalida um fato ANTES de mostrá-lo — cobre a janela entre "decidimos
 * que vale a pena comentar isso" e "o balão realmente apareceu na tela"
 * (chamada de rede pra IA, aba escondida, fila de espera). Se o estado
 * real mudou nesse meio-tempo (a tarefa foi concluída, reaberta,
 * apagada), o fato original pode ter deixado de fazer sentido - mostrar
 * mesmo assim seria o Companion "mentindo" sobre o presente.
 *
 * `task` é o resultado de procurar a tarefa PELO MESMO id que gerou o
 * fato (nunca "a tarefa ativa agora") - `null` = ela não existe mais
 * (apagada) nesta checagem.
 */
export function isFactStillValid(fact: CompanionFact, task: ITask | null): boolean {
  switch (fact.kind) {
    case "ask-quiet-check":
      // Não é sobre nenhuma tarefa - nada pra ficar velho.
      return true;

    case "presence-greeting":
      // Sem tarefa citada, sempre válido; citando uma, só se ela
      // continuar em andamento.
      return fact.taskTitle === null || (task !== null && !task.completed);

    case "execution-started":
    case "execution-idle-nudge":
    case "return-after-absence":
    case "long-session":
    case "deadline-approaching":
    case "overdue-task":
    case "task-switching":
      // Situações sobre uma tarefa EM ANDAMENTO - deixam de fazer
      // sentido se ela sumiu ou já foi concluída nesse meio-tempo.
      return task !== null && !task.completed;

    case "execution-completed":
    case "quiet-win":
      // Sobre uma CONCLUSÃO real - deixa de fazer sentido se a tarefa
      // foi reaberta antes do balão aparecer.
      return task !== null && task.completed;

    case "reopened-task":
    case "repeated-reopen":
      // Sobre uma REABERTURA - deixa de fazer sentido se a pessoa já
      // concluiu de novo antes do balão aparecer.
      return task !== null && !task.completed;

    case "progress-milestone":
      // Progresso é um instantâneo do passado (aconteceu, é fato) -
      // continua verdadeiro mesmo que o estado atual tenha mudado desde
      // então; só invalida se a tarefa em si sumiu.
      return task !== null;
  }
}
