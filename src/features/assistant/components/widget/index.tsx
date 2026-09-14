"use client";

import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components";
import { Icon } from "@/components/icon";

import { IAssistantMessage } from "@/features/assistant/domain";
import { IMascotState } from "@/features/focus/domain";
import { MascotPreview, characterIdForSpecies, MASCOT_CHARACTERS } from "@/features/mascot-pet";
import { MascotStateName } from "@/features/mascot-pet/domain/types";
import { useSpeak } from "@/lib/speak-text";

import styles from "./widget.module.css";

// Tamanho que o bichinho deve OCUPAR dentro do avatar circular (px, no
// espaço do próprio atlas) - calculado por personagem a partir do
// próprio tamanho de exibição dele (`displayWidth`/`frameWidth`), em vez
// de um `scale` fixo pra todos. Um `scale` único quebrava (acabou de
// acontecer, achado relatado: "a bolinha tá feia") assim que qualquer
// personagem mudasse de tamanho de exibição - os 6 mascotes novos, bem
// maiores que os originais, transbordavam pra fora do círculo pequeno.
const AVATAR_CREATURE_TARGET_PX = 34;

function scaleForAvatar(characterId: string | null): number {
  const character = characterId ? MASCOT_CHARACTERS[characterId] : undefined;
  if (!character) return 0.3;

  const nativeSize = character.displayWidth ?? character.frameWidth;
  return AVATAR_CREATURE_TARGET_PX / nativeSize;
}

type Mood = "idle" | "speaking" | "warning" | "celebrating";

function moodFor(message: IAssistantMessage | null): Mood {
  if (!message) return "idle";

  const messages: Record<IAssistantMessage["tone"], Mood> = {
    warning: "warning",
    success: "celebrating",
    info: "speaking",
  };

  return messages[message.tone];
}

// O avatar só tem 2 poses (não 4 como o widget) — "celebrating" usa a
// pose feliz, o resto fica na pose parada.
function creatureStateFor(mood: Mood): MascotStateName {
  return mood === "celebrating" ? "happy" : "idle";
}

interface WidgetProps {
  initialMessage: IAssistantMessage | null;
  reducedPresence: boolean;
  // Mesmo personagem do Focus (nome/espécie/voz) — o widget do
  // assistente É o mascote, não um segundo bichinho à parte.
  mascot: IMascotState;
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
export function Widget({
  initialMessage,
  reducedPresence,
  mascot,
}: WidgetProps) {
  const [message, setMessage] = useState(initialMessage);
  const [manuallyToggled, setManuallyToggled] = useState<boolean | null>(null);
  const { isSpeaking, speak: handleSpeak } = useSpeak();

  const dismissedText = useSyncExternalStore(
    subscribeNoop,
    getDismissedSnapshot,
    getDismissedServerSnapshot,
  );

  const autoOpen =
    !!message && message.text !== dismissedText && !reducedPresence;
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
          <p className={styles.bubbleName}>{mascot.name}</p>
          <p className={styles.bubbleText}>{message.text}</p>

          <div className={styles.bubbleActions}>
            <Button.Preset
              icon={{
                name: "FaVolumeUp",
                className: isSpeaking ? styles.speakingIcon : undefined,
              }}
              root={{
                tone: "muted",
                "aria-label": isSpeaking ? "Falando" : `Ouvir ${mascot.name}`,
                disabled: isSpeaking,
                onClick: () => handleSpeak(message.text),
              }}
            />
          </div>

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
          isOpen
            ? `Fechar mensagem de ${mascot.name}`
            : `Abrir mensagem de ${mascot.name}`
        }
        aria-expanded={isOpen}
        onClick={handleAvatarClick}
      >
        <MascotPreview
          characterId={characterIdForSpecies(mascot.species)}
          state={creatureStateFor(mood)}
          scale={scaleForAvatar(characterIdForSpecies(mascot.species))}
        />
        {!isOpen && message && (
          <span className={styles.pingDot} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
