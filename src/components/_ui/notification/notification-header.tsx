import { VariantProps, tv } from "tailwind-variants";

const headerStyles = tv({ base: "flex items-center justify-between" });

type NotificationHeaderProps = React.ComponentProps<"div"> &
  VariantProps<typeof headerStyles>;

export const NotificationHeader = ({ children }: NotificationHeaderProps) => {
  return <div className={headerStyles()}>{children}</div>;
};
