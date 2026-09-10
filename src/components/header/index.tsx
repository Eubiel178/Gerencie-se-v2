"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { FaHome, FaSignOutAlt, FaFire, FaBullseye, FaTint, FaRunning, FaBook, FaHeartbeat, FaCalendarCheck, FaListUl, FaChartBar } from "react-icons/fa";
import { MdEvent, MdSettings, MdTimer } from "react-icons/md";
import { MdOutlineSchedule } from "react-icons/md";

import styles from "@/app/home/home-layout.module.css";

const links = [
  { href: "/home", label: "Visão geral", icon: FaHome },
  { href: "/home/tasks", label: "Tarefas", icon: FaListUl },
  { href: "/home/routine", label: "Rotina", icon: MdOutlineSchedule },
  { href: "/home/habits", label: "Hábitos", icon: FaFire },
  { href: "/home/goals", label: "Objetivos", icon: FaBullseye },
  { href: "/home/focus", label: "Foco", icon: MdTimer },
  { href: "/home/hydration", label: "Hidratação", icon: FaTint },
  { href: "/home/running", label: "Corrida", icon: FaRunning },
  { href: "/home/reading", label: "Leitura", icon: FaBook },
  { href: "/home/health", label: "Saúde", icon: FaHeartbeat },
  { href: "/home/menstrual-cycle", label: "Ciclo", icon: FaCalendarCheck },
  { href: "/home/event", label: "Calendário", icon: MdEvent },
  { href: "/home/stats", label: "Estatísticas", icon: FaChartBar },
  { href: "/home/settings", label: "Configurações", icon: MdSettings },
];

export const Header = () => {
  const pathname = usePathname();

  return <aside className={styles.sidebar}>
    <p className={styles.brand}>
      <span className={styles.brandMark} aria-hidden="true">
        <svg viewBox="0 0 64 64" width="20" height="20" fill="none">
          <circle cx="32" cy="32" r="22" stroke="currentColor" strokeOpacity="0.35" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r="22"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="138.2"
            strokeDashoffset="34.5"
            transform="rotate(-90 32 32)"
          />
          <path
            d="M22 33 L29 40 L43 24"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      Gerencie-se
    </p>
    <nav aria-label="Navegação principal"><ul className={styles.navigation}>{links.map(({ href, label, icon: Icon }) => <li key={href}><Link href={href} data-active={pathname === href}><Icon aria-hidden="true" />{label}</Link></li>)}</ul></nav>
    <button className={styles.signOut} type="button" onClick={() => signOut({ callbackUrl: "/login" })}><FaSignOutAlt aria-hidden="true" />Sair</button>
  </aside>;
};
