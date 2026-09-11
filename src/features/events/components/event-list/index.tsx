"use client";

import { useEffect } from "react";

import { Feedback } from "@/components";

import { Card } from "./card";

import { IEvent } from "@/features/events/domain";
import styles from "@/styles/workspace.module.css";
import { useEventStore } from "@/features/events/event-store";

export function EventList({ eventsList }: { eventsList: IEvent[] }) {
  const events = useEventStore((state) => state.events);
  const setEvents = useEventStore((state) => state.setEvents);

  useEffect(() => {
    setEvents(eventsList);
  }, [eventsList, setEvents]);

  const thereAreEvents = events.length > 0;

  return (
    <>
      {thereAreEvents ? (
        <ul className={styles.eventList}>
          {events.map((event) => (
            <Card {...event} key={event.id} />
          ))}
        </ul>
      ) : (
        <Feedback>Nenhum evento adicionado</Feedback>
      )}
    </>
  );
}
