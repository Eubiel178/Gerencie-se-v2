"use client";

import { useEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

import { usePathname, useRouter } from "next/navigation";

import { useMobileNavStore } from "@/components/header/mobile-nav-store";
import { getFocusableElements } from "@/components/modal/get-focusable-elements";
import type { MascotPersonality } from "@/features/focus/domain";

import { dismissGuidedTourAction } from "../../actions";
import { buildGuidedTourSteps, GUIDED_TOUR_MOBILE_BREAKPOINT_PX, GuidedTourStep } from "../../domain/steps";
import { useGuidedTourStore } from "../../guided-tour-store";

import styles from "./styles.module.css";

const MOBILE_BREAKPOINT_PX = GUIDED_TOUR_MOBILE_BREAKPOINT_PX;
// Os únicos 2 alvos que só existem DENTRO do painel de navegação mobile
// (ver `Header`) — todo resto (checklist, mascote, botões de página) já
// fica no conteúdo normal da página, visível em qualquer largura sem
// precisar abrir nada primeiro.
const MOBILE_NAV_PANEL_TARGETS = new Set(['[data-tour="nav"]', '[data-tour="search"]']);
const SPOTLIGHT_PADDING = 8;
const TOOLTIP_WIDTH = 320;
const VIEWPORT_MARGIN = 16;
const PLACEMENT_GAP = 14;
// Estimativa conservadora da altura do tooltip (maior texto entre os passos
// + título + contador + botões + padding), usada só pra CLAMPAR a posição
// vertical dentro da tela — nunca a altura real de renderização (ver
// `.tooltip` em styles.module.css, que tem `max-height`/`overflow-y`
// como rede de segurança caso esta estimativa seja curta demais).
const TOOLTIP_MAX_HEIGHT_ESTIMATE = 280;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top?: number;
  bottom?: number;
  left: number;
}

