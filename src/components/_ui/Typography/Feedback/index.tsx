import { VariantProps, tv } from "tailwind-variants";

const feedbackStyles = tv({
  base: "text-gray-500",

  variants: {
    type: {
      error: "text-red-500",
      success: "text-green-500",
      warning: "text-yellow-500",
      info: "text-gray-500",
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
