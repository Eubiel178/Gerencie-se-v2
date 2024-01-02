import { SelectHTMLAttributes, forwardRef } from "react";
import { VariantProps, tv } from "tailwind-variants";

const select = tv({
  base: "appearance-none w-full border border-solid border-stone-200 p-2",
});

type optionJson = {
  label: string;
  value: string;
};

interface InputFieldSelect
  extends SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof select> {
  optionsArray: optionJson[];
}

export const InputFieldSelect = forwardRef<HTMLSelectElement, InputFieldSelect>(
  ({ optionsArray, className, name, ...rest }, ref) => {
    return (
      <select {...rest} className={select()} name={name} id={name} ref={ref}>
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
