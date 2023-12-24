import { useState } from "react";

const useLocalStorage = <T>(
  initialValue: T
): [T, (newKey: string, newValue: T) => void] => {
  const [value, setValue] = useState<T>(initialValue);

  const setLocalStorage = (newKey: string, newValue: T) => {
    setValue(newValue);

    localStorage.setItem(newKey, JSON.stringify(newValue));
  };

  return [value, setLocalStorage];
};

export default useLocalStorage;
