import { forwardRef } from "react";
import { VariantProps, tv } from "tailwind-variants";
import { useInputRootContext } from "@/providers/input-root-context";

const inputStyles = tv({
  base: "w-full border border-solid border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] p-2",

  variants: {
    incorrect: {
      true: "border-[var(--color-danger)] placeholder:text-[var(--color-danger)]",
      false: "border-[var(--color-border)]",
    },
  },
});

type InputFieldProps = React.ComponentProps<"input"> &
  VariantProps<typeof inputStyles>;

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ type = "text", name, placeholder, className, ...rest }, ref) => {
    const { sharedProps } = useInputRootContext();
    const incorrect = sharedProps?.error ? true : false;

    return (
      <input
        {...rest}
        className={inputStyles({ className, incorrect: incorrect })}
        type={type}
        name={name}
        id={name}
        placeholder={placeholder}
        ref={ref}
      />
    );
  }
);
