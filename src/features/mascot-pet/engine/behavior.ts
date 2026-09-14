import { MascotEventType } from "../domain/events";
import { MascotStateName, MascotVector2 } from "../domain/types";

import {
  ARRIVAL_THRESHOLD,
  MascotBounds,
  clampToBounds,
  distance,
  isNearEdge,
  pickRandomTarget,
  stepToward,
} from "./movement";

type ReactiveState = "happy" | "sad" | "celebrate" | "interaction" | "sleep";

export const WALK_SPEED_PX_PER_S = 42;
const RUN_SPEED_PX_PER_S = 95;
const RUN_CHANCE = 0.3;

// Easing da VELOCIDADE (não da posição - `stepToward` continua recebendo
// só um número por chamada, sem precisar saber de easing) - sem isso,
// andar/correr começava e parava a velocidade constante, instantânea,
// dando a sensação de "deslizar" em vez de acelerar/desacelerar como um
// passo de verdade (achado relatado). `MOVE_EASE_MS`: rampa de entrada
// ao começar um trajeto novo OU depois de uma virada de direção de
// verdade na borda. `DECEL_DISTANCE_PX`: desacelera nos últimos X px
// antes de chegar no alvo, em vez de parar de repente.
const MOVE_EASE_MS = 220;
const DECEL_DISTANCE_PX = 40;
// Nunca deixa a velocidade cair a ponto do ciclo de passos (que escala
// junto, ver `runtime.ts`) quase congelar durante a rampa de entrada.
const MIN_SPEED_RATIO = 0.35;
// Chance de, ao "acordar" do idle, tirar uma soneca em vez de andar -
// só uma variação de personalidade, não uma detecção real de inatividade
// do usuário (essa não foi pedida - ver domain/events.ts).
const SLEEP_CHANCE = 0.12;

const IDLE_DURATION_RANGE_MS: [number, number] = [1500, 3500];
const SLEEP_DURATION_RANGE_MS: [number, number] = [3000, 5500];

const REACTIVE_DURATION_MS: Record<Exclude<ReactiveState, "sleep">, number> = {
  happy: 1800,
  celebrate: 2000,
  sad: 1600,
  interaction: 1200,
};

const EVENT_REACTION: Record<MascotEventType, ReactiveState> = {
  "task-completed": "celebrate",
  "goal-completed": "celebrate",
  "habit-completed": "happy",
  "routine-completed": "happy",
  "achievement-unlocked": "celebrate",
  "hydration-logged": "happy",
  "action-error": "sad",
  "user-idle": "sleep",
};

function randomBetween([min, max]: [number, number]): number {
  return min + Math.random() * (max - min);
}

export interface MascotBehaviorSnapshot {
  state: MascotStateName;
  position: MascotVector2;
  facingLeft: boolean;
  /** px/s de verdade neste tick (já com o easing aplicado) - só != 0
   * durante `walk`/`run`. O runtime usa isto pra escalar o fps do ciclo
   * de passos proporcionalmente à velocidade real, não um valor fixo por
   * estado (ver `runtime.ts`). */
  speed: number;
}

