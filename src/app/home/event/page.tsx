import { getEventAll } from "@/services/event";

import { Wrapper } from "@/components/_ui";
import { Calendar, EventList, EventListHeader } from "@/components/event";
import { EventListProvider } from "@/providers/EventListContext";

const Event = async () => {
  const eventsList = (await getEventAll()) || [];

  return (
    <>
      <Calendar eventsList={eventsList} />

      <Wrapper
        direction="column"
        gap="xlarge"
        background="light"
        shadow="small"
        padding="small"
      >
        <EventListProvider>
          <EventListHeader />

          <EventList eventsList={eventsList} />
        </EventListProvider>
      </Wrapper>
    </>
  );
};

export default Event;
