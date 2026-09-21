import { IEvent } from "@/features/events/domain";

/**
 * "Próximos eventos" deve mostrar só o que ainda não passou, em ordem
 * cronológica — `loadAll()` traz TODOS os eventos (passado e futuro,
 * sem ordenação), porque o Calendário (FullCalendar) precisa dos dois.
 * Um evento sem `end` conta como "passado" pelo próprio `start`; um
 * evento COM `end` continua "próximo" enquanto não tiver terminado,
 * mesmo que já tenha começado (ex.: reunião em andamento).
 */
export function selectUpcomingEvents(events: IEvent[], now: Date = new Date()): IEvent[] {
  return events
    .filter((event) => new Date(event.end ?? event.start) >= now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}
