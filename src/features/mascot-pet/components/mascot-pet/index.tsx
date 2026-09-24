"use client";

import { useEffect, useRef, useState } from "react";

import { usePathname } from "next/navigation";

import { Button, Modal, ModalHeader } from "@/components";
import { Icon } from "@/components/icon";
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
import { isNarrowContentViewport } from "@/features/mascot-pet/engine/viewport-bounds";
import type { Gender } from "@/features/profile/get-gender";

import { CompanionStatusCard } from "../companion-status-card";
import { SpeechBubble } from "../speech-bubble";
import { VoiceControl } from "../voice-control";

import styles from "./styles.module.css";

// Duração fixa do cartão de estado (clicar no mascote) - não precisa da
// lógica adaptativa do balão espontâneo (sem ações, texto sempre curto).
const STATUS_CARD_DISPLAY_MS = 7000;

// Opção A do comportamento móvel: depois de ~200ms sem evento de scroll,
// considera-se que o scroll "terminou" e o mascote pode retomar o passeio.
// Longo o bastante pra não alternar em cada micro-gesto, curto o bastante
// pra não deixar o bichinho travado depois de parar.
const SCROLL_SETTLE_MS = 200;

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
  /** A introdução contextual da Execução Acompanhada (ver `isFirstEver`
   * em `companion-phrasing.ts`) já foi mostrada antes - `false` numa
   * conta nova, que ainda nunca clicou "Começar" em nada. */
  hasSeenExecutionIntro?: boolean;
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
  hasSeenExecutionIntro = false,
  userFirstName = null,
  userGender = "nao_informado",
}: MascotPetProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bubbleAnchorRef = useRef<HTMLDivElement>(null);
  const voiceBadgeAnchorRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<MascotRuntime | null>(null);
  const pathname = usePathname();
  const resolvedId =
    characterId === null ? null : (characterId ?? DEFAULT_MASCOT_CHARACTER_ID);
  const character = resolvedId ? MASCOT_CHARACTERS[resolvedId] : undefined;

  // Único dono do controle de fala automática - o selo que liga/desliga
  // mora no próprio mascote (ver `voiceBadgeAnchorRef` abaixo), então não
  // há mais um segundo componente irmão precisando ler o mesmo valor em
  // sincronia (motivo original do store compartilhado, hoje removido).
  const [autoSpeechEnabled, setAutoSpeechEnabled] = useState(autoSpeechEnabledInitial);
  const [promptShown, setPromptShown] = useState(autoSpeechPromptShownInitial);

  const { message, dismiss, respondToAction, pauseAutoDismiss, resumeAutoDismiss, getStatusSnapshot } = useTasksCompanion(
    mascot?.personality ?? "afetuoso",
    autoSpeechEnabled,
    assistantEnabled,
    { firstName: userFirstName, gender: userGender },
    hasSeenExecutionIntro
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
  //
  // NUNCA amarrado à duração do balão espontâneo em si (bug corrigido):
  // antes disso, `showVoicePrompt` dependia direto de `message !== null`,
  // então o convite sumia junto com o balão que o disparou - muitas vezes
  // rápido demais (4-12s) pra alguém ler e decidir uma pergunta que é
  // SEPARADA do que o balão estava dizendo. Uma vez que a primeira
  // mensagem de verdade aconteceu, o convite abre com sua PRÓPRIA
  // duração, independente de quanto tempo o balão que o disparou durou.
  const [voicePromptOpen, setVoicePromptOpen] = useState(false);
  const voicePromptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (promptShown || voicePromptOpen || message === null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVoicePromptOpen(true);
    voicePromptTimerRef.current = setTimeout(() => setVoicePromptOpen(false), 15_000);
  }, [message, promptShown, voicePromptOpen]);
  useEffect(() => {
    return () => {
      if (voicePromptTimerRef.current) clearTimeout(voicePromptTimerRef.current);
    };
  }, []);
  const showVoicePrompt = !promptShown && voicePromptOpen;

  function persistPreferences(patch: { autoSpeechEnabled?: boolean; autoSpeechPromptShown?: boolean }) {
    updateAssistantPreferencesAction(patch).catch(() => {
      // Falhou silenciosamente do lado do servidor - a cópia otimista
      // local continua valendo pro resto desta sessão de navegador; na
      // próxima carga de página, o valor real persistido volta a valer.
    });
  }

  function answerVoicePrompt(enable: boolean) {
    if (voicePromptTimerRef.current) clearTimeout(voicePromptTimerRef.current);
    setAutoSpeechEnabled(enable);
    setPromptShown(true);
    persistPreferences({ autoSpeechEnabled: enable, autoSpeechPromptShown: true });
  }

  // Selo de voz ANCORADO NO PRÓPRIO MASCOTE (não no widget do Assistant -
  // tentativa anterior, corrigida: um selo pendurado no avatar do widget
  // não lia como "isso é sobre o bichinho falar", já que os dois vivem em
  // cantos opostos da tela). Sempre pede confirmação antes de mudar,
  // nunca alterna direto no clique (pedido explícito).
  const [isConfirmingVoice, setIsConfirmingVoice] = useState(false);
  function confirmVoiceToggle() {
    const next = !autoSpeechEnabled;
    setAutoSpeechEnabled(next);
    persistPreferences({ autoSpeechEnabled: next });
    setIsConfirmingVoice(false);
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
        if (anchor) {
          const centerX = position.x + (character.displayWidth ?? character.frameWidth) / 2;
          anchor.style.transform = `translate(${Math.round(centerX)}px, ${Math.round(position.y)}px)`;
        }
        // Selo de voz no canto SUPERIOR direito do bichinho DE VERDADE, não
        // do frame inteiro. Raças de cachorro/gato (golden, akita, os 6
        // gatos - ver `dogBreedOptions`/`catBreedOptions` em
        // `domain/characters.ts`) reservam um frame bem maior que o bicho
        // visível (~33%/38% de preenchimento, o resto é folga transparente
        // pras pernas esticarem andando) - usar o frame inteiro deixava o
        // selo flutuando longe do bicho pra essas raças (achado real:
        // "ficou muito longe"). `contentFillRatio` (mesmo dado usado pelo
        // avatar circular do widget) corrige isso; pra quem não define
        // esse campo (panda, raposa, urso, gato/cachorro originais) o
        // cálculo cai de volta pro frame inteiro, sem mudança de
        // comportamento. Assume o bicho centralizado dentro do frame - uma
        // aproximação razoável sem coordenadas exatas de recorte por raça.
        const badgeAnchor = voiceBadgeAnchorRef.current;
        if (badgeAnchor) {
          const width = character.displayWidth ?? character.frameWidth;
          const height = character.displayHeight ?? character.frameHeight;
          const fillRatio = character.contentFillRatio ?? 1;
          const visibleRight = position.x + width / 2 + (width * fillRatio) / 2;
          const visibleTop = position.y + height / 2 - (height * fillRatio) / 2;
          const gap = Math.max(6, width * fillRatio * 0.06);
          const badgeX = visibleRight + gap;
          const badgeY = visibleTop - gap;
          badgeAnchor.style.transform = `translate(${Math.round(badgeX)}px, ${Math.round(badgeY)}px)`;
        }
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

// Quiet mode combinado, MESMO `setQuietMode` do runtime:
// quiet por ROTA (Modo Foco e outras rotas densas — ver
// `QUIET_MODE_ROUTE_PREFIXES` em `engine/quiet-mode-routes.ts` pro motivo
// de cada uma) OU quiet por SCROLL (telas estreitas — ver o efeito de
// scroll abaixo). Um `ref` + efeito de sincronização para o listener de
// scroll consultar o último valor sem re-criar listener nem remontar o
// runtime: efeito separado do de montagem, só reage a MUDANÇA de rota.
const scrollQuietRef = useRef(false);
const syncQuietRef = useRef<() => void>(() => {});
useEffect(() => {
  syncQuietRef.current = () => {
    runtimeRef.current?.setQuietMode(isQuietModeRoute(pathname) || scrollQuietRef.current);
  };
  syncQuietRef.current();
}, [pathname]);

// Opção A (telas/colunas estreitas, ver `isNarrowContentViewport`):
// enquanto a área principal rola, o mascote PARA de passear e fica
// recolhido na posição segura (o canto confinado dos bounds) usando o
// quiet mode existente — NUNCA escondido, só imóvel e presente. Quando o
// scroll para por `SCROLL_SETTLE_MS`, retoma o passeio normalmente, sem
// movimentos bruscos próprios (o quiet mode é idempotente enquanto já
// quieto — ver `MascotBehavior.setQuietMode`). Desktop largo segue como
// antes (sem quiet por scroll: o mascote rola por espaço vazio).
useEffect(() => {
  let settleTimer: number | null = null;

  const onScroll = () => {
    if (!isNarrowContentViewport()) return;
    scrollQuietRef.current = true;
    syncQuietRef.current();
    if (settleTimer !== null) window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      scrollQuietRef.current = false;
      syncQuietRef.current();
    }, SCROLL_SETTLE_MS);
  };

  // `capture` pega scroll de QUALQUER container (a área principal rola
  // via `body`; painéis internos também existem); `passive` porque nunca
  // cancelamos o scroll.
  window.addEventListener("scroll", onScroll, { capture: true, passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll, { capture: true });
    if (settleTimer !== null) window.clearTimeout(settleTimer);
  };
}, []);

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

      {/* Selo de voz preso ao PRÓPRIO bichinho (canto inferior direito do
          corpo, ver cálculo em `onPositionChange` acima) - não ao widget do
          Assistant. Sempre pede confirmação antes de mudar (nunca alterna
          direto no clique). Continua visível no mobile junto com o mascote
          (não há mais `@media` que esconda o palco em telas estreitas - o
          toggle equivalente em Configurações segue como alternativa). */}
      {assistantEnabled && (
        <div ref={voiceBadgeAnchorRef} className={styles.voiceBadgeAnchor}>
          <button
            type="button"
            className={styles.voiceBadge}
            aria-pressed={autoSpeechEnabled}
            aria-label={autoSpeechEnabled ? "Desligar a fala do Companion" : "Ligar a fala do Companion"}
            onClick={() => setIsConfirmingVoice(true)}
          >
            <Icon name={autoSpeechEnabled ? "MdVolumeUp" : "MdVolumeOff"} size={14} />
          </button>
        </div>
      )}

      {assistantEnabled && showVoicePrompt && <VoiceControl onAnswerPrompt={answerVoicePrompt} />}

      {isConfirmingVoice && (
        <Modal onClose={() => setIsConfirmingVoice(false)}>
          <ModalHeader
            title={autoSpeechEnabled ? "Desligar a fala do Companion?" : "Ligar a fala do Companion?"}
            onClose={() => setIsConfirmingVoice(false)}
          />
          <p className={styles.confirmVoiceText}>
            {autoSpeechEnabled
              ? "Ele continua escrevendo normalmente, só para de falar em voz alta."
              : "Além de escrever, ele também vai falar em voz alta de vez em quando."}
          </p>
          <div className={styles.confirmVoiceActions}>
            <Button.Root type="button" variant="secondary" onClick={() => setIsConfirmingVoice(false)}>
              Cancelar
            </Button.Root>
            <Button.Root type="button" onClick={confirmVoiceToggle}>
              {autoSpeechEnabled ? "Desligar" : "Ligar"}
            </Button.Root>
          </div>
        </Modal>
      )}
    </>
  );
}
