import { InputRootProvider, SharedProps } from "@/providers/input-root-context";

import styles from "./styles.module.css";

type InputRootProps = React.ComponentProps<"div"> & SharedProps;

export const InputRoot = ({ children, className, sharedProps, ...rest }: InputRootProps) => {
  const classNames = [styles.root, className].filter(Boolean).join(" ");

  return (
    <InputRootProvider sharedProps={sharedProps}>
      <div className={classNames} {...rest}>
        {children}
      </div>
    </InputRootProvider>
  );
};
