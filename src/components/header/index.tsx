"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon, IconName } from "@/components/icon";

import { Button } from "@/components";
import { ProfileModal } from "./profile-modal";
import { ProfileOverview } from "@/features/profile/get-profile-overview";
import { Gender } from "@/features/profile/get-gender";
import { usePaletteStore } from "@/features/search/palette-store";

import styles from "@/app/home/home-layout.module.css";

interface NavLink {
  href: string;
  label: string;
  icon: IconName;
  /** Só aparece pra quem marcou o gênero "feminino" em Configurações. */
  femaleOnly?: true;
}

interface NavGroup {
  label: string | null;
  links: NavLink[];
}

// Navegação em grupos (sub-listas com um rótulo pequeno acima), em vez de
// uma lista única de 14 links — mais fácil de escanear. "Visão geral" e
// "Configurações" ficam soltos, de propósito, fora de qualquer grupo (são
// os dois pontos de entrada/saída da navegação, não pertencem a uma
// categoria).
const NAV_GROUPS: NavGroup[] = [
  { label: null, links: [{ href: "/home", label: "Visão geral", icon: "FaHome" }] },
  {
    label: "Produtividade",
    links: [
      { href: "/home/tasks", label: "Tarefas", icon: "FaListUl" },
      { href: "/home/routine", label: "Rotina", icon: "MdOutlineSchedule" },
      { href: "/home/habits", label: "Hábitos", icon: "FaFire" },
      { href: "/home/goals", label: "Objetivos", icon: "FaBullseye" },
      { href: "/home/focus", label: "Foco", icon: "MdTimer" },
    ],
  },
  {
    label: "Saúde & bem-estar",
    links: [
      { href: "/home/hydration", label: "Hidratação", icon: "FaTint" },
      { href: "/home/running", label: "Corrida", icon: "FaRunning" },
      { href: "/home/reading", label: "Leitura", icon: "FaBook" },
      { href: "/home/health", label: "Saúde", icon: "FaHeartbeat" },
      { href: "/home/menstrual-cycle", label: "Ciclo", icon: "FaCalendarCheck", femaleOnly: true },
    ],
  },
  {
    label: "Organização",
    links: [
      { href: "/home/event", label: "Calendário", icon: "MdEvent" },
      { href: "/home/stats", label: "Estatísticas", icon: "FaChartBar" },
    ],
  },
  { label: null, links: [{ href: "/home/settings", label: "Configurações", icon: "MdSettings" }] },
];

function visibleNavGroups(gender: Gender): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((link) => !link.femaleOnly || gender === "feminino"),
  })).filter((group) => group.links.length > 0);
}

interface HeaderProps {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
    gender: Gender;
  };
  overview: ProfileOverview;
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

export const Header = ({ user, overview }: HeaderProps) => {
  const pathname = usePathname();
  const openPalette = usePaletteStore((state) => state.open);
  const [isConfirmingSignOut, setIsConfirmingSignOut] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    signOut({ callbackUrl: "/login" });
  }
  const navGroups = visibleNavGroups(user.gender);

  // Começa aberto só o grupo (se houver) que contém a página atual — o
  // resto some por trás de um clique, em vez de mostrar os 14 links soltos
  // o tempo todo.
  const [openGroups, setOpenGroups] = useState<Set<number>>(() => {
    const initial = new Set<number>();

    navGroups.forEach((group, index) => {
      if (group.label && group.links.some((link) => link.href === pathname)) {
        initial.add(index);
      }
    });

    return initial;
  });

  function toggleGroup(index: number) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

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

      <button type="button" className={styles.searchTrigger} onClick={openPalette}>
        <Icon name="FaSearch" aria-hidden="true" />
        Buscar
        <span className={styles.searchShortcut}>Ctrl+K</span>
      </button>

      <nav aria-label="Navegação principal" className={styles.navGroups}>
        {navGroups.map((group, index) => {
          const isOpen = !group.label || openGroups.has(index);

          return (
            <div key={index} className={styles.navGroup}>
              {group.label && (
                <button
                  type="button"
                  className={styles.navGroupToggle}
                  aria-expanded={isOpen}
                  onClick={() => toggleGroup(index)}
                >
                  {group.label}
                  <Icon name={isOpen ? "MdExpandLess" : "MdExpandMore"} aria-hidden="true" />
                </button>
              )}

              {isOpen && (
                <ul className={styles.navigation}>
                  {group.links.map(({ href, label, icon }) => (
                    <li key={href}>
                      <Link href={href} data-active={pathname === href}>
                        <Icon name={icon} aria-hidden="true" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <button type="button" className={styles.profile} onClick={() => setIsProfileOpen(true)}>
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
      </button>

      {isProfileOpen && (
        <ProfileModal user={user} gender={user.gender} overview={overview} onClose={() => setIsProfileOpen(false)} />
      )}

      {isConfirmingSignOut ? (
        <div className={styles.signOutConfirm}>
          <span className={styles.signOutConfirmText}>Sair da conta?</span>

          <div className={styles.signOutConfirmActions}>
            <Button.Preset
              icon={{ name: "MdClose" }}
              root={{
                tone: "muted",
                "aria-label": "Cancelar",
                onClick: () => setIsConfirmingSignOut(false),
              }}
            />

            <Button.Preset
              icon={{ name: "FaCheck" }}
              root={{
                tone: "danger",
                "aria-label": "Confirmar saída",
                loading: isSigningOut,
                onClick: handleSignOut,
              }}
            />
          </div>
        </div>
      ) : (
        <button
          className={styles.signOut}
          type="button"
          onClick={() => setIsConfirmingSignOut(true)}
        >
          <Icon name="FaSignOutAlt" aria-hidden="true" />
          Sair
        </button>
      )}
    </aside>
  );
};
