import Link from "next/link";
import { usePathname } from "next/navigation";
import { VariantProps, tv } from "tailwind-variants";

const listItemStyles = tv({
  slots: {
    base: "flex hover:bg-gray-700 duration-200",
    link: "flex-1 flex items-center gap-2 px-1.5 py-2 ",
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

type ListItemProps = React.ComponentProps<"li"> &
  VariantProps<typeof listItemStyles> & {
    href: string;
    icon: React.ElementType;
  };

export const ListItem = ({ href, icon: Icon, children }: ListItemProps) => {
  const pathName = usePathname();
  const tv = listItemStyles();

  return (
    <li className={tv.base({ currentRoute: pathName === href })}>
      <Link className={tv.link()} href={href}>
        <p className={tv.paragraph()}>
          <Icon />
        </p>

        <p>{children}</p>
      </Link>
    </li>
  );
};
