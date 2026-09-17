"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components";
import { Icon } from "@/components/icon";

import { IAssistantMessage } from "@/features/assistant/domain";
import { IMascotState } from "@/features/focus/domain";
import { useSpeak } from "@/lib/speak-text";

import styles from "./styles.module.css";

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

interface WidgetProps {
  initialMessage: IAssistantMessage | null;
  reducedPresence: boolean;
  // Mesmo personagem do Focus (nome/espécie/voz) — o widget do
  // assistente É o mascote, não um segundo bichinho à parte.
  mascot: IMascotState;
}

const DISMISSED_KEY = "assistant-dismissed-message";

// Mostrado quando não há mensagem contextual nenhuma - sem isso, clicar
// no avatar sem mensagem pendente não fazia NADA (`if (!message) return`),
// o que lia como o botão estar quebrado (achado relatado: "eu clico nao
// faz nada"). O avatar sempre responde ao clique agora.
const FALLBACK_TEXT = "Sem novidades por agora. Continue assim!";

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

// Mesmo breakpoint mobile documentado em `tokens.css`. Abrir o balão
// SOZINHO numa tela pequena não tem como respeitar o conteúdo por trás -
// diferente do desktop, onde sempre sobra espaço, no celular o balão
// (mesmo com o teto de altura de `.bubble`) cobria campos e botões de
// verdade (ex.: "Registrar" no Ciclo, "Concluir agora"/"Cancelar" no
// Foco com sessão ativa) - achado em auditoria visual mobile. O aviso de
// mensagem nova continua existindo (`pingDot`) e o avatar sempre responde
// ao toque - só a abertura AUTOMÁTICA fica reservada pro desktop.
const MOBILE_QUERY = "(max-width: 640px)";

function subscribeToMobileQuery(callback: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getIsMobileSnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getIsMobileServerSnapshot(): boolean {
  return false;
}

/**
 * Presença discreta do JARVIS: um avatar fixo no canto, que abre um balão
 * de fala quando há uma mensagem contextual. Nunca interrompe sozinho -
 * o balão só some quando o usuário clica em fechar, e com presença
 * reduzida OU numa tela pequena (`isMobile`) o balão nem abre
 * automaticamente (fica só o avatar com o `pingDot` avisando que tem
 * mensagem nova) - no celular não sobra espaço garantido pra abrir por
 * cima de conteúdo sem cobrir algo de verdade.
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
  const pathname = usePathname();
  const [message, setMessage] = useState(initialMessage);
  const [manuallyToggled, setManuallyToggled] = useState<boolean | null>(null);
  const { isSpeaking, speak: handleSpeak } = useSpeak();

  const dismissedText = useSyncExternalStore(
    subscribeNoop,
    getDismissedSnapshot,
    getDismissedServerSnapshot,
  );
  const isMobile = useSyncExternalStore(
    subscribeToMobileQuery,
    getIsMobileSnapshot,
    getIsMobileServerSnapshot,
  );

  const autoOpen =
    !!message && message.text !== dismissedText && !reducedPresence && !isMobile;
  const isOpen = manuallyToggled ?? autoOpen;
  const mood = moodFor(message);
  const displayText = message?.text ?? FALLBACK_TEXT;

  // Sempre responde ao clique, com mensagem pendente ou não - antes,
  // sem mensagem, clicar não fazia nada (achado relatado). Sem
  // mensagem de verdade, o balão mostra `FALLBACK_TEXT` em vez de ficar
  // vazio.
  function handleAvatarClick() {
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

  // O Foco já tem seu próprio balão do mesmo mascote, contextualizado pro
  // que está acontecendo ali (`features/focus/components/mascot`) - os
  // dois juntos mostravam falas quase idênticas ao mesmo tempo, competindo
  // por atenção sem agregar nada (achado em auditoria visual). Mesmo
  // padrão de `FocusMiniWidget`, que já se esconde nessa rota pelo mesmo
  // motivo (o painel de Foco já mostra tudo que ele mostraria).
  if (pathname?.startsWith("/home/focus")) return null;

  return (
    <div className={styles.wrapper}>
      {isOpen && (
        <div className={styles.bubble} role="status">
          <p className={styles.bubbleName}>{mascot.name}</p>
          <p className={styles.bubbleText}>{displayText}</p>

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
                onClick: () => handleSpeak(displayText),
              }}
            />
          </div>

          <button
            type="button"
            className={styles.dismiss}
            aria-label={message ? "Dispensar mensagem do assistente" : "Fechar"}
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
        {/* Ícone neutro, sem nenhuma ligação com o mascote/bicho - nem
            sprite (nunca ficava bom, achado relatado várias vezes) nem
            emoji do bicho (pedido explícito: "eu falei que não queria
            [o mascote na bolha]"). Só comunica "isto abre uma
            mensagem", que é literalmente o que o botão faz. */}
        <Icon name="FaCommentDots" aria-hidden="true" className={styles.avatarIcon} />
        {!isOpen && message && (
          <span className={styles.pingDot} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
