"use client";

import { useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icon";

import { IAssistantMessage } from "@/features/assistant/domain";

import styles from "./widget.module.css";

type Mood = "idle" | "speaking" | "warning" | "celebrating";

function moodFor(message: IAssistantMessage | null): Mood {
  if (!message) return "idle";
  if (message.tone === "warning") return "warning";
  if (message.tone === "success") return "celebrating";
  return "speaking";
}

const MOOD_EMOJI: Record<Mood, string> = {
  idle: "🙂",
  speaking: "💡",
  warning: "⚠️",
  celebrating: "🎉",
};

interface WidgetProps {
  initialMessage: IAssistantMessage | null;
  reducedPresence: boolean;
}

const DISMISSED_KEY = "assistant-dismissed-message";

// `sessionStorage` não existe durante o render no servidor —
// `useSyncExternalStore` (não `useEffect` + `setState`) é o jeito de ler
// isso sem arriscar mismatch de hidratação, mesmo padrão de
// `design-system/theme/use-theme.ts`.
function subscribeNoop() {
  return () => {};
}

function getDismissedSnapshot(): string | null {
  try {
    return sessionStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

function getDismissedServerSnapshot(): string | null {
  return null;
}

/**
 * Presença discreta do JARVIS: um avatar fixo no canto, que abre um balão
 * de fala quando há uma mensagem contextual. Nunca interrompe sozinho -
 * o balão só some quando o usuário clica em fechar, e com presença
 * reduzida o balão nem abre automaticamente (fica só o avatar).
 *
 * `initialMessage` vem de nova busca no servidor a cada
 * `router.refresh()` (chamado por praticamente toda ação do app) —
 * `dismissedText` (via `sessionStorage`) garante que a MESMA mensagem já
 * dispensada não reapareça sozinha se o componente remontar antes do
 * servidor gerar uma mensagem realmente nova. `manuallyToggled` é a
 * abertura/fechamento manual pelo avatar, que sempre pode sobrepor essa
 * regra (mesmo com presença reduzida ou mensagem já dispensada).
 */
export function Widget({ initialMessage, reducedPresence }: WidgetProps) {
  const [message, setMessage] = useState(initialMessage);
  const [manuallyToggled, setManuallyToggled] = useState<boolean | null>(null);

  const dismissedText = useSyncExternalStore(
    subscribeNoop,
    getDismissedSnapshot,
    getDismissedServerSnapshot
  );

  const autoOpen = !!message && message.text !== dismissedText && !reducedPresence;
  const isOpen = manuallyToggled ?? autoOpen;
  const mood = moodFor(message);

  function handleAvatarClick() {
    if (!message) return;

    setManuallyToggled(!isOpen);
  }

  function handleDismiss() {
    if (message) {
      try {
        sessionStorage.setItem(DISMISSED_KEY, message.text);
      } catch {
        // sessionStorage indisponível (modo privado etc.) — o dismiss desta
        // sessão de render continua funcionando, só não sobrevive a um
        // remount do componente.
      }
    }

    setMessage(null);
    setManuallyToggled(null);
  }

  return (
    <div className={styles.wrapper}>
      {isOpen && message && (
        <div className={styles.bubble} role="status">
          <p className={styles.bubbleText}>{message.text}</p>
          <button
            type="button"
            className={styles.dismiss}
            aria-label="Dispensar mensagem do assistente"
            onClick={handleDismiss}
          >
            <Icon name="MdClose" aria-hidden="true" />
          </button>
        </div>
      )}

      <button
        type="button"
        className={styles.avatar}
        data-mood={mood}
        aria-label={
          isOpen ? "Fechar mensagem do JARVIS" : "Abrir mensagem do JARVIS"
        }
        aria-expanded={isOpen}
        onClick={handleAvatarClick}
      >
        <span aria-hidden="true">{MOOD_EMOJI[mood]}</span>
        {!isOpen && message && (
          <span className={styles.pingDot} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
