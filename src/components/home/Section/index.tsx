import { ComponentProps } from "react";
import { tv } from "tailwind-variants";

const styles = tv({
  base: "flex flex-col gap-10",
});

type SectionProps = ComponentProps<"section">;

export const Section = ({ children }: SectionProps) => {
  return <section className={styles()}>{children}</section>;
};
