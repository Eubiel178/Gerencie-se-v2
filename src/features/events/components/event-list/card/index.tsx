"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Icon } from "@/components/icon";

import { deleteEventAction } from "@/features/events/actions";
import { dateFormatedToFront } from "@/utils";

import { Button } from "@/components";

import { EditEvent } from "../../modal";

import { IEvent } from "@/features/events/domain";
import styles from "@/styles/workspace.module.css";
import { useEventStore } from "@/features/events/event-store";

export function Card(event: IEvent) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);
  const removeEvent = useEventStore((state) => state.removeEvent);

  async function handleRemoveEvent() {
    setIsRemoving(true);

    try {
      const result = await deleteEventAction({ id: event.id });
      if (!result.error) removeEvent(event.id);
      router.refresh();
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <li key={event.id} className={styles.eventCard}>
      <div className={styles.eventCardBody}>
        <div className={styles.eventCardHeader}>
          <h4>{event.title}</h4>

          <div className={styles.eventCardActions}>
            <Button.IconButtonPreset
              icon={{ name: "FaTrash" }}
              root={{
                tone: "danger",
                "aria-label": `Excluir evento ${event.title}`,
                loading: isRemoving,
                onClick: handleRemoveEvent,
              }}
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
