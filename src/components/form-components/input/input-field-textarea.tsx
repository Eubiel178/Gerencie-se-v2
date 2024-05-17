import { forwardRef } from "react";
import { VariantProps, tv } from "tailwind-variants";
import { useInputRootContext } from "@/providers/InputRootContext";

const inputStyles = tv({
  base: "w-full border border-solid p-2",

  variants: {
    incorrect: {
      true: "border-red-500 placeholder-red-500",
      false: "border-stone-200",
    },
  },
});

type InputFieldTextareaProps = React.ComponentProps<"textarea"> &
  VariantProps<typeof inputStyles>;

export const InputFieldTextarea = forwardRef<
  HTMLTextAreaElement,
  InputFieldTextareaProps
>(({ name, placeholder, className, ...rest }, ref) => {
  const { sharedProps } = useInputRootContext();
  const incorrect = sharedProps?.error ? true : false;

  return (
    <textarea
      {...rest}
      className={inputStyles({ className, incorrect: incorrect })}
      name={name}
      id={name}
      placeholder={placeholder}
      ref={ref}
    ></textarea>
  );
});
