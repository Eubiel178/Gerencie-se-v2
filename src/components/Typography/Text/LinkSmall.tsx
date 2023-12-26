import Link from "next/link";
import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface LinkSmallProps extends HTMLAttributes<HTMLLinkElement> {
  text: string;
  href: string;
}

export const LinkSmall = ({ text, href, className }: LinkSmallProps) => {
  return (
    <Link
      className={twMerge(
        "text-blue-500 hover:text-blue-700 text-xs",
        className
      )}
      href={href}
    >
      {text}
    </Link>
  );
};
