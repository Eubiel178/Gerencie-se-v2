"use client";

import { Icon, type IconName } from "@/components/icon";
import { useEffectiveTheme } from "@/design-system/theme/use-effective-theme";
import { ThemePreference, useTheme } from "@/design-system/theme/use-theme";

import styles from "./styles.module.css";

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

interface ThemeIconToggleProps {
  /** Classes adicionais aplicadas ao botão (ex.: posicionamento no layout). */
  className?: string;
}

export function ThemeIconToggle({ className }: ThemeIconToggleProps = {}) {
  const { setPreference: setThemePreference } = useTheme();
  const effectiveTheme = useEffectiveTheme();

  return (
    <button
      type="button"
      className={className ? `${styles.toggle} ${className}` : styles.toggle}
      aria-label={EFFECTIVE_THEME_LABEL[effectiveTheme]}
      title={EFFECTIVE_THEME_LABEL[effectiveTheme]}
      onClick={() => setThemePreference(NEXT_EXPLICIT_THEME[effectiveTheme])}
    >
      <Icon name={EFFECTIVE_THEME_ICON[effectiveTheme]} aria-hidden="true" />
    </button>
  );
}