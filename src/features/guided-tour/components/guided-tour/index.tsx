"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { getFocusableElements } from "@/components/modal/get-focusable-elements";
import { dismissGuidedTourAction } from "../../actions";
import { buildGuidedTourSteps, GuidedTourStep } from "../../domain/steps";

import styles from "./guided-tour.module.css";

const MOBILE_BREAKPOINT_PX = 720;
const SPOTLIGHT_PADDING = 8;
const TOOLTIP_WIDTH = 320;
const VIEWPORT_MARGIN = 16;
const PLACEMENT_GAP = 14;

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

function tooltipPositionFor(rect: Rect | null): TooltipPosition {
  if (!rect) {
    // Passo "solto" (boas-vindas/fim) - centralizado na tela.
    return { top: window.innerHeight / 2 - 90, left: window.innerWidth / 2 - TOOLTIP_WIDTH / 2 };
  }

  const left = Math.min(
    Math.max(rect.left, VIEWPORT_MARGIN),
    window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN
  );

  // Sem medir a altura real do tooltip (ainda não renderizou) - decide o
  // lado pela posição vertical do alvo: mais na metade de baixo da tela,
  // o tooltip vai por CIMA (ancorado por `bottom`, que não depende de
  // saber a altura); mais em cima, vai por BAIXO (`top`).
  if (rect.top > window.innerHeight / 2) {
    return { bottom: window.innerHeight - rect.top + PLACEMENT_GAP, left };
  }
  return { top: rect.top + rect.height + PLACEMENT_GAP, left };
}

interface GuidedTourProps {
  active: boolean;
  mascotName: string;
}

// Quanto tempo esperar (tentando de novo a cada 150ms) até desistir de
// um alvo e pular o passo - bem mais longo pra passo que navega (a rota
// nova precisa terminar de buscar dado + renderizar) do que pra passo na
// mesma página (o elemento já deveria existir, só um resíduo de
// segurança contra alguma renderização ainda em andamento).
const TARGET_WAIT_MS_SAME_PAGE = 1000;
const TARGET_WAIT_MS_AFTER_NAVIGATION = 4000;
const TARGET_POLL_INTERVAL_MS = 150;

// Monta a lista de passos, filtrando o que já dá pra saber de antemão
// que não vai rolar: no mobile a navegação vira um menu por trás de um
// clique (sidebar não existe no DOM - ver `Header`), então o tour
// simplesmente não aparece ali - volta a oferecer numa próxima visita em
// tela maior, nunca marca como "visto" por isso. Passos cujo alvo é da
// MESMA página atual e não existe nela (ex.: usuário caiu direto numa
// rota inesperada) também são descartados aqui. Passos que navegam pra
// OUTRA rota (`step.path`) não dá pra checar ainda (a página nem
// carregou) - entram otimistas, e o próprio `GuidedTour` pula em tempo
// real se o alvo não aparecer a tempo depois de navegar. Só é chamada
// dentro do inicializador de `useState` abaixo - este componente só
// existe no cliente (ver `lazy.tsx`, `ssr: false`), então
// `document`/`window` sempre existem quando isto roda.
function computeInitialSteps(active: boolean, mascotName: string): GuidedTourStep[] | null {
  if (!active || window.innerWidth <= MOBILE_BREAKPOINT_PX) return null;

  const allSteps = buildGuidedTourSteps(mascotName);
  const currentPath = window.location.pathname;
  const available = allSteps.filter((step) => {
    if (!step.target) return true;
    if (step.path && step.path !== currentPath) return true;
    return !!document.querySelector(step.target);
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

export function GuidedTour({ active, mascotName }: GuidedTourProps) {
  const router = useRouter();
  const [steps, setSteps] = useState<GuidedTourStep[] | null>(() => computeInitialSteps(active, mascotName));
  const [stepIndex, setStepIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wasActiveRef = useRef(active);

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
  useEffect(() => {
    if (active && !wasActiveRef.current) {
      setSteps(computeInitialSteps(true, mascotName));
      setStepIndex(0);
      setFinished(false);
    }
    wasActiveRef.current = active;
  }, [active, mascotName]);

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
      const needsNavigation = !!step!.path && step!.path !== window.location.pathname;
      if (needsNavigation) router.push(step!.path!);

      if (!step!.target) {
        if (!cancelled) setRect(null);
        return;
      }

      const timeout = needsNavigation ? TARGET_WAIT_MS_AFTER_NAVIGATION : TARGET_WAIT_MS_SAME_PAGE;
      const el = await waitForTarget(step!.target, timeout);
      if (cancelled) return;

      if (!el) {
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
        className={styles.tooltip}
        style={{ width: TOOLTIP_WIDTH, top: position.top, bottom: position.bottom, left: position.left }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guided-tour-title"
        tabIndex={-1}
      >
        <p className={styles.step}>
          {stepIndex + 1} de {steps.length}
        </p>
        <h2 id="guided-tour-title" className={styles.title}>
          {step.title}
        </h2>
        <p className={styles.body}>{step.body}</p>

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
