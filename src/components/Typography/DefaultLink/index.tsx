import Link from "next/link";
import { AnchorHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface DefaultLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export const DefaultLink = ({
  href,
  children,
  className = "",
}: DefaultLinkProps) => {
  return (
    <Link
      href={href}
      className={twMerge(
        "text-[#0000ff] hover:text-red-700 hover:underline",
        className
      )}
    >
      {children}
    </Link>
  );
};
