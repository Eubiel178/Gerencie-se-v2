import { VariantProps, tv } from "tailwind-variants";

const rootStyles = tv({
  base: "border-2 border-solid py-4 px-3 rounded-xl w-96 shadow-md flex-col gap-4",
  variants: {
    customColor: {
      primary: "bg-yellow-100 border-yellow-400 text-yellow-700",
    },

    isVisible: {
      true: "flex",
      false: "hidden",
    },
  },

  defaultVariants: {
    customColor: "primary",
  },
});

type NotificationRootProps = React.ComponentProps<"div"> &
  VariantProps<typeof rootStyles>;

export const NotificationRoot = ({ children }: NotificationRootProps) => {
  return <div className={rootStyles()}>{children}</div>;
};
