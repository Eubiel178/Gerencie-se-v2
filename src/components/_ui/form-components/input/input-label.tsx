import { VariantProps, tv } from "tailwind-variants";

const labelStyles = tv({
  base: "",

  variants: {
    size: {
      small: "text-xs",
      medium: "text-sm",
      large: "text-lg",
    },
  },
});

type InputLabelProps = React.ComponentProps<"label"> &
  VariantProps<typeof labelStyles>;

export const InputLabel = ({ children, htmlFor, size }: InputLabelProps) => {
  return (
    <label className={labelStyles({ size })} htmlFor={htmlFor}>
      {children}
    </label>
  );
};
