import styles from "./styles.module.css";

type ModalProps = React.ComponentProps<"div">;

export const Modal = ({ children, className, ...rest }: ModalProps) => {
  const classNames = className ? `${styles.modal} ${className}` : styles.modal;

  return (
    <div className={styles.overlay}>
      <div className={classNames} {...rest}>
        {children}
      </div>
    </div>
  );
};
