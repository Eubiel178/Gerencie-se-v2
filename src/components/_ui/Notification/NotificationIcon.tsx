import { VariantProps, tv } from "tailwind-variants";

const styles = tv({
  base: "text-2xl",
});

type NotificationIconProps = React.ComponentProps<"p"> &
  VariantProps<typeof styles>;

export const NotificationIcon = ({ children }: NotificationIconProps) => {
  return <p className={styles()}>{children}</p>;
};
