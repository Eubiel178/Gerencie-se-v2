import { VariantProps, tv } from "tailwind-variants";

const paragraphStyles = tv({
  base: "",

  variants: {
    color: {
      primary: "text-[var(--color-text-muted)]",
      secondary: "text-[var(--color-text-muted)]",
      tertiary: "text-[var(--color-text)]",
      quarternary: "text-[var(--color-text)]",
      highlight: "text-[#00b8ff]",
    },

    weight: {
      bold: "font-bold",
      medium: "font-medium",
      regular: "font-normal",
      light: "font-light",
    },

    size: {
      xsmall: "text-xs",
      small: "text-sm",
      medium: "text-base",
      large: "text-lg",
    },
  },

  defaultVariants: {
    color: "quarternary",
  },
});

type ParagraphProps = React.ComponentProps<"p"> &
  VariantProps<typeof paragraphStyles>;

export const Paragraph = ({
  children,
  color,
  weight,
  size,
  className,
}: ParagraphProps) => {
  return (
    <p className={paragraphStyles({ color, weight, size, className })}>
      {children}
    </p>
  );
};
