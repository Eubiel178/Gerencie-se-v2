import { HTMLAttributes } from "react";
import { VariantProps, tv } from "tailwind-variants";

const div = tv({ base: "flex items-center justify-between" });

interface NotificationHeaderProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof div> {}

export const NotificationHeader = ({ children }: NotificationHeaderProps) => {
  return <div className={div()}>{children}</div>;
};
