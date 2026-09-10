import { VariantProps, tv } from "tailwind-variants";

const buttonStyles = tv({
  base: "text-[var(--color-on-info)] p-2 border-hidden",

  variants: {
    color: {
      primary: "text-[var(--color-on-info)]",
      secondary: "text-[var(--color-on-success)]",
      danger: "text-[var(--color-danger)]",
    },

    background: {
      transparent: "bg-transparent",
      primary: "bg-[var(--color-highlight)]",
      secondary: "bg-[var(--color-success)]",
    },

    radius: {
      square: "rounded-none",
      rounded: "rounded-full",
      lg: "rounded-lg",
      md: "rounded-md",
      sm: "rounded-sm",
    },

    disabled: {
      true: "opacity-50 bg-[var(--color-text-muted)] pointer-events-none",
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
  const isDisabled = loading || disabled;

  return (
    <button
      className={buttonStyles({
        color,
        background,
        radius,
        disabled: isDisabled,
        size,
        className,
      })}
      disabled={isDisabled}
      aria-busy={loading}
      {...rest}
    >
      {loading ? "Carregando..." : children}
    </button>
  );
};
