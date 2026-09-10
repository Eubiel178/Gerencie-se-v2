"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";


import { FaTrash } from "react-icons/fa";

import { GoLinkExternal } from "react-icons/go";

import { deleteEventAction } from "@/features/events/actions";
import { dateFormatedToFront } from "@/utils";

import { Button, Paragraph, Wrapper } from "@/components";

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
      <Wrapper direction="column">
        <Wrapper direction="row" justify="between">
          <h4>{event.title}</h4>

          <Wrapper direction="row" gap="medium">
            <Button
              color="danger"
              background="transparent"
              size="xlarge"
              aria-label={`Excluir evento ${event.title}`}
              loading={isRemoving}
              onClick={handleRemoveEvent}
            >
              <FaTrash />
            </Button>

            <EditEvent eventBeingEdited={event} />
          </Wrapper>
        </Wrapper>

        <Wrapper direction="column" gap="small">
          <Wrapper direction="column">
            <Paragraph color="primary" size="medium">
              Início: {dateFormatedToFront(event.start)}
            </Paragraph>

            {event.end && (
              <Paragraph color="primary" size="medium">
                Fim: {dateFormatedToFront(event.end)}
              </Paragraph>
            )}
          </Wrapper>

          <Paragraph size="medium">{event.description}</Paragraph>
        </Wrapper>
      </Wrapper>

      {event.url && (
        <a href={event.url} target="_blank" rel="noopener noreferrer">
          Acessar <GoLinkExternal aria-hidden="true" />
        </a>
      )}
    </li>
  );
}
