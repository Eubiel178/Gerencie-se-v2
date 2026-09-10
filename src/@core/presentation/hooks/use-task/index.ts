import "server-only";

import { LocalTask } from "@/@core/data";

// Não é um React Hook (apesar do nome do arquivo) — é só uma factory que
// devolve a implementação local do repositório de tarefas, segura de
// chamar em qualquer função síncrona ou assíncrona. Só pode ser usado em
// Server Components (ex.: `Home`) ou dentro de Server Actions — `LocalTask`
// depende de `@libsql/client`. Client Components chamam as Server Actions em
// `src/features/tasks/actions.ts` em vez disso.
export function getTaskFetcher() {
  return { fetcher: new LocalTask() };
}
