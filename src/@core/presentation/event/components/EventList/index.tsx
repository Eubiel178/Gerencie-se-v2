import { List, Feedback } from "@/components";

import { Card } from "./card";

import { IEvent } from "@/@core/domain";

export function EventList({ eventsList }: { eventsList: IEvent[] }) {
  const thereAreEvents = eventsList.length > 0;

  return (
    <>
      {thereAreEvents ? (
        <>
          <List direction="column" wrap="nowrap">
            {eventsList.map((event) => (
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
