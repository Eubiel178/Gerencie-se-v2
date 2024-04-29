"use client";

import { useState } from "react";

import { Button, Wrapper } from "@/components/_ui";

import { AddEvent } from "../Modal";

export function EventListHeader() {
  const [isOpenModal, setIsOpenModal] = useState(false);

  return (
    <Wrapper align="center" justify="between">
      <h3 className="text-base">Eventos</h3>

      <Button
        onClick={function () {
          setIsOpenModal(true);
        }}
      >
        Novo
      </Button>

      <AddEvent open={isOpenModal} setOpen={setIsOpenModal} />
    </Wrapper>
  );
}
