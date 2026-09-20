"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components";
import { Icon } from "@/components/icon";

import { IAssistantMessage } from "@/features/assistant/domain";
import { IMascotState } from "@/features/focus/domain";
import type { IExecutionSession } from "@/features/execution-companion/domain/types";
import { sendAssistantMessage } from "@/features/mascot-pet/actions";
import { confirmAndExecuteAction } from "@/features/execution-companion/actions/propose-action";
import type { ActionProposal } from "@/features/execution-companion/services/action-executor";
import { useSpeak } from "@/lib/speak-text";
import { useChatHistory } from "../../hooks/use-chat-history";

import styles from "./styles.module.css";

type Mood = "idle" | "speaking" | "warning" | "celebrating";

function moodFor(message: IAssistantMessage | null, hasExecution: boolean): Mood {
  if (hasExecution) return "speaking";
  if (!message) return "idle";

  const messages: Record<IAssistantMessage["tone"], Mood> = {
    warning: "warning",
    success: "celebrating",
    info: "speaking",
  };

  return messages[message.tone];
}

const ACTION_LABELS: Record<string, string> = {
  "task.create": "Criar tarefa",
  "task.complete": "Concluir tarefa",
  "task.updateDueDate": "Mudar prazo",
  "task.addStep": "Adicionar passo",
  "task.startExecution": "Iniciar acompanhamento",
};

const RISK_LABELS: Record<string, string> = {
  low: "baixo",
  medium: "médio",
  high: "alto",
};

interface WidgetProps {
  initialMessage: IAssistantMessage | null;
  reducedPresence: boolean;
  mascot: IMascotState;
  executionSession: IExecutionSession | null;
  executionTaskTitle: string | null;
}

const DISMISSED_KEY = "assistant-dismissed-message";

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

function getExecutionText(
  executionSession: IExecutionSession,
  taskTitle: string | null,
): string {
  const title = taskTitle ?? "sua tarefa";
  if (executionSession.status === "paused") {
    return `Você estava fazendo: ${title}. Quando quiser voltar, é só clicar.`;
  }
  return `Você está fazendo: ${title}. Continue quando quiser.`;
}

