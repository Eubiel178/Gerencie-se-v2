"use client";

import { useEffect, useRef, useState } from "react";

import { usePathname } from "next/navigation";

import { useChatHistory } from "@/features/assistant/hooks/use-chat-history";
import { MascotPersonality } from "@/features/focus/domain";
import { computeBubbleDisplayMs } from "@/features/mascot-pet/domain/bubble-timing";
import { subscribeMascotEvent } from "@/features/mascot-pet/domain/events";
import { shouldReplaceInteraction } from "@/features/mascot-pet/domain/interaction-policy";
import type { Gender } from "@/features/profile/get-gender";
import { ITask } from "@/features/tasks/domain";
import { useTaskStore } from "@/features/tasks/task-store";
import type { CompanionInteractionContext } from "@/lib/ai/prompts/companion-context-prompt";
import { PRIORITY_LABELS } from "@/lib/shared/priority";
import { isAudioUnlocked } from "@/lib/speech/audio-unlock";
import { useSpeak } from "@/lib/speech/speak-text";

import { resolveCompanionMessageAction } from "../actions";
import { INTENT_CONFIG } from "../domain/companion-interaction-config";
import { CompanionFact, CompanionPhrase, phraseCompanion } from "../domain/companion-phrasing";
import { useExecutionCompanionStore } from "../execution-companion-store";

// Só conta como "ausência" de verdade a partir desse tempo com a aba
// escondida - evita disparar em toda troca rápida de aba (checar um
// link, colar algo). Voltar depois de 20s nunca deve produzir o mesmo
// comportamento que voltar depois de uma ausência de verdade.
const ABSENCE_THRESHOLD_MS = 10 * 60 * 1000;

// Tarefa ativa contínua por muito tempo - comentário de bem-estar, não de
// produtividade (ver `long-session` em `companion-phrasing.ts`).
const LONG_SESSION_THRESHOLD_MIN = 30;

// Prazo real (`task.scheduledAt`) dentro desta janela conta como "perto".
const DEADLINE_WARNING_MINUTES = 60;

// Checa sessão longa/prazo/progresso a cada minuto - não precisa de mais
// frequência que isso pra sinais que são sobre "faz tempo"/"prazo
// chegando", nunca sobre segundos.
const PERIODIC_CHECK_MS = 60 * 1000;

// Nome próprio some na maioria das mensagens (pedido explícito: "não em
// toda mensagem") - aparece só a cada N ocasiões elegíveis, de forma
// determinística (nunca Math.random, pro comportamento ser
// previsível/testável).
const NAME_USAGE_EVERY_N = 3;

// Quantas mensagens espontâneas recentes carregar no contexto da IA, só
// pra evitar repetir a mesma forma/estrutura de novo.
const MAX_RECENT_TEXTS = 4;

// Quantas vezes a pessoa precisa FECHAR manualmente um balão (não deixar
// sumir sozinho) antes do Companion parar de iniciar interações CASUAIS
// no resto desta sessão de aba - eventos MEANINGFUL nunca são afetados
// por isso (começar/concluir tarefa, prazo, continuam aparecendo).
const CASUAL_DISMISS_THRESHOLD = 2;

// Se o usuário mandou mensagem no chat do Widget há pouco tempo, ele está
// ENGAJADO de verdade com o Companion agora - isso anula o freio de
// dismissals acima pro resto dessa janela (conversa ativa não deveria
// ser tratada como "está me ignorando").
const ENGAGEMENT_WINDOW_MS = 10 * 60 * 1000;

// Quantos passos precisam ser concluídos DESDE A ÚLTIMA checagem pra
// contar como um marco de progresso que vale comentar (não todo passo
// isolado - "vários passos" foi o pedido).
const PROGRESS_MILESTONE_STEP_JUMP = 2;

const isDev = process.env.NODE_ENV === "development";

