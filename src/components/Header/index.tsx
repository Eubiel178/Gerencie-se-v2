import { useState } from "react";
import { FaHome } from "react-icons/fa";
import { TfiAgenda } from "react-icons/tfi";

import { Title } from "..";
import { ListItem } from "./ListItem";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoClose } from "react-icons/io5";

export const Header = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleNavModal = (): void => {
    setIsOpen(!isOpen);
  };

  return (
    <header
      className={
        "w-48 bg-gray-600 text-slate-50 shadow-sm flex flex-col gap-7 p-5 smallTablet:flex-row smallTablet:justify-between smallTablet:w-full relative"
      }
    >
      <Title.One>Gerencie-se</Title.One>

      <button
        type="button"
        className={`hidden text-2xl ${
          isOpen ? "smallTablet:hidden" : "smallTablet:block"
        }`}
        onClick={handleNavModal}
      >
        <GiHamburgerMenu />
      </button>

      <nav
        className={`${
          isOpen ? "smallTablet:block" : "smallTablet:hidden"
        } smallTablet:absolute smallTablet:right-2 smallTablet:top-3 smallTablet:bg-gray-600 smallTablet:w-40`}
      >
        <ul className="flex flex-col gap-3 smallTablet:relative">
          <li className="hidden smallTablet:block absolute right-3 top-3 text-2xl">
            <button onClick={handleNavModal}>
              <IoClose />
            </button>
          </li>

          <ListItem href="/home" icon={FaHome} textLink="Home" />
          <ListItem href="/home/schedule" icon={TfiAgenda} textLink="Agenda" />
        </ul>
      </nav>
    </header>
  );
};
