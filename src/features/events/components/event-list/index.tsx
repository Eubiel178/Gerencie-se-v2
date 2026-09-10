"use client";

import { useEffect } from "react";

import { List, Feedback } from "@/components";

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
        <>
          <List className={styles.eventList} direction="column" wrap="nowrap">
            {events.map((event) => (
              <Card {...event} key={event.id} />
            ))}
          </List>
        </>
      ) : (
        <Feedback>Nenhum evento adicionado</Feedback>
      )}
    </>
  );
}
