"use client";

import { useInputRootContext } from "@/providers/input-root-context";
import { VariantProps, tv } from "tailwind-variants";

const textStyles = tv({
  base: "text-[var(--color-danger)] text-xs",
});

type InputHelperTextProps = React.ComponentProps<"p"> &
  VariantProps<typeof textStyles>;

export const InputHelperText = ({}: InputHelperTextProps) => {
  const { sharedProps } = useInputRootContext();

  return <p className={textStyles()}>{sharedProps?.error}</p>;
};
