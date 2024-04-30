import { VariantProps, tv } from "tailwind-variants";

const styles = tv({
  base: "bg-stone-200 text-xl",
});

type InputIconProps = React.ComponentProps<"p"> & VariantProps<typeof styles>;

export const InputIcon = ({ children }: InputIconProps) => {
  return <p className={styles()}>{children}</p>;
};
