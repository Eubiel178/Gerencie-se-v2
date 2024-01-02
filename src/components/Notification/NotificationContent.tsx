import { HTMLAttributes } from "react";
import { VariantProps, tv } from "tailwind-variants";

const div = tv({ base: "flex flex-col gap-5" });

interface NotificationContentProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof div> {}

export const NotificationContent = ({ children }: NotificationContentProps) => {
  return <div className={div()}>{children}</div>;
};
