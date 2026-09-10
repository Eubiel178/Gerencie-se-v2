"use client";

import { create } from "zustand";

import type { IEvent } from "@/features/events/domain";

interface EventStore {
  events: IEvent[];
  setEvents: (events: IEvent[]) => void;
  removeEvent: (eventId: string) => void;
}

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  setEvents: (events) => set({ events }),
  removeEvent: (eventId) =>
    set((state) => ({ events: state.events.filter((event) => event.id !== eventId) })),
}));
