import { HTMLAttributes } from "react";

export const NotificationText = ({
  children,
}: HTMLAttributes<HTMLParagraphElement>) => {
  return <p>{children}</p>;
};
