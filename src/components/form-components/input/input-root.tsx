import { InputRootProvider, SharedProps } from "@/providers/input-root-context";

import styles from "./styles.module.css";

type InputRootProps = React.ComponentProps<"div"> &
  SharedProps & {
    direction?: "row" | "col";
    justify?: "center" | "between" | "stretch";
    align?: "start" | "center" | "end" | "stretch";
  };

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const InputRoot = ({
  children,
  direction = "col",
  justify,
  align,
  sharedProps,
}: InputRootProps) => {
  const classNames = [
    styles.root,
    styles[`direction${capitalize(direction)}`],
    justify && styles[`justify${capitalize(justify)}`],
    align && styles[`align${capitalize(align)}`],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <InputRootProvider sharedProps={sharedProps}>
      <div className={classNames}>{children}</div>
    </InputRootProvider>
  );
};