export function Widget({
  initialMessage,
  reducedPresence,
  mascot,
  executionSession,
  executionTaskTitle,
}: WidgetProps) {
  const pathname = usePathname();
  const [message, setMessage] = useState(initialMessage);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [manuallyToggled, setManuallyToggled] = useState<boolean | null>(null);
  const [pendingProposal, setPendingProposal] = useState<ActionProposal | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const { isSpeaking, speak: handleSpeak } = useSpeak();
  const { messages, addUserMessage, addMascotMessage, clearHistory, hydrated } = useChatHistory();
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  const hasExecution = !!executionSession;
  const executionText = hasExecution
    ? getExecutionText(executionSession, executionTaskTitle)
    : null;

  const initialText = executionText ?? message?.text ?? null;
  const hasChatHistory = hydrated && messages.length > 0;

  const autoOpen =
    (!!initialText || hasChatHistory) && initialText !== dismissedText && !reducedPresence && !isMobile;
  const isOpen = manuallyToggled ?? autoOpen;
  const mood = moodFor(message, hasExecution);

  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages.length, pendingProposal]);

  function handleAvatarClick() {
    setManuallyToggled(!isOpen);
  }

  function handleDismiss() {
    if (initialText) {
      try {
        sessionStorage.setItem(DISMISSED_KEY, initialText);
      } catch {
      }
    }

    setMessage(null);
    setManuallyToggled(null);
  }

  async function handleSendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    setChatLoading(true);
    setChatInput("");
    addUserMessage(text);

    try {
      // UMA chamada server-side — interpreta ação E gera resposta
      const result = await sendAssistantMessage(text);

      if (result.proposal) {
        // Gemini detectou uma ação controlada
        setPendingProposal(result.proposal);
      } else if (result.message) {
        // Resposta de chat (Gemini ou fallback context-aware)
        addMascotMessage(result.message);
        setMessage(null);
      }
    } catch {
      addMascotMessage("Algo deu errado. Tenta de novo.");
    } finally {
      setChatLoading(false);
    }
  }

  async function handleConfirmAction() {
    if (!pendingProposal) return;

    setProposalLoading(true);
    try {
      const result = await confirmAndExecuteAction({
        action: pendingProposal.action,
        params: pendingProposal.params,
      });

      if (result.error) {
        addMascotMessage(`Não consegui: ${result.error}`);
      } else {
        const label = ACTION_LABELS[pendingProposal.action] ?? pendingProposal.action;
        addMascotMessage(`${label} feito!`);
      }
    } catch {
      addMascotMessage("Algo deu errado ao executar. Tenta de novo.");
    } finally {
      setPendingProposal(null);
      setProposalLoading(false);
      setMessage(null);
    }
  }

  function handleRejectAction() {
    setPendingProposal(null);
    addMascotMessage("Tá, cancelei. O que mais?");
  }

  function handleChatKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  }

  if (pathname?.startsWith("/home/focus")) return null;

  return (
    <div className={styles.wrapper}>
      {isOpen && (
        <div className={styles.bubble}>
          <div className={styles.bubbleHeader}>
            <p className={styles.bubbleName}>{mascot.name}</p>
            {hasChatHistory && (
              <button
                type="button"
                className={styles.clearChat}
                onClick={clearHistory}
                aria-label="Limpar conversa"
              >
                <Icon name="FaTrash" aria-hidden="true" size={10} />
              </button>
            )}
          </div>

          <div className={styles.chatArea}>
            {!hasChatHistory && initialText && (
              <div className={styles.chatMsg} data-role="mascot">
                <p>{initialText}</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={styles.chatMsg} data-role={msg.role}>
                <p>{msg.text}</p>
              </div>
            ))}

            {pendingProposal && (
              <div className={styles.proposalCard}>
                <div className={styles.proposalHeader}>
                  <Icon name="FaBolt" aria-hidden="true" size={12} />
                  <span className={styles.proposalAction}>
                    {ACTION_LABELS[pendingProposal.action] ?? pendingProposal.action}
                  </span>
                </div>
                <p className={styles.proposalRisk}>
                  Risco: {RISK_LABELS[pendingProposal.risk] ?? pendingProposal.risk}
                </p>
                <div className={styles.proposalActions}>
                  <Button.Preset
                    root={{
                      tone: "highlight",
                      disabled: proposalLoading,
                      onClick: handleConfirmAction,
                    }}
                    text={{ children: proposalLoading ? "Executando..." : "Confirmar" }}
                  />
                  <Button.Preset
                    root={{
                      tone: "muted",
                      disabled: proposalLoading,
                      onClick: handleRejectAction,
                    }}
                    text={{ children: "Cancelar" }}
                  />
                </div>
              </div>
            )}

            {chatLoading && !pendingProposal && (
              <div className={styles.chatMsg} data-role="mascot">
                <p className={styles.typing}>digitando...</p>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className={styles.chatActions}>
            {!hasChatHistory && initialText && (
              <Button.Preset
                icon={{
                  name: "FaVolumeUp",
                  className: isSpeaking ? styles.speakingIcon : undefined,
                }}
                root={{
                  tone: "muted",
                  "aria-label": isSpeaking ? "Falando" : `Ouvir ${mascot.name}`,
                  disabled: isSpeaking,
                  onClick: () => handleSpeak(initialText),
                }}
              />
            )}
          </div>

          <div className={styles.chatInput}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder={`Fala com ${mascot.name}...`}
              disabled={chatLoading}
              className={styles.chatField}
            />
            <Button.Preset
              icon={{ name: "FaPaperPlane" }}
              root={{
                tone: "muted",
                "aria-label": "Enviar mensagem",
                disabled: chatLoading || !chatInput.trim(),
                onClick: handleSendChat,
              }}
            />
          </div>

          <button
            type="button"
            className={styles.dismiss}
            aria-label="Fechar"
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
        <Icon name="FaCommentDots" aria-hidden="true" className={styles.avatarIcon} />
        {!isOpen && (initialText || hasChatHistory) && (
          <span className={styles.pingDot} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
