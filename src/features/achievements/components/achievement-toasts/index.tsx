"use client";

import { useEffect, useRef } from "react";

import { useToast } from "@/providers/toast-context";
import { AchievementView } from "@/features/achievements/get-achievements-status";

/** Dispara um toast pra cada conquista que acabou de ser desbloqueada
 * nesta carga do Dashboard. `hasFiredRef` evita disparar de novo num
 * re-render (ex.: troca de tema, foco de janela) sem mudar a lista. */
export function AchievementToasts({ items }: { items: AchievementView[] }) {
  const { showToast } = useToast();
  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (hasFiredRef.current || items.length === 0) return;
    hasFiredRef.current = true;

    for (const achievement of items) {
      showToast(`🏆 Conquista desbloqueada: ${achievement.name}`);
    }
  }, [items, showToast]);

  return null;
}
