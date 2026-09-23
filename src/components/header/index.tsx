"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import styles from "@/app/home/home-layout.module.css";
import { Button, Icon, type IconName } from "@/components";
import { useMobileNavStore } from "@/components/header/mobile-nav-store";
import { getFocusableElements } from "@/components/modal/get-focusable-elements";
import { useEffectiveTheme } from "@/design-system/theme/use-effective-theme";
import { ThemePreference, useTheme } from "@/design-system/theme/use-theme";
import { Gender } from "@/features/profile/get-gender";
import { usePaletteStore } from "@/features/search/palette-store";
import { QuickCapture } from "@/features/tasks/components/quick-capture";

import { useCaptureTimezone } from "./use-capture-timezone";


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
      { href: "/home/history", label: "Histórico", icon: "FaHistory" },
      { href: "/home/stats", label: "Estatísticas", icon: "FaChartBar" },
    ],
  },
  { label: null, links: [{ href: "/home/settings", label: "Configurações", icon: "MdSettings" }] },
];

// O cabeçalho alterna só entre claro/escuro (pedido explícito) - "Sistema"
// continua existindo, mas só como opção em Configurações (`ThemeToggle`,
// que mostra as 3). Ver `useEffectiveTheme` - quando a preferência salva
// é "system", o botão precisa saber qual dos dois está de fato NA TELA
// agora (nunca "o oposto de system", que não quer dizer nada) pra
// alternar pro tema explícito oposto.
const NEXT_EXPLICIT_THEME: Record<"light" | "dark", ThemePreference> = {
  light: "dark",
  dark: "light",
};
const EFFECTIVE_THEME_ICON: Record<"light" | "dark", IconName> = {
  light: "MdLightMode",
  dark: "MdDarkMode",
};
const EFFECTIVE_THEME_LABEL: Record<"light" | "dark", string> = {
  light: "Tema: claro",
  dark: "Tema: escuro",
};

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
  useCaptureTimezone();

  const { setPreference: setThemePreference } = useTheme();
  const effectiveTheme = useEffectiveTheme();
  const pathname = usePathname();
  const openPalette = usePaletteStore((state) => state.open);
  const [isConfirmingSignOut, setIsConfirmingSignOut] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  // Estado compartilhado (não local) - ver comentário em
  // `mobile-nav-store.ts`: o Guided Tour precisa abrir este painel de
  // fora, pra apontar pro item de navegação que só existe dentro dele.
  const isMobileNavigationOpen = useMobileNavStore((state) => state.isOpen);
  const openMobileNavigation = useMobileNavStore((state) => state.open);
  const closeMobileNavigation = useMobileNavStore((state) => state.close);
  const mobileNavigationRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!isMobileNavigationOpen) return;

    const navigationPanel = mobileNavigationRef.current;
    if (!navigationPanel) return;
    // Mantém um valor não anulável para o callback de teclado. O narrowing
    // de refs não é preservado pelo TypeScript dentro de closures.
    const focusTrapContainer: HTMLDivElement = navigationPanel;
    const menuButton = mobileMenuButtonRef.current;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const [firstFocusable] = getFocusableElements(focusTrapContainer);
    (firstFocusable ?? focusTrapContainer).focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMobileNavigation();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(focusTrapContainer);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      menuButton?.focus();
    };
  }, [closeMobileNavigation, isMobileNavigationOpen]);

  function renderNavigation(closeOnNavigate = false) {
    return (
      <nav aria-label="Navegação principal" className={styles.navGroups} data-tour="nav">
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
                      <Link
                        href={href}
                        data-active={pathname === href}
                        onClick={closeOnNavigate ? closeMobileNavigation : undefined}
                      >
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
    );
  }

  return (
    <>
      <header className={styles.mobileHeader}>
        <p className={styles.mobileBrand}>Gerencie-se</p>
        <div className={styles.mobileHeaderActions}>
          <button
            type="button"
            className={styles.themeIconButton}
            aria-label={EFFECTIVE_THEME_LABEL[effectiveTheme]}
            title={EFFECTIVE_THEME_LABEL[effectiveTheme]}
            onClick={() => setThemePreference(NEXT_EXPLICIT_THEME[effectiveTheme])}
          >
            <Icon name={EFFECTIVE_THEME_ICON[effectiveTheme]} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.mobileMenuButton}
            ref={mobileMenuButtonRef}
            aria-expanded={isMobileNavigationOpen}
            aria-controls="mobile-navigation"
            onClick={openMobileNavigation}
          >
            <Icon name="MdMenu" aria-hidden="true" />
            Menu
          </button>
        </div>
      </header>

      {isMobileNavigationOpen && (
        <div
          className={styles.mobileNavigationOverlay}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeMobileNavigation();
          }}
        >
          <div
            ref={mobileNavigationRef}
            id="mobile-navigation"
            className={styles.mobileNavigationPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            tabIndex={-1}
          >
            <div className={styles.mobileNavigationHeader}>
              <p className={styles.mobileBrand}>Gerencie-se</p>
              <button
                type="button"
                className={styles.mobileMenuButton}
                onClick={closeMobileNavigation}
              >
                <Icon name="MdClose" aria-hidden="true" />
                Fechar
              </button>
            </div>

            {/* `data-tour="search"` faltava aqui — o passo "Busca e
                captura rápida" do Guided Tour só conseguia apontar pro
                botão equivalente da sidebar de desktop, nunca pra este
                (o único que existe de verdade no mobile). */}
            <button type="button" className={styles.searchTrigger} data-tour="search" onClick={openPalette}>
              <Icon name="FaSearch" aria-hidden="true" />
              Buscar
            </button>

            <QuickCapture triggerClassName={styles.searchTrigger} />
            {renderNavigation(true)}
          </div>
        </div>
      )}

      <aside className={styles.sidebar}>
        <div className={styles.brandRow}>
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

          <button
            type="button"
            className={styles.themeIconButton}
            aria-label={EFFECTIVE_THEME_LABEL[effectiveTheme]}
            title={EFFECTIVE_THEME_LABEL[effectiveTheme]}
            onClick={() => setThemePreference(NEXT_EXPLICIT_THEME[effectiveTheme])}
          >
            <Icon name={EFFECTIVE_THEME_ICON[effectiveTheme]} aria-hidden="true" />
          </button>
        </div>

      <button type="button" className={styles.searchTrigger} data-tour="search" onClick={openPalette}>
        <Icon name="FaSearch" aria-hidden="true" />
        Buscar
        <span className={styles.searchShortcut}>Ctrl+K</span>
      </button>

      <QuickCapture triggerClassName={styles.searchTrigger} />

        {renderNavigation()}

      <Link href="/home/settings?section=conta" className={styles.profile}>
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
    </>
  );
};
