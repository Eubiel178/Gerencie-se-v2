"use client";

import { useEffect, useRef, useState } from "react";

import { usePathname } from "next/navigation";

import { useChatHistory } from "@/features/assistant/hooks/use-chat-history";
import { requestWidgetOpenWithMessage } from "@/features/assistant/hooks/use-widget-open-request";
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

import { resolveCompanionMessageAction, setCompanionQuietAction } from "../actions";
import { isFactStillValid } from "../domain/companion-fact-validity";
import { INTENT_CONFIG } from "../domain/companion-interaction-config";
import { computeCandidateMoves } from "../domain/companion-move-selection";
import { type CompanionActionOption, type CompanionMove, NEVER_HUMOR_SITUATIONS } from "../domain/companion-moves";
import { getPersonalityBehavior } from "../domain/companion-personality-profile";
import { CompanionFact, CompanionPhrase, phraseCompanion } from "../domain/companion-phrasing";
import { computeCompanionStatus, type CompanionStatusSnapshot } from "../domain/companion-status";
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

// Checa sessão longa/prazo/progresso/troca de tarefa a cada minuto - não
// precisa de mais frequência que isso pra sinais que são sobre "faz
// tempo"/"prazo chegando", nunca sobre segundos.
const PERIODIC_CHECK_MS = 60 * 1000;

// Nome próprio some na maioria das mensagens (pedido explícito: "não em
// toda mensagem") - aparece só a cada N ocasiões elegíveis, de forma
// determinística (nunca Math.random, pro comportamento ser
// previsível/testável).
const NAME_USAGE_EVERY_N = 3;

// Quantas mensagens espontâneas recentes carregar no contexto da IA, só
// pra evitar repetir a mesma forma/estrutura de novo.
const MAX_RECENT_TEXTS = 4;

// Se o usuário mandou mensagem no chat do Widget há pouco tempo, ele está
// ENGAJADO de verdade com o Companion agora - isso evita perguntar se
// deve falar menos (conversa ativa não é "está me ignorando").
const ENGAGEMENT_WINDOW_MS = 10 * 60 * 1000;

// Quantos passos precisam ser concluídos DESDE A ÚLTIMA checagem pra
// contar como um marco de progresso que vale comentar (não todo passo
// isolado - "vários passos" foi o pedido).
const PROGRESS_MILESTONE_STEP_JUMP = 2;

// Janela padrão de recuo depois de um "agora não"/"não, obrigado" antes
// de voltar a candidatar oferecer-ajuda/sugerir/iniciar - multiplicada
// pelo perfil de cada personalidade (ver `companion-personality-profile.ts`).
const BASE_RECOVERY_MS = 20 * 60 * 1000;

// Trocar de tarefa ativa este tanto de vezes numa janela curta é o que
// conta como "troca de tarefa com frequência" (não duas trocas normais
// ao longo do dia).
const TASK_SWITCH_WINDOW_MS = 20 * 60 * 1000;
const TASK_SWITCH_THRESHOLD = 3;

// Espelha `QUIET_DURATION_MS` do servidor (`execution-companion/actions.ts`)
// só pra saber, LOCALMENTE e sem round-trip, que "sim" acabou de ser
// respondido a `ask-quiet-check` - usado só pelo cartão de estado do
// clique no mascote (ver `getStatusSnapshot`); a aplicação de verdade do
// limite (silenciar interações) continua 100% do lado do servidor.
const QUIET_DURATION_MS_LOCAL_MIRROR = 60 * 60 * 1000;
// Janelas de "ainda recente" só pro cartão de estado do clique - não têm
// nenhum efeito sobre quando o Companion FALA, só sobre o que ele conta
// quando é CLICADO.
const HELP_ACCEPTED_STATUS_WINDOW_MS = 30 * 60 * 1000;
const CELEBRATION_STATUS_WINDOW_MS = 2 * 60 * 60 * 1000;

const isDev = process.env.NODE_ENV === "development";

