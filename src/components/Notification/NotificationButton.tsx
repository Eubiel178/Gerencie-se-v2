import { ButtonHTMLAttributes } from "react";

export const NotificationButton = ({
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) => {
  return <button {...rest}>{children}</button>;
};
