import { HTMLAttributes } from "react";
import { VariantProps, tv } from "tailwind-variants";

const div = tv({
  base: "border-2 border-solid py-4 px-3 rounded-xl w-96 shadow-md flex flex-col gap-4",
  variants: {
    customColor: {
      primary: "bg-yellow-100  border-yellow-400 text-yellow-700",
    },
  },

  defaultVariants: {
    customColor: "primary",
  },
});

interface NotificationRootProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof div> {
  isOpen: boolean;
}

export const NotificationRoot = ({
  children,
  isOpen,
}: NotificationRootProps) => {
  return <>{isOpen === true && <div className={div()}>{children}</div>}</>;
};