function smoothstep(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

/**
 * Estado interno do mascote: decide sozinho quando fica parado, pra onde
 * anda, e reage a cliques/eventos externos - sem saber nada de PixiJS
 * (nem de React). `tick` é chamado a cada frame pelo runtime; o runtime
 * só lê `snapshot()` depois pra posicionar o sprite e trocar a animação
 * quando o estado muda.
 */
export class MascotBehavior {
  private state: MascotStateName = "idle";
  private position: MascotVector2;
  private target: MascotVector2;
  private facingLeft = false;
  private stateTimerMs = randomBetween(IDLE_DURATION_RANGE_MS);
  private reducedMotion = false;
  private quietMode = false;
  private dragging = false;
  private moveElapsedMs = 0;
  private currentSpeed = 0;

  constructor(initialPosition: MascotVector2) {
    this.position = initialPosition;
    this.target = initialPosition;
  }

  snapshot(): MascotBehaviorSnapshot {
    return { state: this.state, position: this.position, facingLeft: this.facingLeft, speed: this.currentSpeed };
  }

  /** `prefers-reduced-motion`: nunca mais entra em walk/run sozinho (só
   * fica idle) - mas continua reagindo normalmente a clique/eventos,
   * já que essas são ações diretas, não passeio autônomo. */
  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  /** Modo Foco: presença reduzida de propósito (regra "no conflito entre
   * personalidade e concentração, concentração vence") - mesmo efeito de
   * `reducedMotion` (só fica idle, nunca sai andando sozinho), mas por
   * um motivo diferente (rota atual, não preferência de acessibilidade),
   * por isso é uma flag própria em vez de reaproveitar a mesma. */
  setQuietMode(quiet: boolean): void {
    this.quietMode = quiet;
  }

  /** Reação ao clique (regra 9) - sempre pode interromper o que estava
   * fazendo, inclusive outra reação em andamento. */
  handleClick(): void {
    this.enterReactive("interaction");
  }

  handleEvent(type: MascotEventType): void {
    this.enterReactive(EVENT_REACTION[type]);
  }

  /** Pega o bichinho pra arrastar - suspende o passeio autônomo até soltar. */
  startDrag(): void {
    this.dragging = true;
    this.state = "interaction";
  }

  /** Chamado a cada movimento do ponteiro enquanto arrasta - `position`
   * já vem em coordenadas de tela (mesmo espaço usado pelo resto do
   * motor), só precisa ficar dentro dos limites atuais. */
  updateDragPosition(position: MascotVector2, bounds: MascotBounds): void {
    this.position = clampToBounds(position, bounds);
  }

  /** Solta o bichinho - o passeio autônomo recomeça a partir de onde foi
   * largado (nunca "salta" de volta pra um alvo antigo). `wasClick=true`
   * (ponteiro nunca se moveu o bastante pra contar como arraste de
   * verdade - ver `runtime.ts`) toca a reação de clique completa (regra
   * 9) em vez de ir direto pro idle - sem isso, todo clique simples
   * (sem arrastar) entrava e saía de "interaction" no mesmo frame,
   * rápido demais pra a animação chegar a aparecer. */
  endDrag(wasClick: boolean = false): void {
    this.dragging = false;
    this.target = this.position;

    if (wasClick) {
      this.handleClick();
    } else {
      this.goIdle();
    }
  }

  tick(deltaMs: number, bounds: MascotBounds): void {
    if (this.dragging) return;

    switch (this.state) {
      case "idle": {
        this.stateTimerMs -= deltaMs;
        if (this.stateTimerMs <= 0) this.startNextMove(bounds);
        break;
      }
      case "walk":
      case "run": {
        this.advanceMovement(deltaMs, bounds);
        break;
      }
      default: {
        this.stateTimerMs -= deltaMs;
        if (this.stateTimerMs <= 0) this.goIdle();
        break;
      }
    }
  }

  /** Chamado no resize - mantém posição/alvo dentro da área visível nova. */
  clampToBounds(bounds: MascotBounds): void {
    this.position = clampToBounds(this.position, bounds);
    this.target = clampToBounds(this.target, bounds);
  }

  private enterReactive(state: ReactiveState): void {
    this.state = state;
    this.stateTimerMs = state === "sleep" ? randomBetween(SLEEP_DURATION_RANGE_MS) : REACTIVE_DURATION_MS[state];
  }

  private startNextMove(bounds: MascotBounds): void {
    if (this.reducedMotion || this.quietMode) {
      this.goIdle();
      return;
    }

    if (Math.random() < SLEEP_CHANCE) {
      this.enterReactive("sleep");
      return;
    }

    this.target = pickRandomTarget(bounds);
    this.facingLeft = this.target.x < this.position.x;
    this.state = Math.random() < RUN_CHANCE ? "run" : "walk";
    this.moveElapsedMs = 0;
  }

  private advanceMovement(deltaMs: number, bounds: MascotBounds): void {
    const targetSpeed = this.state === "run" ? RUN_SPEED_PX_PER_S : WALK_SPEED_PX_PER_S;
    this.moveElapsedMs += deltaMs;

    const remaining = distance(this.position, this.target);
    const easeIn = Math.max(MIN_SPEED_RATIO, smoothstep(this.moveElapsedMs / MOVE_EASE_MS));
    const easeOut = Math.max(MIN_SPEED_RATIO, Math.min(1, remaining / DECEL_DISTANCE_PX));
    this.currentSpeed = targetSpeed * Math.min(easeIn, easeOut);

    this.position = stepToward(this.position, this.target, this.currentSpeed, deltaMs);

    if (distance(this.position, this.target) <= ARRIVAL_THRESHOLD) {
      this.goIdle();
      return;
    }

    // Regra 6: perto da borda, muda de direção sem esperar chegar no
    // alvo (que pode nem existir mais se a janela encolheu). Só reseta a
    // rampa de aceleração quando a direção REALMENTE inverte (não em todo
    // re-alvo perto da borda que mantém o mesmo sentido geral) - assim um
    // giro de verdade desacelera/vira/acelera de novo, sem "teleporte".
    if (isNearEdge(this.position, bounds)) {
      const previousFacingLeft = this.facingLeft;
      this.target = pickRandomTarget(bounds);
      this.facingLeft = this.target.x < this.position.x;
      if (this.facingLeft !== previousFacingLeft) this.moveElapsedMs = 0;
    }
  }

  private goIdle(): void {
    this.state = "idle";
    this.currentSpeed = 0;
    this.stateTimerMs = randomBetween(IDLE_DURATION_RANGE_MS);
  }
}
