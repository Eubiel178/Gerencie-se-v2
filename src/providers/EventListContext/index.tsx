"use client";

import { createContext, useContext, useState } from "react";

import { ProviderProps } from "../ProviderProps";
import {
  EventType,
  createEvent,
  deleteEvent,
  editEvent,
} from "@/services/event";

type ContextType = {
  isOpenModal: boolean;
  setIsOpenModal: (isOpen: boolean) => void;
  eventBeingEdited: EventType;
  setEventBeingEdited: (event: EventType) => void;
  handleEventCreate: (data: Omit<EventType, "id">) => void;
  handleEventEdit: (data: EventType) => void;
  handleEventRemove: (id: string) => {};
};

const Context = createContext({} as ContextType);

const EventListProvider = ({ children }: ProviderProps) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [eventBeingEdited, setEventBeingEdited] = useState({} as EventType);

  const handleEventCreate: ContextType["handleEventCreate"] = async (data) => {
    try {
      const newDate = { ...data, createdAt: new Date() };

      const response = await createEvent(newDate);
    } catch (error) {}
  };

  const handleEventEdit: ContextType["handleEventEdit"] = async (data) => {
    try {
      const response = await editEvent(data, eventBeingEdited.id);
    } catch (error) {}
  };

  const handleEventRemove: ContextType["handleEventRemove"] = async (id) => {
    try {
      const response = await deleteEvent(id);
    } catch (error) {}
  };

  return (
    <Context.Provider
      value={{
        isOpenModal,
        setIsOpenModal,
        eventBeingEdited,
        setEventBeingEdited,
        handleEventCreate,
        handleEventEdit,
        handleEventRemove,
      }}
    >
      {children}
    </Context.Provider>
  );
};

const useEventListContext = () => {
  return useContext(Context);
};

export { EventListProvider, useEventListContext };
