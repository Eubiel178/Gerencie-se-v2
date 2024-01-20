import { VariantProps, tv } from "tailwind-variants";

const titleStyles = tv({ base: "font-semibold" });

type NotificationTitleProps = React.ComponentProps<"h3"> &
  VariantProps<typeof titleStyles>;

export const NotificationTitle = ({ children }: NotificationTitleProps) => {
  return <h3 className={titleStyles()}>{children}</h3>;
};
