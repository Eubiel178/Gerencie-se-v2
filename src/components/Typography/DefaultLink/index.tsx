import Link from "next/link";
import { AnchorHTMLAttributes } from "react";
import { VariantProps, tv } from "tailwind-variants";

const anchor = tv({
  base: "text-[#0000ff] hover:text-red-700 hover:underline",
});

interface DefaultLinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof anchor> {
  href: string;
}

export const DefaultLink = ({ href, children }: DefaultLinkProps) => {
  return (
    <Link href={href} className={anchor()}>
      {children}
    </Link>
  );
};
