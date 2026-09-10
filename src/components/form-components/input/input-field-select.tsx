"use client";

import { forwardRef } from "react";

import { useInputRootContext } from "@/providers/input-root-context";

import styles from "./styles.module.css";

type OptionSelectProps = {
  label: string;
  value: string;
};

interface InputFieldSelectProps extends React.ComponentProps<"select"> {
  optionsArray: OptionSelectProps[];
}

export const InputFieldSelect = forwardRef<
  HTMLSelectElement,
  InputFieldSelectProps
>(({ className, name, optionsArray, ...rest }, ref) => {
  const { sharedProps } = useInputRootContext();
  const incorrect = Boolean(sharedProps?.error);

  const classNames = [
    styles.field,
    styles.select,
    incorrect && styles.incorrect,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <select {...rest} className={classNames} name={name} id={name} ref={ref}>
      <option value="" disabled>
        Selecione
      </option>

      {optionsArray.map((element, index) => (
        <option key={index} value={element.value}>
          {element.label}
        </option>
      ))}
    </select>
  );
});
