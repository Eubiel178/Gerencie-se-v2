import { tv } from "tailwind-variants";
import { Wrapper } from "..";

const styles = tv({
  base: "w-[23rem] fixed transform z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-surface)] text-[var(--color-text)] border-solid border-2 border-[var(--color-border)]",
});

type ModalProps = React.ComponentProps<typeof Wrapper>;

export const Modal = ({ children, ...rest }: ModalProps) => {
  return (
    <Wrapper
      className={styles()}
      direction="column"
      gap="large"
      padding="large"
      shadow="large"
      {...rest}
    >
      {children}
    </Wrapper>
  );
};
