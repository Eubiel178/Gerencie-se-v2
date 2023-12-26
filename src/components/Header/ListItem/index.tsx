import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnchorHTMLAttributes, ElementType } from "react";

interface ListItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  textLink: string;
  icon: ElementType;
}

export const ListItem = ({ href, icon: Icon, textLink }: ListItemProps) => {
  const pathName = usePathname();

  return (
    <li
      className={`flex rounded-md ${
        pathName === href && "bg-gray-700 shadow"
      } `}
    >
      <Link className="flex-1 flex items-center gap-2 px-1.5 py-2" href={href}>
        <p className="bg-gray-700 p-2 border rounded-md shadow">
          <Icon />
        </p>

        <p>{textLink}</p>
      </Link>
    </li>
  );
};
