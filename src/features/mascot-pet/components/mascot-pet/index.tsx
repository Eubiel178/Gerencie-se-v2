"use client";

import { useEffect, useRef, useState } from "react";

import { usePathname } from "next/navigation";

import { updateAssistantPreferencesAction } from "@/features/assistant/actions";
import { phraseCompanionStatus } from "@/features/execution-companion/domain/companion-status-phrasing";
import { useTasksCompanion } from "@/features/execution-companion/hooks/use-tasks-companion";
import { IMascotState } from "@/features/focus/domain";
import {
  DEFAULT_MASCOT_CHARACTER_ID,
  MASCOT_CHARACTERS,
} from "@/features/mascot-pet/domain/characters";
import { isQuietModeRoute } from "@/features/mascot-pet/engine/quiet-mode-routes";
import { MascotRuntime } from "@/features/mascot-pet/engine/runtime";
import type { Gender } from "@/features/profile/get-gender";

import { CompanionStatusCard } from "../companion-status-card";
import { SpeechBubble } from "../speech-bubble";
import { VoiceControl } from "../voice-control";

import styles from "./styles.module.css";

// Duração fixa do cartão de estado (clicar no mascote) - não precisa da
// lógica adaptativa do balão espontâneo (sem ações, texto sempre curto).
const STATUS_CARD_DISPLAY_MS = 7000;

interface MascotPetProps {
  /** Id de personagem (ver `MASCOT_CHARACTERS`) - normalmente calculado a
   * partir da espécie escolhida em Configurações via
   * `characterIdForSpecies`. `undefined`/id desconhecido cai no padrão;
   * `null` explícito não renderiza nada (espécie escolhida ainda sem
   * atlas próprio). */
  characterId?: string | null;
  /** Estado completo do mascote (nome/personalidade) — usado só pelo
   * Companion de Tarefas (ver `useTasksCompanion`) pra saber COMO falar.
   * Opcional pra não quebrar quem monta `MascotPet` sem essa informação
   * (ex.: alguma vitrine futura). */
  mascot?: IMascotState;
  /** Companion ligado/desligado - MESMA fonte de verdade do Widget do
   * Assistant (`user_preference.assistant_enabled`), nunca uma flag
   * paralela. Desligado = zero interação proativa (nem balão, nem
   * insight do Widget), mas o mascote continua andando pela tela. */
  assistantEnabled?: boolean;
  /** Preferência persistida de fala automática (ver `user_preference.
   * assistant_auto_speech_enabled`) — este componente mantém uma cópia
   * otimista local pro controle de voz responder na hora, sem esperar o
   * server action voltar. */
  autoSpeechEnabled?: boolean;
  /** Convite único "quer que eu fale às vezes?" já foi respondido antes -
   * ver `VoiceControl`. */
  autoSpeechPromptShown?: boolean;
  /** Primeiro nome real do usuário (extraído do nome completo da sessão)
   * - usado OCASIONALMENTE pelo Companion (nunca em toda mensagem, ver
   * `useTasksCompanion`). `null` = sem nome disponível (conta Google sem
   * esse campo, por exemplo) - nunca quebra a personalização, só cai pro
   * fraseado neutro. */
  userFirstName?: string | null;
  /** Gênero informado em Configurações (nunca inferido do nome) - usado
   * só onde é gramaticalmente natural (ver `long-session` em
   * `companion-phrasing.ts`); `"nao_informado"` cai pro fraseado neutro. */
  userGender?: Gender;
}

/**
 * Bichinho de estimação 2D (PixiJS) que anda livremente pela tela,
 * sobreposto à interface - ver `engine/runtime.ts` pro motor real
 * (movimento/animação/estado), que roda inteiramente fora do React
 * (nenhum re-render por frame). Este componente só monta/desmonta o
 * runtime e nunca deve aparecer mais de uma vez na árvore (garantido
 * hoje por ser renderizado uma única vez em `src/app/home/layout.tsx`).
 */
