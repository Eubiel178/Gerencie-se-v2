import { usePathname } from "next/navigation";

import { FaHome } from "react-icons/fa";
import { TfiAgenda } from "react-icons/tfi";

import { Title } from "..";
import { ListItem } from "./ListItem";

export const Header = () => {
  return (
    <header className="w-48 bg-gray-600 text-white shadow-sm flex flex-col gap-7 p-5">
      <Title.One text="Gerencie-se" />

      <nav>
        <ul className="flex flex-col gap-3">
          <ListItem href="/home" icon={FaHome} textLink="Home" />
          <ListItem href="/home/schedule" icon={TfiAgenda} textLink="Agenda" />
        </ul>
      </nav>
    </header>
  );
};
