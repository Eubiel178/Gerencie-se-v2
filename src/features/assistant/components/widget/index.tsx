"use client";

import { useState, useEffect, useMemo, useRef, useSyncExternalStore, useCallback } from "react";

import Image from "next/image";
import { usePathname } from "next/navigation";

import { Button, Modal, ModalHeader } from "@/components";
import { Icon } from "@/components/icon";
import { IAssistantMessage } from "@/features/assistant/domain";
import { confirmAndExecuteAction } from "@/features/execution-companion/actions/propose-action";
import type { IExecutionSession } from "@/features/execution-companion/domain/types";
import type { ActionProposal } from "@/features/execution-companion/services/action-executor";
import { IMascotState } from "@/features/focus/domain";
import { mascotAvatarUrl } from "@/features/mascot-pet";
import { sendAssistantMessage } from "@/features/mascot-pet/actions";
import { useSpeak } from "@/lib/speech/speak-text";
import { formatTimeOnly } from "@/utils/date";

import { buildRecentHistory } from "../../hooks/build-recent-history";
import { resolveConversationTaskId } from "../../hooks/resolve-conversation-task-id";
import { useChatHistory } from "../../hooks/use-chat-history";
import { useWidgetSeedRequest } from "../../hooks/use-widget-open-request";
import { playMessageReceivedSound, playMessageSentSound } from "../../lib/chat-sound";

import { CompanionMarkdown } from "./companion-markdown";
import { groupMessagesByDay } from "./group-messages-by-day";
import styles from "./styles.module.css";

type Mood = "idle" | "speaking" | "warning" | "celebrating";

function moodFor(
  message: IAssistantMessage | null,
  hasExecution: boolean,
): Mood {
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
  userImage: string | null;
}

const DISMISSED_KEY = "assistant-dismissed-message";
const WAS_CLOSED_KEY = "assistant-was-closed";

