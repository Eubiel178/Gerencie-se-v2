import Link from "next/link";
import { VariantProps, tv } from "tailwind-variants";

const linkStyles = tv({
  base: "text-[#0000ff] hover:text-red-700 hover:underline",

  variants: {
    display: {
      flex: "flex items-center gap-1.5",
      block: "block",
    },

    size: {
      small: "text-xs",
      medium: "text-sm",
      large: "text-lg",
    },

    width: {
      fit: "w-fit",
    },
  },

  defaultVariants: {
    display: "block",
  },
});

type DefaultLinkProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof linkStyles>;

export const DefaultLink = ({
  size,
  href,
  width,
  display,
  children,
  ...rest
}: DefaultLinkProps) => {
  return (
    <Link
      className={linkStyles({ display, width, size })}
      href={href}
      {...rest}
    >
      {children}
    </Link>
  );
};
