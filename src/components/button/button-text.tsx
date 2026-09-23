export interface ButtonTextProps extends React.ComponentProps<"span"> {}

export function ButtonText({ children, ...rest }: ButtonTextProps) {
  if (!children) return null;

  return <span {...rest}>{children}</span>;
}
