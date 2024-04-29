"use client";

import { tv } from "tailwind-variants";
import { FaEdit, FaTrash } from "react-icons/fa";
import { GoLinkExternal } from "react-icons/go";

import { dateFormatedToFront } from "@/utils";

import { List, Button, Wrapper, Feedback, Paragraph } from "@/components/_ui";

import { IEvent } from "@/@core/domain";

const styles = tv({
  base: "border-solid border-2 border-gray-300 p-3 flex flex-col gap-4",
});

export function EventList({ eventsList }: { eventsList: IEvent[] }) {
  const thereAreEvents = eventsList.length > 0;

  return (
    <>
      {thereAreEvents ? (
        <>
          {thereEventBeingEdited && <EditEvent />}

          <List direction="column" wrap="nowrap">
            {eventsList.map((data) => (
              <li key={data.id} className={styles()}>
                <Wrapper direction="column">
                  <Wrapper direction="row" justify="between">
                    <h4>{data.title}</h4>

                    <Wrapper direction="row" gap="medium">
                      <Button
                        color="danger"
                        background="transparent"
                        size="xlarge"
                        // onClick={() => handleEventRemove(data.id)}
                      >
                        <FaTrash />
                      </Button>

                      <Button
                        color="secondary"
                        background="transparent"
                        size="xlarge"
                        // onClick={() => setEventBeingEdited(data)}
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
                  <a
                    // display="flex"
                    // width="fit"
                    href={data.url}
                    target="_blank"
                  >
                    Acessar <GoLinkExternal />
                  </a>
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
}
