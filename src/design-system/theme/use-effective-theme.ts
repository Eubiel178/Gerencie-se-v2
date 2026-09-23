"use client";

import { useSyncExternalStore } from "react";

import { useTheme } from "./use-theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribe(callback: () => void) {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getSystemIsDarkSnapshot(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

// Servidor nunca sabe a preferência de SO do dispositivo - mesmo padrão
// já usado em `ReplayTourButton` (`getIsMobileServerSnapshot`): um valor
// fixo aqui, reconciliado pro valor real do cliente no mesmo commit da
// hidratação via `useSyncExternalStore`, nunca um segundo efeito
// separado que causaria flash.
function getSystemIsDarkServerSnapshot(): boolean {
  return false;
}

/**
 * Tema efetivamente RENDERIZADO agora ("light"/"dark"), nunca "system" -
 * diferente de `useTheme().preference`, que pode ser "system" sem dizer
 * qual dos dois está de fato na tela. Usado pelo botão de tema do
 * cabeçalho (`Header`), que alterna só entre claro/escuro - "Sistema"
 * continua existindo, mas só como opção em Configurações (`ThemeToggle`).
 *
 * Quando `preference` é explícito (light/dark), o valor é ele mesmo -
 * `prefers-color-scheme` do SO não importa nesse caso (ver `tokens.css`:
 * `data-theme` explícito sempre vence o `@media`). Só quando `preference`
 * é "system" que o SO decide, e é isso que este hook detecta.
 */
export function useEffectiveTheme(): "light" | "dark" {
  const { preference } = useTheme();
  const systemIsDark = useSyncExternalStore(
    subscribe,
    getSystemIsDarkSnapshot,
    getSystemIsDarkServerSnapshot,
  );

  if (preference !== "system") return preference;
  return systemIsDark ? "dark" : "light";
}