/** Observabilidade só de desenvolvimento - nunca chega no usuário final
 * (é só `console.log`, nunca renderizado). Cobre a METADE da decisão que
 * acontece aqui no cliente (política de prioridade/cooldown/engajamento);
 * a outra metade (cota, local vs IA, provider/model) é logada
 * server-side em `resolveCompanionMessageAction`/`generateCompanionInteraction`. */
function devLog(intent: string, decision: "speak" | "silent", reason?: string) {
  if (!isDev) return;
  console.log(`[Companion:client] intent=${intent} decision=${decision}${reason ? ` reason=${reason}` : ""}`);
}

interface ActiveMessage {
  phrase: CompanionPhrase;
  priority: "meaningful" | "casual";
}

function getTask(taskId: string): ITask | null {
  return useTaskStore.getState().tasks.find((t) => t.id === taskId) ?? null;
}

function getTaskTitle(taskId: string): string {
  return getTask(taskId)?.title ?? "sua tarefa";
}

function formatMinutesAsDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h${rest}min` : `${hours}h`;
}

export interface TasksCompanionUserContext {
  firstName: string | null;
  gender: Gender;
}

/**
 * Decide QUANDO o Companion tem algo que vale a pena dizer na página de
 * Tarefas, a partir de eventos/estado REAIS (nunca um timer solto), e
 * monta o CONTEXTO real que vai tanto pro fallback local
 * (`companion-phrasing.ts`) quanto pra geração via IA
 * (`resolveCompanionMessageAction` → `generateCompanionInteraction`).
 *
 * Pipeline: evento/contexto real → política de prioridade/cooldown/
 * engajamento (aqui) → fato → servidor decide cota + local-ou-IA → UMA
 * mensagem {written, spoken} → balão/TTS.
 *
 * Corretude do ciclo de vida da mensagem (bug corrigido): cada chamada de
 * `tryShow` tem uma geração própria (`generationRef`) - se uma chamada
 * mais nova começar antes de uma mais velha terminar de resolver (rede),
 * a mais velha é descartada por completo assim que percebe que não é
 * mais a mais recente. Combinado com `speak()` sendo um singleton global
 * com cancelamento (`lib/speech/speak-text.ts`), o balão e a fala SEMPRE
 * vêm do MESMO objeto de mensagem.
 */
export function useTasksCompanion(
  personality: MascotPersonality,
  autoSpeechEnabled: boolean,
  enabled: boolean,
  userContext: TasksCompanionUserContext
) {
  const pathname = usePathname();
  const isTasksPage = pathname?.startsWith("/home/tasks") ?? false;
  const { messages: chatMessages } = useChatHistory();

  const [active, setActive] = useState<ActiveMessage | null>(null);
  const { isSpeaking, speak: triggerSpeak } = useSpeak();

  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationRef = useRef(0);
  const activeRef = useRef<ActiveMessage | null>(null);
  const chatMessagesRef = useRef(chatMessages);
  const idleNudgeShownForSessionRef = useRef<string | null>(null);
  const longSessionShownForSessionRef = useRef<string | null>(null);
  const deadlineWarnedForTaskRef = useRef<string | null>(null);
  const overdueWarnedForTaskRef = useRef<string | null>(null);
  const progressTrackedTaskIdRef = useRef<string | null>(null);
  const lastSeenCompletedStepsRef = useRef<number | null>(null);
  const lastSeenTaskCompletedRef = useRef<boolean | null>(null);
  const hiddenAtRef = useRef<number | null>(null);
  const nameUsageCounterRef = useRef(0);
  const recentTextsRef = useRef<string[]>([]);
  const manualDismissCountRef = useRef(0);

  useEffect(() => {
    activeRef.current = active;
  });
  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  });

  function clearDismissTimer() {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }

  /** Fechar MANUALMENTE (botão X do balão) - diferente do auto-dismiss
   * por tempo, que nunca chama isto (ver `tryShow`). Fechar de propósito
   * é o sinal mais forte de "não queria ver isso agora". */
  function dismiss() {
    manualDismissCountRef.current += 1;
    clearDismissTimer();
    setActive(null);
  }

  function nextNameOrNull(): string | null {
    nameUsageCounterRef.current += 1;
    if (!userContext.firstName) return null;
    return nameUsageCounterRef.current % NAME_USAGE_EVERY_N === 0 ? userContext.firstName : null;
  }

  function isEngagedViaChat(): boolean {
    const cutoff = Date.now() - ENGAGEMENT_WINDOW_MS;
    return chatMessagesRef.current.some((m) => m.role === "user" && m.timestamp >= cutoff);
  }

  function isCasualThrottled(): boolean {
    return manualDismissCountRef.current >= CASUAL_DISMISS_THRESHOLD && !isEngagedViaChat();
  }

  function buildContext(fact: CompanionFact, task: ITask | null, firstName: string | null): CompanionInteractionContext {
    let deadlineInfo: string | null = null;
    if (task?.scheduledAt && !task.completed) {
      const diffMin = Math.round((new Date(task.scheduledAt).getTime() - Date.now()) / 60000);
      deadlineInfo =
        diffMin >= 0 ? `vence em ${formatMinutesAsDuration(diffMin)}` : `venceu há ${formatMinutesAsDuration(-diffMin)}`;
    }

    let progressInfo: string | null = null;
    if (task && task.steps.length > 0) {
      const done = task.steps.filter((s) => s.completed).length;
      progressInfo = `${done} de ${task.steps.length} passos concluídos (${Math.round((done / task.steps.length) * 100)}%)`;
    }

    return {
      intent: fact.kind,
      intentLabel: INTENT_CONFIG[fact.kind].label,
      taskTitle: fact.taskTitle ?? "sua tarefa",
      taskDescription: task?.description || null,
      priority: task ? PRIORITY_LABELS[task.priority] : null,
      deadlineInfo,
      progressInfo,
      durationMinutes: "elapsedMinutes" in fact ? fact.elapsedMinutes : null,
      firstName,
      gender: userContext.gender,
      recentTexts: recentTextsRef.current.slice(-MAX_RECENT_TEXTS),
    };
  }

  async function tryShow(fact: CompanionFact, task: ITask | null) {
    const config = INTENT_CONFIG[fact.kind];

    if (!shouldReplaceInteraction(activeRef.current, config.priority)) {
      devLog(fact.kind, "silent", "priority_blocked");
      return;
    }
    if (config.priority === "casual" && isCasualThrottled()) {
      devLog(fact.kind, "silent", "casual_throttled_by_dismissals");
      return;
    }

    const myGeneration = ++generationRef.current;
    const localFallback = phraseCompanion(fact, personality);
    const firstName = nextNameOrNull();
    const context = buildContext(fact, task, firstName);

    const result = await resolveCompanionMessageAction({
      intent: fact.kind,
      priority: config.priority,
      aiEligible: config.aiEligible,
      personality,
      context,
      localFallback,
    });

    // Uma chamada mais nova já assumiu enquanto esperávamos o servidor -
    // descarta esta por completo, nunca mostra nem fala o que já é velho.
    if (myGeneration !== generationRef.current) return;
    if (!result.allowed || !result.phrase) {
      devLog(fact.kind, "silent", "budget_or_error");
      return;
    }

    const phrase = result.phrase;
    devLog(fact.kind, "speak", result.source);
    recentTextsRef.current = [...recentTextsRef.current, phrase.written].slice(-MAX_RECENT_TEXTS);

    clearDismissTimer();
    setActive({ phrase, priority: config.priority });
    dismissTimerRef.current = setTimeout(() => {
      if (myGeneration === generationRef.current) setActive(null);
    }, computeBubbleDisplayMs(phrase.written));

    if (autoSpeechEnabled && isAudioUnlocked()) {
      await triggerSpeak(phrase.spoken);
    }
  }

  function listen() {
    if (active) triggerSpeak(active.phrase.spoken);
  }

  useEffect(() => {
    if (!isTasksPage || !enabled) return;

    // Saudação de presença: UMA vez por sessão de navegador (nunca a cada
    // navegação/refresh) - `sessionStorage` é o mesmo padrão já usado pelo
    // Widget (`assistant-dismissed-message`) pra "uma vez por aba aberta".
    // Um pequeno atraso evita um "pop" instantâneo assim que a página
    // pinta, e mantém a chamada fora do corpo síncrono do efeito.
    const GREETED_KEY = "companion-greeted-session";
    let greetingTimer: ReturnType<typeof setTimeout> | null = null;
    try {
      if (!sessionStorage.getItem(GREETED_KEY)) {
        sessionStorage.setItem(GREETED_KEY, "1");
        greetingTimer = setTimeout(() => {
          const session = useExecutionCompanionStore.getState().session;
          const task = session ? getTask(session.taskId) : null;
          tryShow(
            { kind: "presence-greeting", taskTitle: task?.title ?? null, firstName: nextNameOrNull() },
            task
          );
        }, 700);
      }
    } catch {
      // sessionStorage indisponível (modo privado/bloqueado) - sem
      // saudação de presença nesta aba, mas o resto do Companion continua.
    }

    const unsubscribeEvent = subscribeMascotEvent((type) => {
      const session = useExecutionCompanionStore.getState().session;
      if (!session) return;
      const task = getTask(session.taskId);

      if (type === "execution-started") {
        idleNudgeShownForSessionRef.current = null;
        longSessionShownForSessionRef.current = null;
        deadlineWarnedForTaskRef.current = null;
        overdueWarnedForTaskRef.current = null;
        progressTrackedTaskIdRef.current = null;
        tryShow({ kind: "execution-started", taskTitle: task?.title ?? getTaskTitle(session.taskId) }, task);
      } else if (type === "execution-resumed") {
        // Retomar libera um novo cutucão de ociosidade/sessão longa pro
        // trecho de execução ATUAL (mesmo `session.id`, período novo -
        // ver `resumedAt` em `IExecutionSession`).
        idleNudgeShownForSessionRef.current = null;
        longSessionShownForSessionRef.current = null;
      } else if (type === "execution-completed") {
        tryShow({ kind: "execution-completed", taskTitle: task?.title ?? getTaskTitle(session.taskId) }, task);
      } else if (type === "user-idle") {
        // Ociosidade durante execução ATIVA. Reaproveita o MESMO
        // `watchUserIdle` global que já faz o mascote "dormir" (ver
        // `engine/runtime.ts`) em vez de um segundo detector redundante -
        // só age se existe sessão ativa E ainda não avisou nesta MESMA
        // sessão (nunca repete até ela mudar de estado).
        if (session.status !== "active") return;
        if (idleNudgeShownForSessionRef.current === session.id) return;

        idleNudgeShownForSessionRef.current = session.id;
        const elapsedMinutes = Math.round((Date.now() - session.resumedAt.getTime()) / 60000);
        tryShow(
          { kind: "execution-idle-nudge", taskTitle: task?.title ?? getTaskTitle(session.taskId), elapsedMinutes },
          task
        );
      }
    });

    // Volta de ausência: aba escondida por tempo suficiente (nunca 20s de
    // troca rápida) com uma tarefa em andamento.
    function handleVisibilityChange() {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        return;
      }

      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (!hiddenAt || Date.now() - hiddenAt < ABSENCE_THRESHOLD_MS) return;

      const session = useExecutionCompanionStore.getState().session;
      if (!session) return;
      const task = getTask(session.taskId);

      tryShow(
        { kind: "return-after-absence", taskTitle: task?.title ?? getTaskTitle(session.taskId), firstName: nextNameOrNull() },
        task
      );
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Prazo/atraso/progresso/reabertura/sessão longa - checagem periódica
    // leve (1x/min), nunca chamada de IA nem trabalho pesado por tick (a
    // IA só entra DEPOIS, dentro de `tryShow` → `resolveCompanionMessageAction`,
    // e só se um sinal real foi identificado aqui). No máximo UM sinal por
    // tick, em ordem de importância.
    const periodicCheck = setInterval(() => {
      const session = useExecutionCompanionStore.getState().session;
      if (!session) return;
      const task = getTask(session.taskId);

      if (task?.scheduledAt && !task.completed) {
        const now = Date.now();
        const dueAt = new Date(task.scheduledAt).getTime();

        if (dueAt < now && overdueWarnedForTaskRef.current !== task.id) {
          overdueWarnedForTaskRef.current = task.id;
          const daysOverdue = Math.max(1, Math.ceil((now - dueAt) / 86_400_000));
          tryShow({ kind: "overdue-task", taskTitle: task.title, daysOverdue }, task);
          return;
        }

        const minutesUntilDue = Math.round((dueAt - now) / 60000);
        if (
          minutesUntilDue > 0 &&
          minutesUntilDue <= DEADLINE_WARNING_MINUTES &&
          deadlineWarnedForTaskRef.current !== task.id
        ) {
          deadlineWarnedForTaskRef.current = task.id;
          tryShow({ kind: "deadline-approaching", taskTitle: task.title, minutesUntilDue }, task);
          return;
        }
      }

      if (task) {
        if (progressTrackedTaskIdRef.current !== task.id) {
          // Tarefa nova pro tracker de progresso/reabertura - só define a
          // linha de base, nunca dispara no primeiro contato (senão TODA
          // tarefa já em progresso disparia um "marco" falso ao entrar
          // na página).
          progressTrackedTaskIdRef.current = task.id;
          lastSeenCompletedStepsRef.current = task.steps.filter((s) => s.completed).length;
          lastSeenTaskCompletedRef.current = task.completed;
        } else {
          if (lastSeenTaskCompletedRef.current === true && task.completed === false) {
            lastSeenTaskCompletedRef.current = false;
            tryShow({ kind: "reopened-task", taskTitle: task.title }, task);
            return;
          }
          lastSeenTaskCompletedRef.current = task.completed;

          if (task.steps.length > 0 && lastSeenCompletedStepsRef.current !== null) {
            const completedNow = task.steps.filter((s) => s.completed).length;
            const jump = completedNow - lastSeenCompletedStepsRef.current;
            const reachedAll = completedNow === task.steps.length && lastSeenCompletedStepsRef.current < task.steps.length;
            lastSeenCompletedStepsRef.current = completedNow;

            if (jump >= PROGRESS_MILESTONE_STEP_JUMP || reachedAll) {
              tryShow(
                { kind: "progress-milestone", taskTitle: task.title, completedSteps: completedNow, totalSteps: task.steps.length },
                task
              );
              return;
            }
          }
        }
      }

      if (session.status === "active" && longSessionShownForSessionRef.current !== session.id) {
        const elapsedMinutes = Math.round((Date.now() - session.resumedAt.getTime()) / 60000);
        if (elapsedMinutes >= LONG_SESSION_THRESHOLD_MIN) {
          longSessionShownForSessionRef.current = session.id;
          tryShow(
            { kind: "long-session", taskTitle: task?.title ?? getTaskTitle(session.taskId), elapsedMinutes, gender: userContext.gender },
            task
          );
        }
      }
    }, PERIODIC_CHECK_MS);

    return () => {
      if (greetingTimer) clearTimeout(greetingTimer);
      unsubscribeEvent();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(periodicCheck);
      clearDismissTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTasksPage, enabled, personality, autoSpeechEnabled, userContext.firstName, userContext.gender]);

  // Nunca mostra o balão fora de `/home/tasks` ou com o Companion
  // desligado - o valor devolvido já nasce nulo nesses casos, sem
  // precisar de um efeito separado só pra limpar estado (evita setState
  // dentro de um efeito de limpeza).
  const message = isTasksPage && enabled ? active?.phrase ?? null : null;

  return { message, isSpeaking, listen, dismiss };
}
