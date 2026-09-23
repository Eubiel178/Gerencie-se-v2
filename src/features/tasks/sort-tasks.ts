import { ITask } from "./domain";

const PRIORITY_RANK: Record<ITask["priority"], number> = {
  critica: 3,
  alta: 2,
  media: 1,
  baixa: 0,
};

/** Mais prioritárias primeiro. `.sort()` é estável (garantido pela spec
 * do JS desde ES2019), então tarefas empatadas em prioridade mantêm a
 * ordem em que já vieram — não embaralha à toa quem já estava lado a
 * lado. */
export function sortTasksByPriority<T extends Pick<ITask, "priority">>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]);
}
