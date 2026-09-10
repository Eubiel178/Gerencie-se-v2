"use client";

import { create } from "zustand";

import type { IEvent } from "@/features/events/domain";

interface EventStore {
  events: IEvent[];
  setEvents: (events: IEvent[]) => void;
  removeEvent: (eventId: string) => void;
  replaceEvent: (event: IEvent) => void;
}

/** Estado de interface para eventos. A fonte persistente continua sendo o
 * servidor; esta store dá atualização imediata e uma fonte compartilhada
 * entre componentes clientes da feature (mesmo padrão de `useTaskStore`). */
export const useEventStore = create<EventStore>((set) => ({
  events: [],
  setEvents: (events) => set({ events }),
  removeEvent: (eventId) =>
    set((state) => ({ events: state.events.filter((event) => event.id !== eventId) })),
  replaceEvent: (event) =>
    set((state) => ({
      events: state.events.map((current) => current.id === event.id ? event : current),
    })),
}));
