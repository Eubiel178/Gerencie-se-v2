import styles from "./styles.module.css";

type InputIconProps = React.ComponentProps<"p">;

export const InputIcon = ({ children }: InputIconProps) => {
  return <p className={styles.icon}>{children}</p>;
};
