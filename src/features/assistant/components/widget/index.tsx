"use client";

import { useState } from "react";
import { MdClose } from "react-icons/md";

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

/**
 * Presença discreta do JARVIS: um avatar fixo no canto, que abre um balão
 * de fala quando há uma mensagem contextual. Nunca interrompe sozinho -
 * o balão só some quando o usuário clica em fechar, e com presença
 * reduzida o balão nem abre automaticamente (fica só o avatar).
 */
export function Widget({ initialMessage, reducedPresence }: WidgetProps) {
  const [message, setMessage] = useState(initialMessage);
  const [isOpen, setIsOpen] = useState(!reducedPresence && !!initialMessage);

  const mood = moodFor(message);

  function handleAvatarClick() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    if (message) setIsOpen(true);
  }

  function handleDismiss() {
    setIsOpen(false);
    setMessage(null);
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
            <MdClose aria-hidden="true" />
          </button>
        </div>
      )}

      <button
        type="button"
        className={styles.avatar}
        data-mood={mood}
        aria-label={isOpen ? "Fechar mensagem do JARVIS" : "Abrir mensagem do JARVIS"}
        aria-expanded={isOpen}
        onClick={handleAvatarClick}
      >
        <span aria-hidden="true">{MOOD_EMOJI[mood]}</span>
        {!isOpen && message && <span className={styles.pingDot} aria-hidden="true" />}
      </button>
    </div>
  );
}
