"use client";

import { useState } from "react";

import { Button, ConfirmIconButton } from "@/components";
import { Icon } from "@/components/icon";
import { deleteEventAction } from "@/features/events/actions";
import { IEvent } from "@/features/events/domain";
import { useEventStore } from "@/features/events/event-store";
import styles from "@/styles/workspace.module.css";
import { dateFormatedToFront } from "@/utils";


import { EditEvent } from "../../modal";


export function Card(event: IEvent) {
  const [isRemoving, setIsRemoving] = useState(false);
  const removeEvent = useEventStore((state) => state.removeEvent);

  async function handleRemoveEvent() {
    setIsRemoving(true);

    try {
      const result = await deleteEventAction({ id: event.id });
      if (!result.error) removeEvent(event.id);
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <li
      key={event.id}
      className={styles.eventCard}
      style={event.backgroundColor ? { borderLeftColor: event.backgroundColor } : undefined}
    >
      <div className={styles.eventCardBody}>
        <div className={styles.eventCardHeader}>
          <h4>{event.title}</h4>

          <div className={styles.eventCardActions}>
            <ConfirmIconButton
              icon="FaTrash"
              ariaLabel={`Excluir evento "${event.title}"`}
              confirmText={`Excluir "${event.title}"?`}
              loading={isRemoving}
              onConfirm={handleRemoveEvent}
            />

            <EditEvent eventBeingEdited={event} />
          </div>
        </div>

        <div className={styles.eventCardDetails}>
          <div className={styles.eventCardDates}>
            <p className={styles.eventDateText}>
              Início: {dateFormatedToFront(event.start)}
            </p>

            {event.end && (
              <p className={styles.eventDateText}>
                Fim: {dateFormatedToFront(event.end)}
              </p>
            )}
          </div>

          <p className={styles.eventDescription}>{event.description}</p>
        </div>
      </div>

      {event.url && (
        <a href={event.url} target="_blank" rel="noopener noreferrer">
          Acessar <Icon name="GoLinkExternal" aria-hidden="true" />
        </a>
      )}
    </li>
  );
}
