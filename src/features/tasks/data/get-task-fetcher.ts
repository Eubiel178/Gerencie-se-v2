import "server-only";

import { LocalTask } from "@/features/tasks/data";

// Não é um React Hook (apesar do nome do arquivo) — é a única factory do
// repositório de tarefas, usada tanto pelo Server Component `Home` quanto
// pelas Server Actions em `actions.ts` (antes havia uma segunda cópia
// dessa mesma factory ali, removida — uma única fonte de verdade para
// "como obter um LocalTask"). Só pode ser usada no servidor — `LocalTask`
// depende do driver `postgres`. Client Components chamam as Server Actions
// em vez disso.
export function getTaskFetcher() {
  return new LocalTask();
}
