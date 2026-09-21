"use client";

import { useEffect } from "react";

import { EmptyState } from "@/components";
import { IEvent } from "@/features/events/domain";
import { useEventStore } from "@/features/events/event-store";
import styles from "@/styles/workspace.module.css";

import { Card } from "./card";
import { selectUpcomingEvents } from "./select-upcoming-events";

export function EventList({ eventsList }: { eventsList: IEvent[] }) {
  const events = useEventStore((state) => state.events);
  const setEvents = useEventStore((state) => state.setEvents);

  // `setEvents` é do Zustand (store externa) — sincroniza em efeito, não
  // ajustando estado durante a própria renderização (esse último padrão
  // é seguro só pra `useState` local, como em `RoutineList`/`HabitsList`;
  // aplicado a uma store externa ele pode tentar atualizar outro
  // componente Zustand-subscrito enquanto ainda renderiza — confirmado
  // quebrando a criação de tarefa quando o mesmo padrão foi usado em
  // `TasksList`). O `useEffect` já só reroda quando `eventsList` muda de
  // referência de verdade, então não precisa de guarda nenhuma além disso.
  useEffect(() => {
    setEvents(eventsList);
  }, [eventsList, setEvents]);

  // `events` (da store) tem TODOS os eventos — o Calendário ao lado
  // precisa deles assim. Esta lista, rotulada "Próximos eventos", mostra
  // só os que ainda não passaram, em ordem cronológica.
  const upcomingEvents = selectUpcomingEvents(events);
  const thereAreEvents = upcomingEvents.length > 0;

  return (
    <>
      {thereAreEvents ? (
        <ul className={styles.eventList}>
          {upcomingEvents.map((event) => (
            <Card {...event} key={event.id} />
          ))}
        </ul>
      ) : (
        <EmptyState>
          Nenhum compromisso por aqui ainda. Adicione um evento para reservar esse tempo no seu dia.
        </EmptyState>
      )}
    </>
  );
}
