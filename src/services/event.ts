"use server";

import { api } from "./api";
import { revalidateTag } from "next/cache";

type EventType = {
  id: string;
  title: string;
  start: string;
  end?: string;
  url?: string;
  description: string;
  backgroundColor?: string;
};

const getEventAll = async () => {
  const response = await fetch(`${api}/events`, {
    cache: "force-cache",
    next: { tags: ["events"] },
  });

  const data: EventType[] = await response.json();

  return data;
};

const createEvent = async (requestBody: Omit<EventType, "id">) => {
  const response = await fetch(`${api}/events`, {
    method: "POST",
    cache: "no-store",
    body: JSON.stringify(requestBody),
  });

  const data: EventType = await response.json();

  revalidateTag("events");
  return data;
};

const editEvent = async (requestBody: EventType, id: string) => {
  const response = await fetch(`${api}/events/${id}`, {
    method: "PUT",
    cache: "no-store",
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  revalidateTag("events");
  return data;
};

const deleteEvent = async (id: string) => {
  const response = await fetch(`${api}/events/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });

  revalidateTag("events");
  return response;
};

export { type EventType, getEventAll, createEvent, editEvent, deleteEvent };
