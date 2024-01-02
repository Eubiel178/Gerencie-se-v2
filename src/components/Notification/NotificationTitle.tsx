import { HTMLAttributes } from "react";
import { VariantProps, tv } from "tailwind-variants";

const title = tv({ base: "font-semibold" });

interface NotificationTitleProps
  extends HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof title> {}

export const NotificationTitle = ({ children }: NotificationTitleProps) => {
  return <h3 className={title()}>{children}</h3>;
};
