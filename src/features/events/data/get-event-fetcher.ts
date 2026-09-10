import "server-only";

import { LocalEvent } from "@/features/events/data";

// Não é um React Hook (apesar do nome do arquivo) — é só uma factory que
// devolve a implementação local do repositório de eventos, segura de
// chamar em qualquer função síncrona ou assíncrona. Só pode ser usado em
// Server Components (ex.: `Event`) ou dentro de Server Actions — `LocalEvent`
// depende do driver `postgres`. Client Components chamam as Server Actions em
// `src/features/events/actions.ts` em vez disso.
export function getEventFetcher() {
  return { fetcher: new LocalEvent() };
}
