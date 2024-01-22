"use client";

import { createContext, useContext } from "react";
import { ProviderProps } from "../ProviderProps";

type SharedProps = {
  sharedProps?: {
    error: string | undefined;
  };
};

const Context = createContext<SharedProps>({} as SharedProps);

const InputRootProvider = ({
  children,
  sharedProps,
}: ProviderProps & SharedProps) => {
  return (
    <Context.Provider value={{ sharedProps }}>{children}</Context.Provider>
  );
};

const useInputRootContext = () => useContext(Context);

export { type SharedProps, InputRootProvider, useInputRootContext };
