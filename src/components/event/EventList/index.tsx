"use client";

import { useEventListContext } from "@/providers/EventListContext";
import { EventType } from "@/services/event";
import { dateFormatedToFront } from "@/utils";

import { FaEdit, FaTrash } from "react-icons/fa";
import { GoLinkExternal } from "react-icons/go";

import {
  Button,
  DefaultLink,
  Feedback,
  List,
  Paragraph,
  TitleFour,
  Wrapper,
} from "@/components/_ui";

import { tv } from "tailwind-variants";
import { EditEvent } from "../ModalEvent/EditEvent";

const styles = tv({
  base: "border-solid border-2 border-gray-300 p-3 flex flex-col gap-4",
});

export const EventList = ({ eventsList }: { eventsList: EventType[] }) => {
  const { setEventBeingEdited, eventBeingEdited, handleEventRemove } =
    useEventListContext();
  const thereAreEvents = eventsList.length > 0;
  const thereEventBbeingEdited = eventBeingEdited.id && true;

  return (
    <>
      {thereAreEvents ? (
        <>
          {thereEventBbeingEdited && <EditEvent />}

          <List direction="column" wrap="nowrap">
            {eventsList.map((data) => (
              <li key={data.id} className={styles()}>
                <Wrapper direction="column">
                  <Wrapper direction="row" justify="between">
                    <TitleFour>{data.title}</TitleFour>

                    <Wrapper direction="row" gap="medium">
                      <Button
                        color="danger"
                        background="transparent"
                        size="xlarge"
                        onClick={() => handleEventRemove(data.id)}
                      >
                        <FaTrash />
                      </Button>

                      <Button
                        color="secondary"
                        background="transparent"
                        size="xlarge"
                        onClick={() => setEventBeingEdited(data)}
                      >
                        <FaEdit />
                      </Button>
                    </Wrapper>
                  </Wrapper>

                  <Wrapper direction="column" gap="small">
                    <Wrapper direction="column">
                      <Paragraph color="primary" size="medium">
                        Início: {dateFormatedToFront(data.start)}
                      </Paragraph>

                      {data.end && (
                        <Paragraph color="primary" size="medium">
                          Fim: {dateFormatedToFront(data.end)}
                        </Paragraph>
                      )}
                    </Wrapper>

                    <Paragraph size="medium">{data.description}</Paragraph>
                  </Wrapper>
                </Wrapper>

                {data.url && (
                  <DefaultLink
                    display="flex"
                    width="fit"
                    href={data.url}
                    target="_blank"
                  >
                    Acessar <GoLinkExternal />
                  </DefaultLink>
                )}
              </li>
            ))}
          </List>
        </>
      ) : (
        <Feedback>Nenhum evento adicionado</Feedback>
      )}
    </>
  );
};
