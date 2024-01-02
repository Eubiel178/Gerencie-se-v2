import Link from "next/link";
import { usePathname } from "next/navigation";
import { ElementType } from "react";
import { VariantProps, tv } from "tailwind-variants";

const li = tv({
  slots: {
    base: "flex hover:bg-gray-700 duration-200",
    anchor: "flex-1 flex items-center gap-2 px-1.5 py-2 ",
    paragraph: "bg-gray-700 p-2 border shadow",
  },

  variants: {
    currentRoute: {
      true: {
        base: "bg-gray-700 shadow",
      },
    },
  },
});

interface ListItemProps extends VariantProps<typeof li> {
  href: string;
  textLink: string;
  icon: ElementType;
}

export const ListItem = ({ href, icon: Icon, textLink }: ListItemProps) => {
  const pathName = usePathname();
  const { base, anchor, paragraph } = li();

  return (
    <li className={base({ currentRoute: pathName === href })}>
      <Link className={anchor()} href={href}>
        <p className={paragraph()}>
          <Icon />
        </p>

        <p>{textLink}</p>
      </Link>
    </li>
  );
};
