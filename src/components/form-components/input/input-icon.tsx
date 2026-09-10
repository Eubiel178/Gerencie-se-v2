import { VariantProps, tv } from "tailwind-variants";

const styles = tv({
  base: "bg-[var(--color-surface-elevated)] text-[var(--color-text)] text-xl",
});

type InputIconProps = React.ComponentProps<"p"> & VariantProps<typeof styles>;

export const InputIcon = ({ children }: InputIconProps) => {
  return <p className={styles()}>{children}</p>;
};
