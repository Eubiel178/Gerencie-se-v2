"use server";

import { revalidatePath } from "next/cache";
import { api } from "./api";

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

  revalidatePath("/home/event", "page");
  return data;
};

const editEvent = async (requestBody: EventType, id: string) => {
  const response = await fetch(`${api}/events/${id}`, {
    method: "PUT",
    cache: "no-store",
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  revalidatePath("/home/event", "page");
  return data;
};

const deleteEvent = async (id: string) => {
  const response = await fetch(`${api}/events/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });

  revalidatePath("/home/event", "page");
  return response;
};

export { type EventType, getEventAll, createEvent, editEvent, deleteEvent };