/** Observabilidade só de desenvolvimento - nunca chega no usuário final
 * (é só `console.log`, nunca renderizado). Cobre a METADE da decisão que
 * acontece aqui no cliente (política de prioridade/cooldown/engajamento/
 * movimento candidato); a outra metade (cota, limite de espaço, local vs
 * IA, provider/model, movimento final) é logada server-side em
 * `resolveCompanionMessageAction`/`generateCompanionInteraction`. */
function devLog(intent: string, decision: "speak" | "silent", reason?: string) {
  if (!isDev) return;
  console.log(`[Companion:client] intent=${intent} decision=${decision}${reason ? ` reason=${reason}` : ""}`);
}

/**
 * Identidade completa de UMA interação mostrada - nasce inteira numa
 * única chamada de `tryShow` e nunca é reconstruída depois a partir do
 * que estiver "ativo agora" (task/sessão atual). O balão sempre renderiza
 * A PARTIR DESTE OBJETO, nunca voltando a consultar "qual é a tarefa
 * ativa" - é isso que impede uma interação sobre a Tarefa A ser mostrada
 * (ou pior, reescrita) como se fosse sobre a Tarefa B só porque B virou
 * a tarefa ativa entre a geração e a exibição.
 */
export interface ActiveCompanionMessage {
  id: string;
  situation: CompanionFact["kind"];
  move: CompanionMove;
  taskId: string | null;
  taskTitle: string | null;
  priority: "meaningful" | "casual";
  phrase: CompanionPhrase;
  actions: CompanionActionOption[];
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
 * Tarefas, a partir de eventos/estado REAIS (nunca um timer solto), monta
 * o CONTEXTO real e escolhe (junto com o servidor) COMO se comportar -
 * ver `companion-moves.ts`/`companion-move-selection.ts` pro modelo de
 * "situação → movimentos candidatos → movimento escolhido".
 *
 * Pipeline: evento/contexto real → política de prioridade/cooldown/
 * engajamento/recuo (aqui) → fato + movimentos candidatos → servidor
 * decide limite de espaço + cota + local-ou-IA + movimento final → UMA
 * mensagem com identidade própria → balão/TTS.
 *
 * Corretude do ciclo de vida da mensagem (bug corrigido): cada chamada de
 * `tryShow` tem uma geração própria (`generationRef`) - se uma chamada
 * mais nova começar antes de uma mais velha terminar de resolver (rede),
 * a mais velha é descartada por completo assim que percebe que não é
 * mais a mais recente, e a tarefa/situação são revalidadas (`isFactStillValid`)
 * bem no fim, contra o estado FRESCO na hora de exibir - nunca o estado
 * que era verdade quando a chamada começou. Combinado com `speak()` sendo
 * um singleton global com cancelamento (`lib/speech/speak-text.ts`), o
 * balão e a fala SEMPRE vêm do MESMO objeto de mensagem, sobre a MESMA
 * tarefa.
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

  const [active, setActive] = useState<ActiveCompanionMessage | null>(null);
  const { isSpeaking, speak: triggerSpeak } = useSpeak();

  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissDeadlineRef = useRef(0);
  const pausedRemainingMsRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const activeRef = useRef<ActiveCompanionMessage | null>(null);
  const chatMessagesRef = useRef(chatMessages);
  const idleNudgeShownForSessionRef = useRef<string | null>(null);
  const longSessionShownForSessionRef = useRef<string | null>(null);
  const deadlineWarnedForTaskRef = useRef<string | null>(null);
  const overdueWarnedForTaskRef = useRef<string | null>(null);
  const progressTrackedTaskIdRef = useRef<string | null>(null);
  const lastSeenCompletedStepsRef = useRef<number | null>(null);
  const lastSeenTaskCompletedRef = useRef<boolean | null>(null);
  const reopenCountByTaskRef = useRef<Map<string, number>>(new Map());
  const hiddenAtRef = useRef<number | null>(null);
  const nameUsageCounterRef = useRef(0);
  const recentTextsRef = useRef<string[]>([]);
  const manualDismissCountRef = useRef(0);
  const askedQuietThisSessionRef = useRef(false);
  const recoveryUntilRef = useRef(0);
  const recentTaskStartsRef = useRef<Array<{ taskId: string; at: number }>>([]);
  const quietUntilLocalRef = useRef(0);
  const lastHelpAcceptedRef = useRef<{ taskTitle: string | null; at: number } | null>(null);
  const lastCelebrationRef = useRef<{ taskTitle: string | null; at: number } | null>(null);

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