// Teto pro estado de "enviando" no cliente — independe de qualquer timeout
// do lado do servidor (ver gemini-client.ts), cobre também o caso de algo
// travar ANTES de chegar no provider de IA (ex.: consulta ao banco na
// própria server action). Sem isso, `chatLoading` pode ficar `true` pra
// sempre e o usuário fica sem poder mandar outra mensagem.
const CHAT_TIMEOUT_MS = 35_000;
const TIMEOUT_ERROR_MESSAGE = "assistant-chat-timeout";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(TIMEOUT_ERROR_MESSAGE)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

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
  userImage,
}: WidgetProps) {
const pathname = usePathname();
  const [message, setMessage] = useState(initialMessage);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [manuallyToggled, setManuallyToggled] = useState<boolean | null>(null);
  const [pendingProposal, setPendingProposal] = useState<ActionProposal | null>(
    null,
  );
  const [proposalLoading, setProposalLoading] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const { isSpeaking, speak: handleSpeak } = useSpeak();
  const { messages, addUserMessage, addMascotMessage, clearHistory, hydrated } =
    useChatHistory();
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Incrementado a cada envio/retry — deixa uma resposta atrasada (ou o
  // timeout) de uma requisição antiga identificável e ignorável se uma
  // mais nova já estiver em andamento.
  const chatRequestIdRef = useRef(0);
  const [hasManuallyClosed, setHasManuallyClosed] = useState(() => {
    try {
      return sessionStorage.getItem(WAS_CLOSED_KEY) === "1";
    } catch {
      return false;
    }
  });

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
    hydrated &&
    (!!initialText || hasChatHistory) &&
    initialText !== dismissedText &&
    !hasManuallyClosed &&
    !reducedPresence &&
    !isMobile;
  const isOpen = manuallyToggled ?? autoOpen;
  const mood = moodFor(message, hasExecution);

  const mascotAvatar = mascotAvatarUrl(mascot.species);

  const groupedMessages = useMemo(() => groupMessagesByDay(messages), [messages]);

  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    // `chatLoading` entra aqui pro retry (que não muda `messages.length`
    // antes do indicador "pensando" aparecer) também rolar até o fim.
  }, [isOpen, messages.length, pendingProposal, chatLoading]);

  // Bolinha verde + sonzinho de "chegou mensagem" - funciona com o balão
  // FECHADO de propósito (pedido explícito): a pessoa não devia precisar
  // deixar o chat aberto pra saber que uma resposta chegou. Só conta
  // mensagem NOVA do MASCOTE (nunca a própria mensagem que o usuário
  // acabou de mandar, isso já tem o som de "enviar" em `handleSendChat`).
  //
  // `messages` vem de `useSyncExternalStore` (histórico compartilhado em
  // `useChatHistory`) - sincronizar ESTADO LOCAL a partir da mudança de
  // uma store externa é exatamente o caso legítimo de `useEffect` +
  // `setState` que a própria doc do React descreve; o eslint-disable
  // aqui é deliberado, não um jeito de ignorar a regra por preguiça.
  const seenMessageCountRef = useRef(messages.length);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) setHasUnread(false);
  }, [isOpen]);

  useEffect(() => {
    if (messages.length <= seenMessageCountRef.current) return;
    const newMessages = messages.slice(seenMessageCountRef.current);
    seenMessageCountRef.current = messages.length;

    if (newMessages.some((m) => m.role === "mascot")) {
      playMessageReceivedSound();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!isOpen) setHasUnread(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  function handleAvatarClick() {
    if (!isOpen) {
      setHasManuallyClosed(false);
      try {
        sessionStorage.removeItem(WAS_CLOSED_KEY);
      } catch {}
    }
    setManuallyToggled(!isOpen);
  }

  function handleDismiss() {
    if (initialText) {
      try {
        sessionStorage.setItem(DISMISSED_KEY, initialText);
      } catch {}
    }

    setHasManuallyClosed(true);
    try {
      sessionStorage.setItem(WAS_CLOSED_KEY, "1");
    } catch {}

    setMessage(null);
    setManuallyToggled(null);
  }

  /**
   * Faz a chamada em si (sem mexer no input nem adicionar a mensagem do
   * usuário) — usado tanto pelo envio normal quanto pelo "Tentar
   * novamente", que reenvia o MESMO texto que falhou sem duplicar a bolha
   * do usuário na tela.
   */
  async function sendToAssistant(text: string, taskId: string | null) {
    const requestId = ++chatRequestIdRef.current;
    setChatLoading(true);

    try {
      const recentHistory = buildRecentHistory(messages);

      // O fuso do USUÁRIO viaja junto: "hoje"/"amanhã"/atrasado são
      // classificados nele no servidor (nunca no UTC do servidor), igual
      // ao card de tarefas que roda no navegador dele.
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // UMA chamada server-side — gera resposta com contexto. Limitada no
      // cliente pra nunca deixar o loading preso indefinidamente, mesmo se
      // a chamada travar antes de chegar no Gemini (ex.: consulta ao banco).
      const result = await withTimeout(
        sendAssistantMessage(text, recentHistory, taskId, userTimeZone),
        CHAT_TIMEOUT_MS
      );

      // Uma resposta mais antiga chegando depois de outra mais nova (ou
      // depois do timeout já ter mostrado erro) não deve mais mexer no
      // estado - só a última requisição em andamento tem permissão.
      if (chatRequestIdRef.current !== requestId) return;

      if (result.proposal) {
        // Gemini detectou uma ação controlada
        setPendingProposal(result.proposal);
      } else if (result.messages.length > 0) {
        // Resposta de chat (Gemini ou fallback context-aware) - normalmente
        // UMA bolha, raramente 2-3 "beats" da MESMA resposta (ver
        // `splitIntoConversationBeats` em `mascot-pet/actions.ts`). Cada
        // uma vira sua própria `ChatMessage` no histórico - persiste e
        // reabre exatamente como foi mostrada, sem juntar tudo numa só.
        // `kind` acompanha `result.source` (marca fallback como tal, nunca
        // como "ai" - ver o filtro de `recentHistory` acima).
        for (const beat of result.messages) {
          addMascotMessage(beat, taskId, result.source ?? "fallback");
        }
        setMessage(null);
      }
    } catch (error) {
      if (chatRequestIdRef.current !== requestId) return;
      const isTimeout = error instanceof Error && error.message === TIMEOUT_ERROR_MESSAGE;
      addMascotMessage(
        `${isTimeout ? "Isso tá demorando mais que o esperado." : "Algo deu errado."} Tenta de novo.`,
        taskId,
        "error"
      );
    } finally {
      if (chatRequestIdRef.current === requestId) setChatLoading(false);
    }
  }

  // Pedido de fora do Widget (ver `use-widget-open-request.ts`) pra abrir
  // e mandar uma mensagem com contexto real - hoje só usado por "Me
  // ajuda" numa oferta espontânea do Companion. Reaproveita o MESMO
  // `sendToAssistant` do envio normal (nunca duplica a lógica de rede/
  // timeout), então o comportamento (erro, retry, timeout) é idêntico a
  // digitar a mensagem à mão.
  const seedRequest = useWidgetSeedRequest();
  const handledSeedIdRef = useRef(0);
  useEffect(() => {
    if (!seedRequest || seedRequest.id <= handledSeedIdRef.current) return;
    handledSeedIdRef.current = seedRequest.id;

    setHasManuallyClosed(false);
    try {
      sessionStorage.removeItem(WAS_CLOSED_KEY);
    } catch {}
    setManuallyToggled(true);

    addUserMessage(seedRequest.text, seedRequest.taskId);
    playMessageSentSound();
    sendToAssistant(seedRequest.text, seedRequest.taskId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedRequest]);

  async function handleSendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    // Tarefa em execução AGORA — mesma fonte que o cabeçalho "Acompanhando: X"
    // usa (`executionSession`), nunca um valor guardado de um render antigo.
    // Sem sessão ativa, cai pro foco que a PRÓPRIA conversa já estabeleceu
    // (ex.: "Me ajuda" clicado numa tarefa específica) - achado real: sem
    // isto, uma pergunta de acompanhamento como "divide em passos" perdia
    // de vista a tarefa assim que não havia sessão ativa, virando um chat
    // genérico mesmo o usuário tendo acabado de pedir ajuda com uma tarefa
    // concreta.
    const currentTaskId = executionSession?.taskId ?? resolveConversationTaskId(messages);

    setChatInput("");
    addUserMessage(text, currentTaskId);
    playMessageSentSound();
    await sendToAssistant(text, currentTaskId);
  }

  function handleRetry(text: string, taskId: string | null) {
    if (chatLoading) return;
    sendToAssistant(text, taskId);
  }

  async function handleConfirmAction() {
    if (!pendingProposal) return;

    const currentTaskId = executionSession?.taskId ?? null;
    setProposalLoading(true);
    try {
      const result = await confirmAndExecuteAction({
        action: pendingProposal.action,
        params: pendingProposal.params,
      });

      // Confirmações de ação executada são texto fixo local, não geração
      // de IA - mesmo raciocínio de `result.source` em `sendToAssistant`:
      // nunca deveriam voltar como "histórico" numa chamada futura.
      if (result.error) {
        addMascotMessage(`Não consegui: ${result.error}`, currentTaskId, "fallback");
      } else {
        const label =
          ACTION_LABELS[pendingProposal.action] ?? pendingProposal.action;
        addMascotMessage(`${label} feito!`, currentTaskId, "fallback");
      }
    } catch {
      addMascotMessage("Algo deu errado ao executar. Tenta de novo.", currentTaskId, "error");
    } finally {
      setPendingProposal(null);
      setProposalLoading(false);
      setMessage(null);
    }
  }

  function handleRejectAction() {
    setPendingProposal(null);
    addMascotMessage("Tá, cancelei. O que mais?", executionSession?.taskId ?? null, "fallback");
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
            <div className={styles.bubbleHeaderIdentity}>
              {mascotAvatar && (
                <span className={styles.headerAvatarFrame}>
                  <Image src={mascotAvatar} alt="" width={28} height={28} className={styles.headerAvatar} />
                </span>
              )}
              <div className={styles.bubbleTitleGroup}>
                <p className={styles.bubbleName}>{mascot.name}</p>
                {executionTaskTitle && (
                  <p className={styles.bubbleContext}>
                    Acompanhando: {executionTaskTitle}
                  </p>
                )}
              </div>
            </div>
            <div className={styles.bubbleHeaderActions}>
              {hasChatHistory && (
                <button
                  type="button"
                  className={styles.headerAction}
                  onClick={() => setIsConfirmingClear(true)}
                  aria-label="Limpar conversa"
                >
                  <Icon name="FaTrash" aria-hidden="true" size={10} />
                </button>
              )}
              <button
                type="button"
                className={styles.headerAction}
                aria-label="Fechar"
                onClick={handleDismiss}
              >
                <Icon name="MdClose" aria-hidden="true" size={12} />
              </button>
            </div>
          </div>

          <div className={styles.chatArea} aria-live="polite">
            {!hasChatHistory && initialText && (
              <div className={styles.msgRow} data-role="mascot">
                <div className={styles.msgAvatarSlot}>
                  {mascotAvatar && (
                    <Image src={mascotAvatar} alt="" width={24} height={24} data-kind="mascot" className={styles.msgAvatar} />
                  )}
                </div>
                <div className={styles.chatMsg} data-role="mascot">
                  <p>{initialText}</p>
                </div>
              </div>
            )}

            {groupedMessages.map((group) => (
              <div key={group.dayLabel + group.entries[0].message.id} className={styles.dayGroup}>
                <div className={styles.dayDivider}>
                  <span>{group.dayLabel}</span>
                </div>

                {group.entries.map(({ message: msg, index }, entryIdx) => {
                  // `kind === "error"` é a fonte de verdade atual; o check
                  // por prefixo continua aqui só pra mensagens JÁ salvas no
                  // localStorage antes do campo `kind` existir (texto
                  // literal "__ERROR__:..." persistido à moda antiga).
                  const isError = msg.kind === "error" || msg.text.startsWith("__ERROR__:");
                  const text = msg.text.startsWith("__ERROR__:")
                    ? msg.text.replace("__ERROR__:", "")
                    : msg.text;
                  const failedUserMessage = isError
                    ? [...messages.slice(0, index)].reverse().find((m) => m.role === "user")
                    : null;

                  const effectiveRole = isError ? "error" : msg.role;
                  const prevEntry = entryIdx > 0 ? group.entries[entryIdx - 1] : null;
                  const prevIsError =
                    prevEntry && (prevEntry.message.kind === "error" || prevEntry.message.text.startsWith("__ERROR__:"));
                  const prevRole = prevEntry ? (prevIsError ? "error" : prevEntry.message.role) : null;
                  const showAvatar = effectiveRole !== "error" && effectiveRole !== prevRole;

                  return (
                    <div
                      key={msg.id}
                      className={styles.msgRow}
                      data-role={effectiveRole}
                    >
                      {effectiveRole === "mascot" && (
                        <div className={styles.msgAvatarSlot}>
                          {showAvatar && mascotAvatar ? (
                            <Image src={mascotAvatar} alt="" width={24} height={24} data-kind="mascot" className={styles.msgAvatar} />
                          ) : null}
                        </div>
                      )}
                      <div
                        className={styles.chatMsg}
                        data-role={effectiveRole}
                      >
                        <CompanionMarkdown text={text} />
                        <span className={styles.msgTime}>{formatTimeOnly(new Date(msg.timestamp))}</span>
                        {isError && failedUserMessage && (
                          <button
                            type="button"
                            className={styles.retryBtn}
                            disabled={chatLoading}
                            onClick={() =>
                              handleRetry(failedUserMessage.text, failedUserMessage.taskId)
                            }
                            aria-label="Tentar novamente"
                          >
                            Tentar novamente
                          </button>
                        )}
                      </div>
                      {effectiveRole === "user" && (
                        <div className={styles.msgAvatarSlot}>
                          {showAvatar && userImage ? (
                            <Image src={userImage} alt="" width={24} height={24} className={styles.msgAvatar} />
                          ) : showAvatar ? (
                            <span className={styles.userAvatarFallback}>
                              <Icon name="FaUser" aria-hidden="true" size={11} />
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {pendingProposal && (
              <div className={styles.proposalCard}>
                <div className={styles.proposalHeader}>
                  <Icon name="FaBolt" aria-hidden="true" size={12} />
                  <span className={styles.proposalAction}>
                    {ACTION_LABELS[pendingProposal.action] ??
                      pendingProposal.action}
                  </span>
                </div>
                <p className={styles.proposalRisk}>
                  Risco:{" "}
                  {RISK_LABELS[pendingProposal.risk] ?? pendingProposal.risk}
                </p>
                <div className={styles.proposalActions}>
                  <Button.Preset
                    root={{
                      tone: "highlight",
                      disabled: proposalLoading,
                      onClick: handleConfirmAction,
                    }}
                    text={{
                      children: proposalLoading ? "Executando..." : "Confirmar",
                    }}
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
              <div className={styles.msgRow} data-role="mascot">
                <div className={styles.msgAvatarSlot}>
                  {mascotAvatar && (
                    <Image src={mascotAvatar} alt="" width={24} height={24} data-kind="mascot" className={styles.msgAvatar} />
                  )}
                </div>
                <div className={styles.chatMsg} data-role="mascot">
                  <p className={styles.typing}>
                    {mascot.name} está pensando
                    <span className={styles.typingDots} aria-hidden="true">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  </p>
                </div>
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
        </div>
      )}

      {isConfirmingClear && (
        <Modal onClose={() => setIsConfirmingClear(false)}>
          <ModalHeader title="Limpar toda a conversa?" onClose={() => setIsConfirmingClear(false)} />
          <p className={styles.confirmClearText}>
            As mensagens somem pra sempre. Não dá pra desfazer.
          </p>
          <div className={styles.confirmClearActions}>
            <Button.Root type="button" variant="secondary" onClick={() => setIsConfirmingClear(false)}>
              Cancelar
            </Button.Root>
            <Button.Root
              type="button"
              tone="danger"
              onClick={() => {
                clearHistory();
                setIsConfirmingClear(false);
              }}
            >
              Limpar
            </Button.Root>
          </div>
        </Modal>
      )}

      <button
        type="button"
        className={styles.avatar}
        data-mood={mood}
        aria-label={
          isOpen
            ? `Fechar mensagem de ${mascot.name}`
            : hasUnread
              ? `Abrir mensagem de ${mascot.name} (nova mensagem)`
              : `Abrir mensagem de ${mascot.name}`
        }
        aria-expanded={isOpen}
        onClick={handleAvatarClick}
      >
        <Icon
          name="FaCommentDots"
          aria-hidden="true"
          className={styles.avatarIcon}
        />
        {hasUnread && <span className={styles.unreadDot} aria-hidden="true" />}
      </button>
    </div>
  );
}
