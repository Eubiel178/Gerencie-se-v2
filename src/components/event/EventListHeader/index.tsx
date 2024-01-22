"use client";

import { Button, TitleThree, Wrapper } from "@/components/_ui";
import { useEventListContext } from "@/providers/EventListContext";
import { AddEvent } from "../ModalEvent/AddEvent";

export const EventListHeader = () => {
  const { setIsOpenModal } = useEventListContext();

  return (
    <Wrapper align="center" justify="between">
      <TitleThree>Eventos</TitleThree>

      <Button onClick={() => setIsOpenModal(true)}>Novo</Button>

      <AddEvent />
    </Wrapper>
  );
};
