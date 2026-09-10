"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "gerencie-se:theme";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): ThemePreference {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

function getServerSnapshot(): ThemePreference {
  return "system";
}

/**
 * Estado do tema escolhido pelo usuário (ou "system", o padrão). Usa
 * `useSyncExternalStore` (não `useEffect` + `useState`) porque a fonte da
 * verdade é externa ao React (`localStorage`) e indisponível durante o
 * render no servidor — é exatamente o caso que essa API resolve sem
 * arriscar um mismatch de hidratação.
 */
export function useTheme() {
  const preference = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setPreference = useCallback((next: ThemePreference) => {
    if (next === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
      document.documentElement.removeAttribute("data-theme");
    } else {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.setAttribute("data-theme", next);
    }

    // `localStorage.setItem` só dispara "storage" em OUTRAS abas — disparamos
    // manualmente para esta aba re-ler o snapshot imediatamente.
    window.dispatchEvent(new StorageEvent("storage"));
  }, []);

  return { preference, setPreference };
}
