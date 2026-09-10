import { VariantProps, tv } from "tailwind-variants";

const feedbackStyles = tv({
  base: "text-[var(--color-text-muted)]",

  variants: {
    type: {
      error: "text-[var(--color-danger)]",
      success: "text-[var(--color-success)]",
      warning: "text-yellow-500",
      info: "text-[var(--color-info)]",
    },

    size: {
      xSmall: "text-xs",
      small: "text-sm",
      medium: "text-base",
      large: "text-lg",
    },
  },

  defaultVariants: {
    type: "info",
    size: "medium",
  },
});

type FeedbackProps = React.ComponentProps<"p"> &
  VariantProps<typeof feedbackStyles>;

export const Feedback = ({ children, type, size }: FeedbackProps) => {
  return <p className={feedbackStyles({ type, size })}>{children}</p>;
};