function measure(el: Element): Rect {
  const rect = el.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

function isVisibleTarget(el: Element | null): el is Element {
  return !!el && el.getClientRects().length > 0;
}

function tooltipPositionFor(rect: Rect | null): TooltipPosition {
  const tooltipWidth = Math.min(TOOLTIP_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
  if (!rect) {
    // Passo "solto" (boas-vindas/fim) - centralizado na tela.
    return { top: window.innerHeight / 2 - 90, left: window.innerWidth / 2 - tooltipWidth / 2 };
  }

  const left = Math.min(
    Math.max(rect.left, VIEWPORT_MARGIN),
    window.innerWidth - tooltipWidth - VIEWPORT_MARGIN
  );

  // Limite superior de `top`/`bottom` pra garantir que o tooltip inteiro
  // caiba na tela mesmo com a estimativa de altura acima — sem isto, um
  // alvo alto (ex.: a `<nav>` inteira da sidebar, no passo "nav") empurrava
  // `top` pra muito além do rodapé em notebooks de tela mais baixa, cortando
  // o tooltip (achado relatado: "a tela corta a bolha, o texto some").
  const maxTop = window.innerHeight - TOOLTIP_MAX_HEIGHT_ESTIMATE - VIEWPORT_MARGIN;

  // Sem medir a altura real do tooltip (ainda não renderizou) - decide o
  // lado pela posição vertical do alvo: mais na metade de baixo da tela,
  // o tooltip vai por CIMA (ancorado por `bottom`, que não depende de
  // saber a altura); mais em cima, vai por BAIXO (`top`).
  if (rect.top > window.innerHeight / 2) {
    const bottom = window.innerHeight - rect.top + PLACEMENT_GAP;
    // Equivalente ao clamp de `top` acima, só que medido a partir do
    // rodapé: um `bottom` grande demais empurraria o topo do tooltip pra
    // cima da tela (mesmo bug, lado oposto).
    const maxBottom = window.innerHeight - TOOLTIP_MAX_HEIGHT_ESTIMATE - VIEWPORT_MARGIN;
    return { bottom: Math.min(Math.max(bottom, VIEWPORT_MARGIN), maxBottom), left };
  }
  const top = rect.top + rect.height + PLACEMENT_GAP;
  return { top: Math.min(Math.max(top, VIEWPORT_MARGIN), Math.max(maxTop, VIEWPORT_MARGIN)), left };
}

interface GuidedTourProps {
  active: boolean;
  mascotName: string;
  mascotPersonality: MascotPersonality;
  /** URL do avatar do mascote (ver `mascotAvatarUrl`) - usado só no passo
   * do mascote (`speaksAsCompanion`), como "remetente" do balão. `null` =
   * espécie ainda sem avatar próprio, o passo cai pro layout sem imagem. */
  mascotAvatar: string | null;
  userId: string;
}

// Quanto tempo esperar (tentando de novo a cada 150ms) até desistir de
// um alvo e pular o passo - bem mais longo pra passo que navega (a rota
// nova precisa terminar de buscar dado + renderizar) do que pra passo na
// mesma página (o elemento já deveria existir, só um resíduo de
// segurança contra alguma renderização ainda em andamento).
const TARGET_WAIT_MS_SAME_PAGE = 1000;
const TARGET_WAIT_MS_AFTER_NAVIGATION = 4000;
const TARGET_POLL_INTERVAL_MS = 150;

// Sem isto, qualquer recarregamento de página (F5, ou um link/atalho que
// force navegação completa em vez de troca de rota via cliente) reiniciava
// o passo pra 0 - como o passo 0 quase sempre aponta pra `/home`, isso
// arrastava de volta pro painel geral qualquer pessoa que tivesse
// recarregado a página no meio do tour em QUALQUER outra rota (achado:
// confirmado navegando direto pra uma URL de outra página com o tour
// ainda ativo). `sessionStorage` (não `localStorage`): é progresso de
// UMA sessão de tour, não uma preferência que devesse sobreviver a fechar
// a aba.
const STEP_INDEX_STORAGE_KEY = "gerencie-se:guided-tour-step-index";

// Guardado por ID do usuário (não uma chave fixa) - sem isso, trocar de
// conta no mesmo navegador com as duas ainda com tour ativo (nenhuma
// dispensou ainda) herdava o passo salvo da conta anterior, porque o guard
// de "só lê se `active`" não ajuda quando as DUAS contas têm `active: true`
// (achado numa revisão de código). E guardado pelo `id` do passo, não pelo
// índice numérico: a lista de passos disponíveis (`computeInitialSteps`)
// varia por rota/DOM, então o mesmo índice pode apontar pra um passo
// totalmente diferente depois de um F5 numa rota diferente da que o tour
// estava quando salvou.
function storageKey(userId: string): string {
  return `${STEP_INDEX_STORAGE_KEY}:${userId}`;
}

function readStoredStepId(userId: string): string | null {
  try {
    return window.sessionStorage.getItem(storageKey(userId));
  } catch {
    // Navegação privada ou storage bloqueado - continua funcionando,
    // só sem lembrar o passo entre recarregamentos.
    return null;
  }
}

function writeStoredStepId(userId: string, stepId: string | null): void {
  try {
    if (stepId === null) {
      window.sessionStorage.removeItem(storageKey(userId));
    } else {
      window.sessionStorage.setItem(storageKey(userId), stepId);
    }
  } catch {
    // Mesmo caso de `readStoredStepId` - falha silenciosa.
  }
}

function resolveStepIndex(steps: GuidedTourStep[], storedStepId: string | null): number {
  if (!storedStepId) return 0;
  const index = steps.findIndex((step) => step.id === storedStepId);
  return index === -1 ? 0 : index;
}

// Monta a lista de passos, filtrando o que já dá pra saber de antemão
// que não vai rolar. Roda tanto em desktop quanto em mobile — os dois
// passos que apontam pra dentro da navegação ("nav"/"search") existem
// fisicamente só dentro do painel mobile quando ele está ABERTO (ver
// `Header`), então essa checagem aqui embaixo (com o painel fechado,
// estado inicial) nunca teria como achá-los ainda; entram otimistas
// igual um passo com `step.path` de outra rota, e é o próprio
// `resolveStep` (mais abaixo) quem abre o painel na hora de exibir
// esses dois passos especificamente. Passos cujo alvo é da MESMA página
// atual, não precisa do painel mobile, e mesmo assim não existe nela
// (ex.: usuário caiu direto numa rota inesperada) são descartados aqui.
// Só é chamada dentro do inicializador de `useState` abaixo - este
// componente só existe no cliente (ver `lazy.tsx`, `ssr: false`), então
// `document`/`window` sempre existem quando isto roda.
function computeInitialSteps(
  active: boolean,
  mascotName: string,
  mascotPersonality: MascotPersonality
): GuidedTourStep[] | null {
  if (!active) return null;

  const allSteps = buildGuidedTourSteps(mascotName, mascotPersonality);
  const currentPath = window.location.pathname;
  const isMobileViewport = window.innerWidth <= MOBILE_BREAKPOINT_PX;
  const available = allSteps.filter((step) => {
    if (!step.target) return true;
    if (isMobileViewport && MOBILE_NAV_PANEL_TARGETS.has(step.target)) return true;
    if (step.path && step.path !== currentPath) return true;
    return isVisibleTarget(document.querySelector(step.target));
  });
  return available.length > 0 ? available : null;
}

/** Espera até `timeoutMs` (tentando a cada `TARGET_POLL_INTERVAL_MS`)
 * pelo elemento do seletor aparecer no DOM - usado depois de navegar pra
 * uma rota nova, cujo conteúdo ainda pode estar sendo buscado/renderizado. */
function waitForTarget(selector: string, timeoutMs: number): Promise<Element | null> {
  return new Promise((resolve) => {
    const start = Date.now();

    function attempt() {
      const el = document.querySelector(selector);
      if (el) {
        resolve(el);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        resolve(null);
        return;
      }
      setTimeout(attempt, TARGET_POLL_INTERVAL_MS);
    }

    attempt();
  });
}

/** Mesmo raciocínio de `computeInitialSteps`, mas ESPERANDO cada alvo
 * aparecer (`waitForTarget`) em vez de checar o DOM uma única vez -
 * usado só na REATIVAÇÃO (replay a partir de Configurações), nunca no
 * primeiro carregamento de página. Bug real corrigido: mesmo depois de
 * confirmar `pathname === "/home"` (ver o efeito que chama isto), a
 * navegação client-side do Next pode terminar ANTES do conteúdo
 * assíncrono do Dashboard (checklist/mascote) montar de verdade - uma
 * checagem síncrona nesse instante ainda descartava esses passos por
 * engano. */
async function computeInitialStepsAwaitingTargets(
  mascotName: string,
  mascotPersonality: MascotPersonality
): Promise<GuidedTourStep[] | null> {
  const allSteps = buildGuidedTourSteps(mascotName, mascotPersonality);
  const currentPath = window.location.pathname;
  const isMobileViewport = window.innerWidth <= MOBILE_BREAKPOINT_PX;
  const available: GuidedTourStep[] = [];

  for (const step of allSteps) {
    if (!step.target) {
      available.push(step);
      continue;
    }
    if (isMobileViewport && MOBILE_NAV_PANEL_TARGETS.has(step.target)) {
      available.push(step);
      continue;
    }
    if (step.path && step.path !== currentPath) {
      available.push(step);
      continue;
    }
    const el = await waitForTarget(step.target, TARGET_WAIT_MS_AFTER_NAVIGATION);
    if (isVisibleTarget(el)) available.push(step);
  }

  return available.length > 0 ? available : null;
}

export function GuidedTour({ active, mascotName, mascotPersonality, mascotAvatar, userId }: GuidedTourProps) {
  const router = useRouter();
  const pathname = usePathname();
  // Ref (não outro useState) só pra não rodar `computeInitialSteps` -
  // que filtra passos e faz `document.querySelector` por passo - duas
  // vezes na mesma montagem só porque `steps` e `stepIndex` precisam do
  // mesmo array inicial (achado numa revisão de código). Mutação durante a
  // renderização é segura aqui porque é idempotente e só acontece uma vez,
  // no cálculo lazy dos dois `useState` abaixo.
  const initialStepsRef = useRef<GuidedTourStep[] | null | undefined>(undefined);
  function getInitialSteps(): GuidedTourStep[] | null {
    if (initialStepsRef.current === undefined) {
      initialStepsRef.current = computeInitialSteps(active, mascotName, mascotPersonality);
    }
    return initialStepsRef.current;
  }

  const [steps, setSteps] = useState<GuidedTourStep[] | null>(() => getInitialSteps());
  const [stepIndex, setStepIndex] = useState(() => {
    const initialSteps = getInitialSteps();
    // Só lê o passo salvo se o tour estiver de fato ativo agora - sem
    // isso, entrar numa conta que já dispensou o tour podia herdar o
    // passo salvo de uma sessão de tour anterior (a chave já é isolada
    // por `userId`, isto aqui cobre o caso de reativar o tour da MESMA
    // conta puxando um resíduo antigo).
    if (!active || !initialSteps) {
      writeStoredStepId(userId, null);
      return 0;
    }
    return resolveStepIndex(initialSteps, readStoredStepId(userId));
  });
  const [finished, setFinished] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wasActiveRef = useRef(active);
  // A ativação (replay) pediu pra ir pra `/home` mas ainda não chegou lá -
  // ver o efeito abaixo que consome isto assim que `pathname` virar
  // "/home" de verdade, em vez de calcular os passos contra a página
  // ERRADA (ver comentário do próximo efeito).
  const pendingActivationRef = useRef(false);
  // Descarta uma resolução assíncrona velha se uma reativação mais nova
  // começar no meio do caminho (mesmo raciocínio de `generationRef` em
  // `use-tasks-companion.ts`) - improvável (reativação não é algo que
  // aconteça em rajada), mas barato de garantir.
  const activationTokenRef = useRef(0);

  async function activateFreshTour() {
    const token = ++activationTokenRef.current;
    setStepIndex(0);
    setFinished(false);
    // "Rever tour guiado" começa do zero de propósito - nunca deveria
    // reaproveitar o passo salvo de uma sessão de tour anterior.
    writeStoredStepId(userId, null);

    const resolvedSteps = await computeInitialStepsAwaitingTargets(mascotName, mascotPersonality);
    if (token !== activationTokenRef.current) return;
    setSteps(resolvedSteps);
  }

  // `GuidedTour` mora no layout persistente (`src/app/home/layout.tsx`) e
  // NÃO remonta ao navegar entre páginas de `/home/**` - então o
  // `useState(() => computeInitialSteps(...))` acima só roda UMA vez, na
  // primeira montagem. Rever o tour (Configurações → Conta → "Rever tour
  // guiado") muda `active` de false pra true via `revalidatePath`, mas
  // sem isto aqui o `steps` continuava congelado em `null` pra sempre -
  // só um F5 recarregava o componente do zero e recalculava certo (bug
  // relatado: "clico em rever e não acontece nada, só funciona depois de
  // recarregar a página"). Recalcula de propósito só na TRANSIÇÃO
  // false→true, não a cada mudança de `active`.
  //
  // Bug real corrigido: `revalidatePath("/home")` (ver `resetGuidedTourAction`)
  // faz `active` virar `true` na hora, ENQUANTO A PÁGINA AINDA É a de
  // Configurações (de onde "Rever tutorial" foi clicado) - o `router.push`
  // pro Dashboard só roda depois, no chamador (`ReplayTourButton`). Calcular
  // os passos disponíveis synchronous aqui, contra `window.location.pathname`
  // sendo `/home/settings`, fazia todo passo sem `path` próprio (checklist,
  // mascote - "mesma página do passo anterior") ser checado contra o DOM
  // ERRADO e descartado pra sempre nessa sessão do tour (sobrava só
  // boas-vindas/nav/new-task/fim). Se ainda não estamos em `/home` quando a
  // reativação acontece, navega pra lá primeiro e adia o cálculo pro efeito
  // seguinte, que reage a `pathname` virar `/home` de verdade.
  useEffect(() => {
    if (active && !wasActiveRef.current) {
      if (window.location.pathname === "/home") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reage a `active` virar true (prop vinda do servidor via `revalidatePath`), não é estado derivável durante o render.
        activateFreshTour();
      } else {
        pendingActivationRef.current = true;
        router.push("/home");
      }
    }
    wasActiveRef.current = active;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, mascotName, mascotPersonality, userId, router]);

  useEffect(() => {
    if (!pendingActivationRef.current || pathname !== "/home") return;
    pendingActivationRef.current = false;
    activateFreshTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lembra o passo atual entre recarregamentos de página (ver comentário
  // de `STEP_INDEX_STORAGE_KEY`) - grava a cada mudança de passo, nunca
  // no passo inicial lido do storage (senão reescreveria o mesmo valor
  // à toa a cada montagem).
  useEffect(() => {
    if (!steps) return;
    writeStoredStepId(userId, steps[stepIndex]?.id ?? null);
  }, [steps, stepIndex, userId]);

  const step = steps?.[stepIndex] ?? null;
  const [rect, setRect] = useState<Rect | null>(null);

  // Navega (se o passo pedir uma rota diferente da atual) e só então
  // mede o alvo - com retentativa, porque depois de navegar o conteúdo
  // real ainda pode estar sendo buscado. Se o alvo nunca aparecer
  // (timeout), pula pro próximo passo sozinho em vez de travar o tour
  // apontando pro nada.
  useEffect(() => {
    if (!step) return;
    let cancelled = false;

    async function resolveStep() {
      // Os 2 alvos que só existem DENTRO do painel de navegação mobile
      // (ver `MOBILE_NAV_PANEL_TARGETS`) precisam do painel aberto ANTES
      // de esperar por eles - sem isso, `waitForTarget` sempre estouraria
      // o timeout no mobile (o elemento nunca chega a existir sozinho).
      // Qualquer outro passo (incluindo os sem alvo, como boas-vindas/fim)
      // fecha o painel, caso tenha ficado aberto do passo anterior - nunca
      // faz sentido continuar cobrindo a tela enquanto o tour aponta pra
      // outra coisa. Checado ANTES de navegar/esperar o alvo.
      const isMobileViewport = window.innerWidth <= MOBILE_BREAKPOINT_PX;
      if (isMobileViewport && step!.target && MOBILE_NAV_PANEL_TARGETS.has(step!.target)) {
        useMobileNavStore.getState().open();
      } else {
        useMobileNavStore.getState().close();
      }

      const needsNavigation = !!step!.path && step!.path !== window.location.pathname;
      if (needsNavigation) router.push(step!.path!);

      if (!step!.target) {
        if (!cancelled) setRect(null);
        return;
      }

      const timeout = needsNavigation ? TARGET_WAIT_MS_AFTER_NAVIGATION : TARGET_WAIT_MS_SAME_PAGE;
      const el = await waitForTarget(step!.target, timeout);
      if (cancelled) return;

      if (!isVisibleTarget(el)) {
        // Alvo não apareceu a tempo - pula este passo (nunca trava o
        // tour apontando pro nada). Último passo nesse estado só fecha.
        setStepIndex((current) => (current + 1 < (steps?.length ?? 0) ? current + 1 : current));
        if (stepIndex + 1 >= (steps?.length ?? 0)) finish();
        return;
      }

      setRect(measure(el));
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    resolveStep();

    function recompute() {
      if (!step!.target) return;
      const el = document.querySelector(step!.target);
      if (el) setRect(measure(el));
    }

    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, { capture: true, passive: true });
    return () => {
      cancelled = true;
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function finish() {
    setFinished(true);
    writeStoredStepId(userId, null);
    // Se o tour terminou enquanto destacava navegação/busca no mobile,
    // não deixe o painel lateral aberto e cobrindo a tela depois que o
    // tooltip desaparece.
    useMobileNavStore.getState().close();
    await dismissGuidedTourAction();
  }

  // Trava de foco/teclado - mesmo padrão de `components/modal` (Escape
  // pula o tour inteiro; Tab nunca escapa pro resto da página por trás).
  useEffect(() => {
    if (!step) return;

    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const [firstFocusable] = getFocusableElements(container);
    (firstFocusable ?? container).focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        finish();
        return;
      }
      if (event.key !== "Tab" || !container) return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocused?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, steps]);

  const isRenderingTour = !!steps && !!step && !finished;

  // Avisa `useGuidedTourStore` sempre que o tour passa a mostrar (ou
  // parar de mostrar) um tooltip de verdade na tela - achado real: a
  // fala espontânea do Companion (saudação de presença) disputava o
  // mesmo espaço de tela com o tooltip do tour, com o balão cortado por
  // baixo dele. `useTasksCompanion` lê isso pra ficar em silêncio
  // enquanto o tour está com um passo visível.
  useEffect(() => {
    useGuidedTourStore.getState().setActive(isRenderingTour);
  }, [isRenderingTour]);
  useEffect(() => {
    return () => useGuidedTourStore.getState().setActive(false);
  }, []);

  if (!steps || !step || finished) return null;

  const isLast = stepIndex === steps.length - 1;
  const position = tooltipPositionFor(rect);

  return createPortal(
    <div className={styles.overlay}>
      {/* Um único elemento cobrindo a tela inteira: escurece tudo E
          bloqueia clique em qualquer coisa por trás - de propósito
          nenhum "buraco" de verdade sobre o alvo (o destaque abaixo é só
          visual), porque durante o tour a única forma de avançar é pelos
          botões do próprio tooltip, nunca clicando no elemento apontado
          (clicar nele, ex. um link de navegação, tiraria o usuário da
          página no meio do tour). */}
      <div className={styles.backdrop} />

      {rect && (
        <div
          className={styles.spotlight}
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
          }}
        />
      )}

      <div
        ref={containerRef}
        className={step.speaksAsCompanion ? `${styles.tooltip} ${styles.companionTooltip}` : styles.tooltip}
        style={{ width: Math.min(TOOLTIP_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2), top: position.top, bottom: position.bottom, left: position.left }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guided-tour-title"
        tabIndex={-1}
      >
        {step.speaksAsCompanion ? (
          <div className={styles.companionSender}>
            {mascotAvatar && (
              // eslint-disable-next-line @next/next/no-img-element -- avatar pequeno dentro de um overlay client-only, sem necessidade do pipeline de otimização do `next/image` aqui.
              <img src={mascotAvatar} alt="" className={styles.companionAvatar} />
            )}
            <h2 id="guided-tour-title" className={styles.companionName}>
              {step.title}
            </h2>
          </div>
        ) : (
          <>
            <p className={styles.step}>
              {stepIndex + 1} de {steps.length}
            </p>
            <h2 id="guided-tour-title" className={styles.title}>
              {step.title}
            </h2>
          </>
        )}
        <p className={step.speaksAsCompanion ? `${styles.body} ${styles.companionBody}` : styles.body}>{step.body}</p>

        <div className={styles.actions}>
          <button type="button" className={styles.skip} onClick={finish}>
            Pular tour
          </button>

          <div className={styles.navButtons}>
            {stepIndex > 0 && (
              <button type="button" className={styles.back} onClick={() => setStepIndex((i) => i - 1)}>
                Voltar
              </button>
            )}
            <button
              type="button"
              className={styles.next}
              onClick={() => (isLast ? finish() : setStepIndex((i) => i + 1))}
            >
              {isLast ? "Concluir" : "Próximo"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
