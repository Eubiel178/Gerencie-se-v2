"use client";

import { Wrapper } from "@/components";

import { AddEvent } from "../modal";

export function EventListHeader() {
  return (
    <Wrapper align="center" justify="between">
      <h3 className="text-base">Eventos</h3>

      <AddEvent buttonText="Novo" />
    </Wrapper>
  );
}
