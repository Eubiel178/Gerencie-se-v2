"use client";

import { tv } from "tailwind-variants";

import { FaTrash } from "react-icons/fa";

import { GoLinkExternal } from "react-icons/go";

import { useEvent } from "@/@core/presentation/hooks";
import { dateFormatedToFront } from "@/utils";

import { Button, Paragraph, Wrapper } from "@/components";

import { EditEvent } from "../../modal";

import { IEvent } from "@/@core/domain";

const styles = tv({
  base: "border-solid border-2 border-gray-300 p-3 flex flex-col gap-4",
});

export function Card(event: IEvent) {
  const { fetcher } = useEvent();

  async function handleRemoveEvent() {
    fetcher.delete({ id: event.id });
  }

  return (
    <li key={event.id} className={styles()}>
      <Wrapper direction="column">
        <Wrapper direction="row" justify="between">
          <h4>{event.title}</h4>

          <Wrapper direction="row" gap="medium">
            <Button
              color="danger"
              background="transparent"
              size="xlarge"
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
        <a
          // display="flex"
          // width="fit"
          href={event.url}
          target="_blank"
        >
          Acessar <GoLinkExternal />
        </a>
      )}
    </li>
  );
}
