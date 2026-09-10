import { Wrapper } from "..";

import styles from "./styles.module.css";

type ModalProps = React.ComponentProps<typeof Wrapper>;

export const Modal = ({ children, ...rest }: ModalProps) => {
  return (
    <div className={styles.overlay}>
      <Wrapper
        className={styles.modal}
        direction="column"
        gap="large"
        padding="large"
        {...rest}
      >
        {children}
      </Wrapper>
    </div>
  );
};
