import { Wrapper } from "@/components";

import { Calendar, EventList, EventListHeader } from "./components";

import { useEvent } from "../hooks";

export async function Event() {
  const { fetcher } = useEvent();

  const eventsList = await fetcher.loadAll({ id: "1" });

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
        <EventListHeader />

        <EventList eventsList={eventsList} />
      </Wrapper>
    </>
  );
}
