import { VariantProps, tv } from "tailwind-variants";

const buttonStyles = tv({
  base: "text-white p-2 border-hidden",

  variants: {
    color: {
      primary: "text-white",
      secondary: "text-black",
      danger: "text-red-500",
    },

    background: {
      transparent: "bg-transparent",
      primary: "bg-sky-600",
      secondary: "bg-green-600",
    },

    radius: {
      square: "rounded-none",
      rounded: "rounded-full",
      lg: "rounded-lg",
      md: "rounded-md",
      sm: "rounded-sm",
    },

    disabled: {
      true: "opacity-50 bg-gray-500 pointer-events-none",
      false: "",
    },

    size: {
      xsmall: "text-xs",
      small: "text-sm",
      medium: "text-base",
      large: "text-lg",
      xlarge: "text-xl",
    },
  },

  defaultVariants: {
    color: "primary",
    background: "primary",
    radius: "square",
  },
});

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonStyles> & {
    loading?: boolean;
  };

export const Button = ({
  loading = false,
  children,
  color,
  background,
  radius,
  disabled,
  size,
  className,
  ...rest
}: ButtonProps) => {
  return (
    <button
      className={buttonStyles({
        color,
        background,
        radius,
        disabled: loading,
        size,
        className,
      })}
      {...rest}
    >
      {loading ? "Carregando..." : children}
    </button>
  );
};
