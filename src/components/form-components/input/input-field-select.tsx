"use client";

import { forwardRef } from "react";
import { VariantProps, tv } from "tailwind-variants";
import { useInputRootContext } from "@/providers/InputRootContext";

const selectStyles = tv({
  base: "appearance-none w-full border border-solid border-stone-200 p-2",

  variants: {
    incorrect: {
      true: "border-red-500 placeholder-red-500",
      false: "border-stone-200",
    },
  },
});

type OptionSelectProps = {
  label: string;
  value: string;
};

interface InputFieldSelectProps
  extends React.ComponentProps<"select">,
    VariantProps<typeof selectStyles> {
  optionsArray: OptionSelectProps[];
}

export const InputFieldSelect = forwardRef<
  HTMLSelectElement,
  InputFieldSelectProps
>(({ className, name, optionsArray, ...rest }, ref) => {
  const { sharedProps } = useInputRootContext();
  const incorrect = sharedProps?.error ? true : false;

  return (
    <select
      {...rest}
      className={selectStyles({
        incorrect: incorrect,
      })}
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
});
