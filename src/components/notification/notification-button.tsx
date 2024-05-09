type NotificationButtonProps = React.ComponentProps<"button">;

export const NotificationButton = ({
  children,
  ...rest
}: NotificationButtonProps) => {
  return <button {...rest}>{children}</button>;
};
