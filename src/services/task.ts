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
    next: { tags: ["tasks"] },
  });

  const data = await response.json();

  return data;
};

const deleteTask = async () => {
  const response = await fetch(`${api}/tasks`, {
    method: "DELETE",
    cache: "no-store",
    next: { tags: ["tasks"] },
  });

  const data = await response.json();

  return data;
};

export { type TaskType, getTaskAll };
