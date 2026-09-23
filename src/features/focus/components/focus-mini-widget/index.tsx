"use client";

import { usePathname } from "next/navigation";

import { Button } from "@/components";
import { Icon } from "@/components/icon";
import { EXTEND_PRESETS_MINUTES } from "@/features/focus/extend-presets";
import { useFocusSession } from "@/features/focus/focus-session-context";
import { formatClock } from "@/features/focus/format-clock";

import styles from "./styles.module.css";

/**
 * Versão compacta do timer de foco, visível em QUALQUER página de
 * `/home/*` enquanto uma sessão está rodando (pedido explícito: "queria
 * que o foco ficasse visível em todas as páginas") - some sozinho sem
 * sessão ativa, e também em `/home/focus` (o painel completo, `Timer`,
 * já mostra tudo isso ali - mostrar os dois juntos seria redundante).
 * Consome o MESMO `FocusSessionProvider` que o `Timer` - nunca um
 * segundo relógio independente (ver comentário em
 * `focus-session-context.tsx`).
 */
export function FocusMiniWidget() {
  const pathname = usePathname();
  const { session, remaining, isBusy, pendingAction, complete, cancel, extend } = useFocusSession();

  if (!session || pathname?.startsWith("/home/focus")) return null;

  return (
    <div className={styles.wrapper} role="status" aria-label="Sessão de foco em andamento">
      <div className={styles.clockRow}>
        <Icon name="MdTimer" aria-hidden="true" />
        <span className={styles.clock}>{formatClock(remaining)}</span>
      </div>

      <div className={styles.extendRow}>
        {EXTEND_PRESETS_MINUTES.map((minutes) => (
          <button
            key={minutes}
            type="button"
            className={styles.extendChip}
            disabled={isBusy}
            aria-label={`Adicionar ${minutes} minutos à sessão de foco`}
            onClick={() => extend(minutes * 60)}
          >
            +{minutes}
          </button>
        ))}
      </div>

      <div className={styles.actions}>
        <Button.Preset
          icon={{ name: "FaCheck" }}
          root={{
            tone: "highlight",
            "aria-label": "Concluir foco agora",
            disabled: isBusy,
            loading: pendingAction === "complete",
            onClick: () => complete(),
          }}
        />
        <Button.Preset
          icon={{ name: "MdClose" }}
          root={{
            tone: "danger",
            "aria-label": "Cancelar sessão de foco",
            disabled: isBusy,
            loading: pendingAction === "cancel",
            onClick: () => cancel(),
          }}
        />
      </div>
    </div>
  );
}