export function MascotPet({
  characterId,
  mascot,
  assistantEnabled = true,
  autoSpeechEnabled: autoSpeechEnabledInitial = true,
  autoSpeechPromptShown: autoSpeechPromptShownInitial = false,
  userFirstName = null,
  userGender = "nao_informado",
}: MascotPetProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bubbleAnchorRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<MascotRuntime | null>(null);
  const pathname = usePathname();
  const resolvedId =
    characterId === null ? null : (characterId ?? DEFAULT_MASCOT_CHARACTER_ID);
  const character = resolvedId ? MASCOT_CHARACTERS[resolvedId] : undefined;

  // Cópias otimistas das preferências persistidas - o controle de voz
  // (ver `VoiceControl`) responde na hora, sem esperar o server action
  // voltar, e sem precisar abrir Configurações pra isso.
  const [autoSpeechEnabled, setAutoSpeechEnabled] = useState(autoSpeechEnabledInitial);
  const [promptShown, setPromptShown] = useState(autoSpeechPromptShownInitial);

  const { message, dismiss, respondToAction, pauseAutoDismiss, resumeAutoDismiss, getStatusSnapshot } = useTasksCompanion(
    mascot?.personality ?? "afetuoso",
    autoSpeechEnabled,
    assistantEnabled,
    { firstName: userFirstName, gender: userGender }
  );

  // Cartão de estado (clicar no mascote, sem arrastar - ver `onClick` em
  // `engine/runtime.ts`) - estado PRÓPRIO, independente do balão de fala
  // espontâneo acima: um clique deliberado da pessoa nunca deveria
  // disputar limite de espaço/cota com as interações que o Companion
  // inicia sozinho, nem ser cancelado por uma delas chegando no meio.
  const [statusCard, setStatusCard] = useState<string | null>(null);
  const statusCardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref sempre atualizado com o handler mais recente - o runtime do
  // PixiJS só é recriado quando `character` muda (ver efeito abaixo),
  // então o `onClick` passado a ele precisa indireção pra nunca ficar
  // preso a uma personalidade/estado antigos.
  const handleMascotClickRef = useRef<() => void>(() => {});
  useEffect(() => {
    handleMascotClickRef.current = () => {
      if (statusCardTimerRef.current) clearTimeout(statusCardTimerRef.current);
      const snapshot = getStatusSnapshot();
      const text = phraseCompanionStatus(snapshot, mascot?.personality ?? "afetuoso");
      setStatusCard(text);
      statusCardTimerRef.current = setTimeout(() => setStatusCard(null), STATUS_CARD_DISPLAY_MS);
    };
  });

  function dismissStatusCard() {
    if (statusCardTimerRef.current) clearTimeout(statusCardTimerRef.current);
    setStatusCard(null);
  }

  useEffect(() => {
    return () => {
      if (statusCardTimerRef.current) clearTimeout(statusCardTimerRef.current);
    };
  }, []);

  // Convite único de voz: só faz sentido perguntar depois que o Companion
  // já mostrou algo de verdade (a primeira mensagem É a "interação real"
  // depois da qual o pedido pede pra perguntar) - nunca antes disso, e
  // nunca mais depois de respondido uma vez.
  const showVoicePrompt = !promptShown && message !== null;

  function persistPreferences(patch: { autoSpeechEnabled?: boolean; autoSpeechPromptShown?: boolean }) {
    updateAssistantPreferencesAction(patch).catch(() => {
      // Falhou silenciosamente do lado do servidor - a cópia otimista
      // local continua valendo pro resto desta sessão de navegador; na
      // próxima carga de página, o valor real persistido volta a valer.
    });
  }

  function toggleAutoSpeech() {
    const next = !autoSpeechEnabled;
    setAutoSpeechEnabled(next);
    persistPreferences({ autoSpeechEnabled: next });
  }

  function answerVoicePrompt(enable: boolean) {
    setAutoSpeechEnabled(enable);
    setPromptShown(true);
    persistPreferences({ autoSpeechEnabled: enable, autoSpeechPromptShown: true });
  }

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !character) return;

    const runtime = new MascotRuntime({ wrapper }, character, {
      // Move o anchor do balão de fala junto do bichinho, sem passar pelo
      // React a cada frame (mesmo raciocínio de performance do resto do
      // motor) - centralizado horizontalmente sobre o sprite, o próprio
      // CSS do balão (`bottom: 100%`) cuida de ficar acima dele.
      onPositionChange: (position) => {
        const anchor = bubbleAnchorRef.current;
        if (!anchor) return;
        const centerX = position.x + (character.displayWidth ?? character.frameWidth) / 2;
        anchor.style.transform = `translate(${Math.round(centerX)}px, ${Math.round(position.y)}px)`;
      },
      onClick: () => handleMascotClickRef.current(),
    });
    runtimeRef.current = runtime;
    let cancelled = false;

    runtime.mount().catch((error: unknown) => {
      if (!cancelled)
        console.error("[mascot-pet] falha ao inicializar o PixiJS", error);
    });

    return () => {
      cancelled = true;
      runtimeRef.current = null;
      runtime.destroy();
    };
    // Reexecuta (destrói e remonta com o novo bicho) quando a espécie
    // escolhida em Configurações muda - `character` já é a referência
    // certa pro id atual.
  }, [character]);

  // Modo Foco (e outras rotas densas — ver `QUIET_MODE_ROUTE_PREFIXES` em
  // `engine/quiet-mode-routes.ts` pro motivo de cada uma): presença
  // reduzida enquanto a pessoa está tentando se concentrar - "no conflito
  // entre personalidade e concentração, concentração vence" (pedido
  // explícito). Efeito separado do de montagem: só precisa reagir a
  // MUDANÇA de rota, nunca remonta o runtime inteiro por isso.
  useEffect(() => {
    runtimeRef.current?.setQuietMode(isQuietModeRoute(pathname));
  }, [pathname]);

  if (!character) return null;

  return (
    <>
      <div className={styles.stage} aria-hidden="true">
        <div ref={wrapperRef} className={styles.wrapper} />
      </div>

      {/* Fora do `aria-hidden` do palco decorativo acima - o conteúdo
          carrega texto de verdade (`role="status"`), então precisa
          continuar anunciável por leitor de tela. Um clique deliberado
          (cartão de estado) tem prioridade visual sobre uma fala
          espontânea que porventura já estivesse no ar - a interação que
          a PESSOA acabou de pedir vence a que o Companion iniciou
          sozinho; a fala espontânea, se ainda não tiver expirado, volta a
          aparecer sozinha quando o cartão fechar. */}
      <div ref={bubbleAnchorRef} className={styles.bubbleAnchor}>
        {statusCard ? (
          <CompanionStatusCard text={statusCard} onDismiss={dismissStatusCard} />
        ) : (
          message && (
            <SpeechBubble
              text={message.phrase.written}
              taskTitle={message.taskTitle}
              actions={message.actions}
              onDismiss={dismiss}
              onAction={respondToAction}
              onPauseAutoDismiss={pauseAutoDismiss}
              onResumeAutoDismiss={resumeAutoDismiss}
            />
          )
        )}
      </div>

      {assistantEnabled && (
        <VoiceControl
          autoSpeechEnabled={autoSpeechEnabled}
          showPrompt={showVoicePrompt}
          onToggle={toggleAutoSpeech}
          onAnswerPrompt={answerVoicePrompt}
        />
      )}
    </>
  );
}
