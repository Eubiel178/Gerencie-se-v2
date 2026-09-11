import styles from "./styles.module.css";

type ModalProps = React.ComponentProps<"div">;

export const Modal = ({ children, className, ...rest }: ModalProps) => {
  const classNames = [styles.modal, className].filter(Boolean).join(" ");

  return (
    <div className={styles.overlay}>
      <div className={classNames} {...rest}>
        {children}
      </div>
    </div>
  );
};
