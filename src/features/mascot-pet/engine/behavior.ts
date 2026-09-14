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

const WALK_SPEED_PX_PER_S = 42;
const RUN_SPEED_PX_PER_S = 95;
const RUN_CHANCE = 0.3;
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
  private dragging = false;

  constructor(initialPosition: MascotVector2) {
    this.position = initialPosition;
    this.target = initialPosition;
  }

  snapshot(): MascotBehaviorSnapshot {
    return { state: this.state, position: this.position, facingLeft: this.facingLeft };
  }

  /** `prefers-reduced-motion`: nunca mais entra em walk/run sozinho (só
   * fica idle) - mas continua reagindo normalmente a clique/eventos,
   * já que essas são ações diretas, não passeio autônomo. */
  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
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
    if (this.reducedMotion) {
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
  }

  private advanceMovement(deltaMs: number, bounds: MascotBounds): void {
    const speed = this.state === "run" ? RUN_SPEED_PX_PER_S : WALK_SPEED_PX_PER_S;
    this.position = stepToward(this.position, this.target, speed, deltaMs);

    if (distance(this.position, this.target) <= ARRIVAL_THRESHOLD) {
      this.goIdle();
      return;
    }

    // Regra 6: perto da borda, muda de direção sem esperar chegar no
    // alvo (que pode nem existir mais se a janela encolheu).
    if (isNearEdge(this.position, bounds)) {
      this.target = pickRandomTarget(bounds);
      this.facingLeft = this.target.x < this.position.x;
    }
  }

  private goIdle(): void {
    this.state = "idle";
    this.stateTimerMs = randomBetween(IDLE_DURATION_RANGE_MS);
  }
}
