import { VariantProps, tv } from "tailwind-variants";

const wrapperStyles = tv({ base: "flex flex-col gap-5" });

type NotificationWrapperProps = React.ComponentProps<"div"> &
  VariantProps<typeof wrapperStyles>;

export const NotificationWrapper = ({ children }: NotificationWrapperProps) => {
  return <div className={wrapperStyles()}>{children}</div>;
};