  function scheduleAutoDismiss(myGeneration: number, ms: number) {
    clearDismissTimer();
    dismissDeadlineRef.current = Date.now() + ms;
    dismissTimerRef.current = setTimeout(() => {
      if (myGeneration === generationRef.current) setActive(null);
    }, ms);
  }

  /** Passar o mouse/foco no balão pausa o auto-fechamento - nunca some
   * enquanto a pessoa está de fato olhando/lendo. Retomado só quando o
   * mouse sai / o foco muda de verdade (ver `resumeAutoDismiss`). */
  function pauseAutoDismiss() {
    if (!dismissTimerRef.current) return;
    pausedRemainingMsRef.current = Math.max(0, dismissDeadlineRef.current - Date.now());
    clearDismissTimer();
  }

  function resumeAutoDismiss() {
    const remaining = pausedRemainingMsRef.current;
    if (remaining === null) return;
    pausedRemainingMsRef.current = null;
    scheduleAutoDismiss(generationRef.current, remaining);
  }

  /** Fechar MANUALMENTE (botão X do balão) - diferente do auto-dismiss
   * por tempo, que nunca chama isto. Fechar significa SÓ "fechar esta
   * mensagem" (pedido explícito) - nunca "fale menos comigo", que tem seu
   * próprio caminho explícito (`ask-quiet-check` → `respondToAction`).
   * Só alimenta a CONTAGEM que decide quando vale perguntar sobre isso -
   * nunca throttla sozinho. */
  function dismiss() {
    if (activeRef.current?.priority === "casual") {
      manualDismissCountRef.current += 1;
    }
    clearDismissTimer();
    pausedRemainingMsRef.current = null;
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

  function buildContext(
    fact: CompanionFact,
    task: ITask | null,
    firstName: string | null
  ): Omit<CompanionInteractionContext, "eligibleMoves" | "humorEligible"> {
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

    const taskTitle = "taskTitle" in fact ? fact.taskTitle : null;

    return {
      intent: fact.kind,
      intentLabel: INTENT_CONFIG[fact.kind].label,
      taskTitle,
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

    const inRecovery = Date.now() < recoveryUntilRef.current;
    const candidateMoves = computeCandidateMoves({
      situation: fact.kind,
      personality,
      isQuiet: false, // o servidor é quem sabe de verdade o `quietUntil` - ver `resolveCompanionMessageAction`.
      isMeaningful: config.priority === "meaningful",
      inRecoveryWindow: inRecovery,
    });

    if (candidateMoves.length === 0) {
      devLog(fact.kind, "silent", "no_candidate_move");
      return;
    }

    const myGeneration = ++generationRef.current;
    const localFallback = phraseCompanion(fact, personality);
    const firstName = nextNameOrNull();
    const context = buildContext(fact, task, firstName);
    const humorEligible = getPersonalityBehavior(personality).humorEligible && !NEVER_HUMOR_SITUATIONS.includes(fact.kind);
    const taskId = task?.id ?? null;

    const result = await resolveCompanionMessageAction({
      intent: fact.kind,
      priority: config.priority,
      aiEligible: config.aiEligible,
      personality,
      context,
      candidateMoves,
      humorEligible,
      localFallback,
    });

    // Uma chamada mais nova já assumiu enquanto esperávamos o servidor -
    // descarta esta por completo, nunca mostra nem fala o que já é velho.
    if (myGeneration !== generationRef.current) return;
    if (!result.allowed || !result.phrase || !result.move) {
      devLog(fact.kind, "silent", "budget_or_error");
      return;
    }

    // Revalidação final: o estado pode ter mudado durante a chamada de
    // rede (ou enquanto a aba esteve escondida) - reconsulta a MESMA
    // tarefa (por id, nunca "a atual") com dados frescos antes de exibir.
    // Uma interação sobre uma tarefa que já não faz mais sentido (foi
    // concluída/reaberta/apagada nesse meio-tempo) é descartada em
    // silêncio, nunca mostrada com informação velha.
    const freshTask = taskId ? getTask(taskId) : null;
    if (!isFactStillValid(fact, freshTask)) {
      devLog(fact.kind, "silent", "stale_context");
      return;
    }

    const phrase = result.phrase;
    const move = result.move;
    const actions = result.actions ?? [];
    devLog(fact.kind, "speak", `${result.source}:${move}`);
    recentTextsRef.current = [...recentTextsRef.current, phrase.written].slice(-MAX_RECENT_TEXTS);
    if (move === "comemorar") {
      lastCelebrationRef.current = { taskTitle: freshTask?.title ?? null, at: Date.now() };
    }

    const message: ActiveCompanionMessage = {
      id: crypto.randomUUID(),
      situation: fact.kind,
      move,
      taskId,
      taskTitle: freshTask?.title ?? ("taskTitle" in fact ? fact.taskTitle : null),
      priority: config.priority,
      phrase,
      actions,
    };

    setActive(message);
    scheduleAutoDismiss(
      myGeneration,
      computeBubbleDisplayMs(phrase.written, { hasActions: actions.length > 0, priority: config.priority })
    );

    if (autoSpeechEnabled && isAudioUnlocked()) {
      await triggerSpeak(phrase.spoken);
    }
  }

  /** Depois de perceber fechamentos casuais repetidos, o Companion
   * PERGUNTA (uma vez por sessão de aba) se deve falar menos - nunca
   * infere isso sozinho a partir das contagens. */
  function maybeAskToQuietDown() {
    if (askedQuietThisSessionRef.current) return;
    if (isEngagedViaChat()) return;
    const threshold = getPersonalityBehavior(personality).dismissThresholdBeforeAsking;
    if (manualDismissCountRef.current < threshold) return;

    askedQuietThisSessionRef.current = true;
    tryShow({ kind: "ask-quiet-check" }, null);
  }

  /** Resposta a uma das ações rápidas do balão ATUAL - nunca muta
   * nenhuma tarefa sozinha. "Aceitar ajuda" abre/continua a conversa do
   * Assistant com o contexto real (ver `use-widget-open-request.ts`);
   * "recusar" só inicia a janela de recuo desta personalidade; a
   * pergunta de limite de espaço é a ÚNICA que persiste algo (`quietUntil`,
   * e só com resposta explícita "sim"). */
  function respondToAction(actionId: string) {
    const message = activeRef.current;
    if (!message) return;

    if (actionId === "accept-help" || actionId === "accept-suggestion") {
      const taskTitle = message.taskTitle ?? "essa tarefa";
      lastHelpAcceptedRef.current = { taskTitle: message.taskTitle, at: Date.now() };
      requestWidgetOpenWithMessage(`Pode me ajudar com "${taskTitle}"?`, message.taskId);
    } else if (actionId === "decline-help" || actionId === "decline-suggestion") {
      recoveryUntilRef.current = Date.now() + BASE_RECOVERY_MS * getPersonalityBehavior(personality).recoveryMultiplier;
    } else if (actionId === "confirm-quiet") {
      quietUntilLocalRef.current = Date.now() + QUIET_DURATION_MS_LOCAL_MIRROR;
      setCompanionQuietAction().catch(() => {
        // Falhou silenciosamente do lado do servidor - pior caso, o
        // Companion continua no volume normal; sem erro visível pro
        // usuário por causa de uma preferência de conforto.
      });
    } else if (actionId === "decline-quiet") {
      // Só reseta a contagem (não pergunta de novo imediatamente) -
      // `askedQuietThisSessionRef` já impede perguntar de novo nesta
      // mesma sessão de aba de qualquer forma.
      manualDismissCountRef.current = 0;
    }

    dismiss();
  }

  function listen() {
    if (active) triggerSpeak(active.phrase.spoken);
  }

  /** Cálculo puro a partir de refs/store já existentes - chamado só no
   * MOMENTO do clique no mascote (ver `mascot-pet/index.tsx`), nunca
   * reativo. Sem chamada de IA, sem chamada de rede: o mesmo clique
   * repetido sem nenhum evento real no meio sempre devolve a mesma
   * categoria (continuidade de graça, ver `companion-status.ts`). */
  function getStatusSnapshot(): CompanionStatusSnapshot {
    const now = Date.now();
    const session = useExecutionCompanionStore.getState().session;
    const activeTask = session ? { title: getTaskTitle(session.taskId) } : null;

    const acceptedRecently =
      lastHelpAcceptedRef.current && now - lastHelpAcceptedRef.current.at < HELP_ACCEPTED_STATUS_WINDOW_MS
        ? { taskTitle: lastHelpAcceptedRef.current.taskTitle }
        : null;
    const recentCelebration =
      lastCelebrationRef.current && now - lastCelebrationRef.current.at < CELEBRATION_STATUS_WINDOW_MS
        ? { taskTitle: lastCelebrationRef.current.taskTitle }
        : null;

    return computeCompanionStatus({
      isQuiet: now < quietUntilLocalRef.current,
      declinedRecently: now < recoveryUntilRef.current,
      acceptedRecently,
      recentCelebration,
      activeTask,
    });
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

    const unsubscribeEvent = subscribeMascotEvent((type, payload) => {
      const session = useExecutionCompanionStore.getState().session;

      if (type === "task-completed") {
        // "Vitória silenciosa": concluída pelo checkbox sem NUNCA ter
        // tido uma sessão de execução rastreada - a conclusão ACOMPANHADA
        // já tem seu próprio evento/fato (`execution-completed` abaixo),
        // então aqui só interessa o caso sem sessão.
        if (payload?.hadExecutionSession || !payload?.taskId) return;
        tryShow({ kind: "quiet-win", taskTitle: getTaskTitle(payload.taskId) }, getTask(payload.taskId));
        return;
      }

      if (!session) return;
      const task = getTask(session.taskId);

      if (type === "execution-started") {
        idleNudgeShownForSessionRef.current = null;
        longSessionShownForSessionRef.current = null;
        deadlineWarnedForTaskRef.current = null;
        overdueWarnedForTaskRef.current = null;
        progressTrackedTaskIdRef.current = null;

        // Detector de troca de tarefa frequente - conta tarefas DISTINTAS
        // iniciadas numa janela curta; ao atingir o limite, comenta uma
        // vez e reinicia a contagem (detecção é oportunidade, não
        // obrigação: não fica repetindo o comentário a cada troca extra).
        const now = Date.now();
        const cutoff = now - TASK_SWITCH_WINDOW_MS;
        recentTaskStartsRef.current = [
          ...recentTaskStartsRef.current.filter((e) => e.at >= cutoff),
          { taskId: session.taskId, at: now },
        ];
        const distinctTasks = new Set(recentTaskStartsRef.current.map((e) => e.taskId));
        if (distinctTasks.size >= TASK_SWITCH_THRESHOLD) {
          recentTaskStartsRef.current = [];
          tryShow({ kind: "task-switching", taskTitle: task?.title ?? getTaskTitle(session.taskId) }, task);
          return;
        }

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
    // tick, em ordem de importância. Detectar um padrão aqui é uma
    // OPORTUNIDADE de interação, nunca uma obrigação - o resto do
    // pipeline (prioridade/recuo/limite de espaço/cota) ainda decide se
    // vale a pena mesmo assim.
    const periodicCheck = setInterval(() => {
      const session = useExecutionCompanionStore.getState().session;
      if (session) maybeAskToQuietDown();
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
            const reopenCount = (reopenCountByTaskRef.current.get(task.id) ?? 0) + 1;
            reopenCountByTaskRef.current.set(task.id, reopenCount);

            if (reopenCount >= 2) {
              tryShow({ kind: "repeated-reopen", taskTitle: task.title, reopenCount }, task);
            } else {
              tryShow({ kind: "reopened-task", taskTitle: task.title }, task);
            }
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
  const message = isTasksPage && enabled ? active : null;

  return {
    message,
    isSpeaking,
    listen,
    dismiss,
    respondToAction,
    pauseAutoDismiss,
    resumeAutoDismiss,
    getStatusSnapshot,
  };
}
