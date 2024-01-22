import { useState } from "react";

type UseLocalStorageProps = (key?: string) => void;
type SetLocalStorageProps = (newKey: string, newValue: any) => void;

const useLocalStorage: UseLocalStorageProps = (
  key
): [any, SetLocalStorageProps] => {
  const getLocalStorage = (key: string): any => {
    const value = localStorage.getItem(key);

    if (value) {
      return JSON.parse(value);
    }

    return "";
  };

  const [value, setValue] = useState<any>(key ? getLocalStorage(key) : "");

  const setLocalStorage: SetLocalStorageProps = (newKey, newValue) => {
    setValue(newValue);
    localStorage.setItem(newKey, JSON.stringify(newValue));
  };

  return [value, setLocalStorage];
};
