import "server-only";

import { LocalEvent } from "@/features/events/data";

// Não é um React Hook (apesar do nome do arquivo) — é a única factory do
// repositório de eventos, usada tanto pelo Server Component `Event` quanto
// pelas Server Actions em `actions.ts` (antes havia uma segunda cópia
// dessa mesma factory ali, removida — uma única fonte de verdade para
// "como obter um LocalEvent"). Só pode ser usada no servidor — `LocalEvent`
// depende do driver `postgres`. Client Components chamam as Server Actions
// em vez disso.
export function getEventFetcher() {
  return new LocalEvent();
}
