"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { FaHome, FaSignOutAlt, FaFire, FaBullseye } from "react-icons/fa";
import { MdEvent, MdSettings, MdTimer } from "react-icons/md";
import { MdOutlineSchedule } from "react-icons/md";

import styles from "@/app/home/home-layout.module.css";

const links = [
  { href: "/home", label: "Visão geral", icon: FaHome },
  { href: "/home/routine", label: "Rotina", icon: MdOutlineSchedule },
  { href: "/home/habits", label: "Hábitos", icon: FaFire },
  { href: "/home/goals", label: "Objetivos", icon: FaBullseye },
  { href: "/home/focus", label: "Foco", icon: MdTimer },
  { href: "/home/event", label: "Calendário", icon: MdEvent },
  { href: "/home/settings", label: "Configurações", icon: MdSettings },
];

export const Header = () => {
  const pathname = usePathname();

  return <aside className={styles.sidebar}>
    <p className={styles.brand}><span className={styles.brandMark}>✦</span>Gerencie-se</p>
    <nav aria-label="Navegação principal"><ul className={styles.navigation}>{links.map(({ href, label, icon: Icon }) => <li key={href}><Link href={href} data-active={pathname === href}><Icon aria-hidden="true" />{label}</Link></li>)}</ul></nav>
    <button className={styles.signOut} type="button" onClick={() => signOut({ callbackUrl: "/login" })}><FaSignOutAlt aria-hidden="true" />Sair</button>
  </aside>;
};
