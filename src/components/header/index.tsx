"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/icon";

import styles from "@/app/home/home-layout.module.css";

const links = [
  { href: "/home", label: "Visão geral", icon: "FaHome" },
  { href: "/home/tasks", label: "Tarefas", icon: "FaListUl" },
  { href: "/home/routine", label: "Rotina", icon: "MdOutlineSchedule" },
  { href: "/home/habits", label: "Hábitos", icon: "FaFire" },
  { href: "/home/goals", label: "Objetivos", icon: "FaBullseye" },
  { href: "/home/focus", label: "Foco", icon: "MdTimer" },
  { href: "/home/hydration", label: "Hidratação", icon: "FaTint" },
  { href: "/home/running", label: "Corrida", icon: "FaRunning" },
  { href: "/home/reading", label: "Leitura", icon: "FaBook" },
  { href: "/home/health", label: "Saúde", icon: "FaHeartbeat" },
  { href: "/home/menstrual-cycle", label: "Ciclo", icon: "FaCalendarCheck" },
  { href: "/home/event", label: "Calendário", icon: "MdEvent" },
  { href: "/home/stats", label: "Estatísticas", icon: "FaChartBar" },
  { href: "/home/settings", label: "Configurações", icon: "MdSettings" },
] as const;

interface HeaderProps {
  user: {
    name: string | null;
    image: string | null;
  };
}

function initials(name: string | null): string {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);
  let result = parts[0].slice(0, 2);

  if (parts.length > 1) {
    result = result + parts[1][0];
  }

  return result.toUpperCase();
}

export const Header = ({ user }: HeaderProps) => {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <p className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true">
          <svg viewBox="0 0 64 64" width="20" height="20" fill="none">
            <circle
              cx="32"
              cy="32"
              r="22"
              stroke="currentColor"
              strokeOpacity="0.35"
              strokeWidth="6"
            />
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
      <nav aria-label="Navegação principal">
        <ul className={styles.navigation}>
          {links.map(({ href, label, icon }) => (
            <li key={href}>
              <Link href={href} data-active={pathname === href}>
                <Icon name={icon} aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Link href="/home/settings#conta" className={styles.profile}>
        {user.image ? (
          <Image
            src={user.image}
            alt=""
            width={32}
            height={32}
            className={styles.profileAvatar}
          />
        ) : (
          <span className={styles.profileAvatarFallback} aria-hidden="true">
            {initials(user.name)}
          </span>
        )}
        <span className={styles.profileName}>{user.name ?? "Minha conta"}</span>
      </Link>

      <button
        className={styles.signOut}
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <Icon name="FaSignOutAlt" aria-hidden="true" />
        Sair
      </button>
    </aside>
  );
};
