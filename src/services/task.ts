"use server";

import { revalidatePath } from "next/cache";
import { api } from "./api";

type TaskType = {
  id: string;
  tag: string;
  title: string;
  description: string;
};

const getTaskAll = async () => {
  const response = await fetch(`${api}/tasks`, {
    cache: "force-cache",
  });

  const data: TaskType[] = await response.json();

  return data;
};

const createTask = async (requestBody: Omit<TaskType, "id">) => {
  const response = await fetch(`${api}/tasks`, {
    method: "POST",
    cache: "no-store",
    body: JSON.stringify(requestBody),
  });

  const data: TaskType = await response.json();

  revalidatePath("/home/event", "page");
  return data;
};

const editTask = async (requestBody: TaskType, id: string) => {
  const response = await fetch(`${api}/tasks/${id}`, {
    method: "PUT",
    cache: "no-store",
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  revalidatePath("/home/event", "page");
  return data;
};

const deleteTask = async (id: string) => {
  const response = await fetch(`${api}/tasks/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });

  revalidatePath("/home/event", "page");
  return response;
};

export { type TaskType, getTaskAll, createTask, editTask, deleteTask };
