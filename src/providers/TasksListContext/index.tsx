"use client";

import { createContext, useContext, useState } from "react";

import { ProviderProps } from "../ProviderProps";
import { TaskType, createTask, deleteTask, editTask } from "@/services/task";

type ContextType = {
  isOpenModal: boolean;
  setIsOpenModal: (isOpen: boolean) => void;
  taskBeingEdited: TaskType;
  setTaskBeingEdited: (event: TaskType) => void;
  handleTaskCreation: (data: Omit<TaskType, "id">) => void;
  handleTaskEditing: (data: TaskType) => void;
  handleTaskRemove: (id: string) => void;
};

const Context = createContext({} as ContextType);

const TaskListProvider = ({ children }: ProviderProps) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [taskBeingEdited, setTaskBeingEdited] = useState({} as TaskType);

  const handleTaskCreation: ContextType["handleTaskCreation"] = async (
    data
  ) => {
    const newData = { ...data, createdAt: new Date() };

    const response = await createTask(newData);
    try {
    } catch (error) {}
  };

  const handleTaskEditing: ContextType["handleTaskEditing"] = async (data) => {
    try {
      const response = await editTask(data, taskBeingEdited.id);
    } catch (error) {}
  };

  const handleTaskRemove: ContextType["handleTaskRemove"] = async (id) => {
    try {
      const response = await deleteTask(id);
    } catch (error) {}
  };

  return (
    <Context.Provider
      value={{
        isOpenModal,
        setIsOpenModal,
        taskBeingEdited,
        setTaskBeingEdited,
        handleTaskCreation,
        handleTaskEditing,
        handleTaskRemove,
      }}
    >
      {children}
    </Context.Provider>
  );
};

const useTaskListContext = () => {
  return useContext(Context);
};

export { TaskListProvider, useTaskListContext };
