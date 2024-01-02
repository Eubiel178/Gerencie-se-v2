import { useState } from "react";
import { tv } from "tailwind-variants";
import { FaHome } from "react-icons/fa";
import { TfiAgenda } from "react-icons/tfi";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoClose } from "react-icons/io5";

import { TitleOne } from "..";
import { ListItem } from "./ListItem";

const header = tv(
  {
    slots: {
      base: "relative bg-gray-600 text-slate-50 shadow-sm flex gap-7 p-5",
      burguerButton: "text-2xl",
      navBar: "",
      navList: "flex flex-col gap-3",
      buttonCloseNav: "hidden text-2xl",
    },

    variants: {
      responsive: {
        mobile: {
          base: "w-full justify-between items-stretch",
          burguerButton: "block",
          navBar: "hidden absolute right-2 top-3 w-40 bg-gray-600",
          navList: "relative",
          buttonCloseNav: "absolute right-3 top-3",
        },
        small: {
          base: "flex-col w-48 justify-start",
          burguerButton: "hidden",
          navBar: "block static bg-transparent",
        },
      },

      navMobileOpen: {
        true: {
          burguerButton: "hidden",
          navBar: "block",
          buttonCloseNav: "block",
        },
      },
    },
  },

  {
    responsiveVariants: ["sm", "md"],
  }
);

export const Header = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { base, burguerButton, navBar, navList, buttonCloseNav } = header({
    responsive: {
      initial: "mobile",
      sm: "small",
    },
  });

  const handleNavModal = (): void => {
    setIsOpen(!isOpen);
  };

  return (
    <header className={base()}>
      <TitleOne>Gerencie-se</TitleOne>

      <button
        type="button"
        className={burguerButton({ navMobileOpen: isOpen })}
        onClick={handleNavModal}
      >
        <GiHamburgerMenu />
      </button>

      <nav className={navBar({ navMobileOpen: isOpen })}>
        <ul className={navList()}>
          <li className={buttonCloseNav({ navMobileOpen: isOpen })}>
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
