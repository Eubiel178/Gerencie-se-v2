import { tv } from "tailwind-variants";

const styles = tv({
  base: "flex-1 flex items-center justify-center bg-white",
});

type MainProps = React.ComponentProps<"main">;

export function Main({ children }: MainProps) {
  return <main className={styles()}>{children}</main>;
}
