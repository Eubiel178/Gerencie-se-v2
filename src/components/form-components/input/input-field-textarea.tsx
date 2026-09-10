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
