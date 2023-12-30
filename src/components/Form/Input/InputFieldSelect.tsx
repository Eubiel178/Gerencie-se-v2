import { SelectHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type optionJson = {
  label: string;
  value: string;
};

interface InputFieldSelect extends SelectHTMLAttributes<HTMLSelectElement> {
  optionsArray: optionJson[];
}

export const InputFieldSelect = forwardRef<HTMLSelectElement, InputFieldSelect>(
  ({ optionsArray, className, name, ...rest }, ref) => {
    return (
      <select
        {...rest}
        className={twMerge(
          "appearance-none w-full border border-solid border-stone-200 p-2",
          className
        )}
        name={name}
        id={name}
        ref={ref}
      >
        <option value="" disabled>
          Selecione
        </option>

        {optionsArray.map((element, index) => {
          return (
            <option key={index} value={element.value}>
              {element.label}
            </option>
          );
        })}
      </select>
    );
  }
);
