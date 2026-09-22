import { AnimatedSprite, Application, Assets, Rectangle, Texture, Ticker } from "pixi.js";

import { emitMascotEvent, subscribeMascotEvent } from "../domain/events";
import { MascotCharacter, MascotStateName, MascotVector2 } from "../domain/types";

import { MascotBehavior, WALK_SPEED_PX_PER_S } from "./behavior";
import { watchUserIdle } from "./idle-watcher";
import { MascotBounds } from "./movement";
import { playMascotSound } from "./sound-effects";
import { computeViewportBounds, isMobileViewport } from "./viewport-bounds";

const MOBILE_SCALE = 0.72;
const STATIC_STATES = new Set<MascotStateName>(["idle", "sleep"]);

// Abaixo desta distância (em px, entre onde o ponteiro desceu e onde
// subiu), conta como clique/toque parado - não arraste de verdade. Sem
// essa tolerância, o tremor inevitável da mão/touch faria até um clique
// parado nunca soltar com `wasClick=true`.
const CLICK_TOLERANCE_PX = 6;

export interface MascotRuntimeHandles {
  /** Div pequeno (do tamanho do sprite) que hospeda o canvas e é de fato
   * movido pela tela via `transform` - só ele tem pointer-events:auto,
   * então clicar fora do bichinho nunca é capturado (regra 10). */
  wrapper: HTMLDivElement;
}

export interface MascotRuntimeOptions {
  /** Só bloqueia montagem duplicada de instâncias com a MESMA chave -
   * permite vários bichos simultâneos (ex.: vitrine de mascotes da
   * Landing Page, um `MascotRuntime` por personagem) desde que cada um
   * use uma chave diferente. Default `"global-pet"`: mesma chave de
   * sempre, preserva a proteção original (o mascote que anda pela tela
   * autenticada é montado uma única vez em `home/layout.tsx` - isso
   * continua valendo sem que quem chama precise saber desta opção). */
  instanceGroup?: string;
  /** Substitui `computeViewportBounds` (tela inteira, ciente da sidebar)
   * por uma área própria - usado pra confinar o passeio a um container
   * específico (ex.: a seção de mascotes da Landing Page) em vez da
   * janela inteira. As coordenadas devolvidas precisam estar no MESMO
   * espaço em que `wrapper` é posicionado (`position: fixed` = tela,
   * `position: absolute` num ancestral `position: relative` = local ao
   * container - ver `mascot-swarm` pro segundo caso). */
  boundsProvider?: (displayWidth: number, displayHeight: number) => MascotBounds;
  /** Chamado a cada tick com a posição atual (mesmo espaço de coordenadas
   * de `wrapper`) - usado pelo balão de fala do Companion (ver
   * `speech-bubble`) pra seguir o bichinho sem precisar de re-render do
   * React a cada frame (mesmo raciocínio de performance do resto do
   * motor: "roda inteiramente fora do React"). Quem chama decide o que
   * fazer com a posição (ex.: escrever `style.transform` num ref próprio
   * diretamente). */
  onPositionChange?: (position: MascotVector2) => void;
}

/** Uma instância ativa por CHAVE (não uma só pra sempre) - ver
 * `MascotRuntimeOptions.instanceGroup`. Pra quem nunca passa a opção
 * (o mascote único de `home/layout.tsx`), isso continua sendo, na
 * prática, uma única instância global: uma rede de segurança contra
 * montagem duplicada por engano, não o mecanismo principal de garantia. */
const activeRuntimesByGroup = new Map<string, MascotRuntime>();

export class MascotRuntime {
  private readonly character: MascotCharacter;
  private readonly wrapper: HTMLDivElement;
  private readonly behavior: MascotBehavior;
  private readonly reducedMotionQuery: MediaQueryList;
  private readonly instanceGroup: string;
  private readonly boundsProvider: (displayWidth: number, displayHeight: number) => MascotBounds;
  private readonly onPositionChange?: (position: MascotVector2) => void;

  private app: Application | null = null;
  private sprite: AnimatedSprite | null = null;
  private texturesByState: Partial<Record<MascotStateName, Texture[]>> = {};
  // fps "de repouso" do ciclo de sprite deste personagem - durante
  // walk/run, o fps real é escalado a partir daqui pela velocidade
  // atual (ver `handleTick`), em vez de tocar sempre neste valor fixo
  // (que fazia o ciclo de pernas "patinar" em `run`, mais rápido na
  // posição do que no desenho - achado relatado).
  private baseAnimationSpeed = 0;
  private bounds: MascotBounds;
  private mobile: boolean;
  private reducedMotion: boolean;
  private currentRenderedState: MascotStateName | null = null;
  private destroyed = false;
  private unsubscribeEvent: (() => void) | null = null;
  private unsubscribeIdleWatch: (() => void) | null = null;

  // Arraste: guarda onde o ponteiro começou e onde o bichinho estava
  // naquele instante, pra sempre calcular a nova posição por delta (nunca
  // "teleporta" pro ponto exato do cursor).
  private dragPointerId: number | null = null;
  private dragStartClient: MascotVector2 = { x: 0, y: 0 };
  private dragStartPosition: MascotVector2 = { x: 0, y: 0 };

  // Tamanho de exibição na tela - igual ao frame nativo do atlas, a menos
  // que o personagem declare `displayWidth`/`displayHeight` (ver
  // `MascotCharacter` em domain/types.ts pro raciocínio completo).
  private get displayWidth(): number {
    return this.character.displayWidth ?? this.character.frameWidth;
  }
  private get displayHeight(): number {
    return this.character.displayHeight ?? this.character.frameHeight;
  }

  constructor(handles: MascotRuntimeHandles, character: MascotCharacter, options: MascotRuntimeOptions = {}) {
    this.character = character;
    this.wrapper = handles.wrapper;
    this.instanceGroup = options.instanceGroup ?? "global-pet";
    this.boundsProvider = options.boundsProvider ?? computeViewportBounds;
    this.onPositionChange = options.onPositionChange;

    this.mobile = isMobileViewport();
    this.bounds = this.boundsProvider(this.displayWidth, this.displayHeight);

    const initialPosition: MascotVector2 = {
      x: (this.bounds.minX + this.bounds.maxX) / 2,
      y: (this.bounds.minY + this.bounds.maxY) / 2,
    };
    this.behavior = new MascotBehavior(initialPosition);

    this.reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reducedMotion = this.reducedMotionQuery.matches;
    this.behavior.setReducedMotion(this.reducedMotion);
  }

  async mount(): Promise<void> {
    const existing = activeRuntimesByGroup.get(this.instanceGroup);
    if (existing && existing !== this) {
      console.warn(
        `[mascot-pet] outra instância do grupo "${this.instanceGroup}" já está ativa; ignorando montagem duplicada.`
      );
      return;
    }
    activeRuntimesByGroup.set(this.instanceGroup, this);

    const app = new Application();
    await app.init({
      width: this.displayWidth,
      height: this.displayHeight,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });

    if (this.destroyed) {
      app.destroy(true, { children: true, texture: false, textureSource: false });
      return;
    }

    this.wrapper.style.width = `${this.displayWidth}px`;
    this.wrapper.style.height = `${this.displayHeight}px`;
    this.wrapper.appendChild(app.canvas);
    this.app = app;

    const baseTexture = await Assets.load<Texture>(this.character.atlasImageUrl);

    if (this.destroyed) {
      app.destroy(true, { children: true, texture: false, textureSource: false });
      this.app = null;
      return;
    }

    // Pixel art ampliado (ver `displayWidth`/`displayHeight` em
    // domain/types.ts) precisa de escala "nearest" pra não borrar - o
    // gato/cachorro (arte "glossy" vetorial) nunca marcam `pixelArt`, e
    // continuam com a suavização padrão do PixiJS.
    if (this.character.pixelArt) {
      baseTexture.source.scaleMode = "nearest";
    }

    this.texturesByState = this.buildTexturesByState(baseTexture);

    this.baseAnimationSpeed = this.character.frameRate / 60;

    const idleTextures = this.texturesByState.idle ?? [baseTexture];
    const sprite = new AnimatedSprite({
      textures: idleTextures,
      animationSpeed: this.baseAnimationSpeed,
      loop: true,
      autoPlay: !this.reducedMotion,
    });
    sprite.anchor.set(0.5, 0.5);
    sprite.x = this.displayWidth / 2;
    sprite.y = this.displayHeight / 2;

    this.sprite = sprite;
    this.currentRenderedState = "idle";
    app.stage.addChild(sprite);

    // Arraste/clique tratados via ponteiro nativo do DOM no `wrapper`
    // (não pelos eventos federados do Pixi) - as coordenadas já nascem no
    // mesmo espaço (tela) que o resto do motor usa, sem conversão.
    this.wrapper.style.cursor = "grab";
    this.wrapper.style.touchAction = "none";
    this.wrapper.addEventListener("pointerdown", this.handlePointerDown);
    this.wrapper.addEventListener("pointermove", this.handlePointerMove);
    this.wrapper.addEventListener("pointerup", this.handlePointerUp);
    this.wrapper.addEventListener("pointercancel", this.handlePointerUp);

    window.addEventListener("resize", this.handleResize);
    this.reducedMotionQuery.addEventListener("change", this.handleReducedMotionChange);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.unsubscribeEvent = subscribeMascotEvent((type) => this.behavior.handleEvent(type));
    this.unsubscribeIdleWatch = watchUserIdle(() => emitMascotEvent("user-idle"));

    app.ticker.add(this.handleTick);
    this.positionWrapper(this.behavior.snapshot().position);
  }

  /** Modo Foco (`/home/focus`): presença reduzida de propósito - o
   * bichinho para de sair andando sozinho pela tela enquanto a pessoa
   * está tentando se concentrar (continua reagindo a clique/eventos
   * normalmente, só não inicia passeio autônomo). Chamado pelo
   * componente React ao entrar/sair da rota, não uma preferência
   * persistida. */
  setQuietMode(quiet: boolean): void {
    this.behavior.setQuietMode(quiet, this.bounds);
  }

  destroy(): void {
    this.destroyed = true;
    if (activeRuntimesByGroup.get(this.instanceGroup) === this) {
      activeRuntimesByGroup.delete(this.instanceGroup);
    }

    window.removeEventListener("resize", this.handleResize);
    this.reducedMotionQuery.removeEventListener("change", this.handleReducedMotionChange);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.unsubscribeEvent?.();
    this.unsubscribeEvent = null;
    this.unsubscribeIdleWatch?.();
    this.unsubscribeIdleWatch = null;

    this.wrapper.removeEventListener("pointerdown", this.handlePointerDown);
    this.wrapper.removeEventListener("pointermove", this.handlePointerMove);
    this.wrapper.removeEventListener("pointerup", this.handlePointerUp);
    this.wrapper.removeEventListener("pointercancel", this.handlePointerUp);

    if (this.app) {
      this.app.ticker.remove(this.handleTick);
      // Não destrói texturas/textureSource: ficam no cache do `Assets`
      // loader e podem ser reaproveitadas se o componente remontar (ex.:
      // double-effect do modo estrito do React em desenvolvimento).
      this.app.destroy(true, { children: true, texture: false, textureSource: false });
      this.app = null;
    }
    this.sprite = null;
  }

  private buildTexturesByState(baseTexture: Texture): Partial<Record<MascotStateName, Texture[]>> {
    const frameCache = new Map<string, Texture>();

    const textureForFrame = (frameName: string): Texture | null => {
      const cached = frameCache.get(frameName);
      if (cached) return cached;

      const rect = this.character.frameRects[frameName];
      if (!rect) return null;

      const texture = new Texture({
        source: baseTexture.source,
        frame: new Rectangle(rect.x, rect.y, rect.w, rect.h),
      });
      frameCache.set(frameName, texture);
      return texture;
    };

    const result: Partial<Record<MascotStateName, Texture[]>> = {};
    for (const [state, frameNames] of Object.entries(this.character.animations) as [MascotStateName, string[]][]) {
      const textures = frameNames.map(textureForFrame).filter((texture): texture is Texture => texture !== null);
      if (textures.length > 0) result[state] = textures;
    }
    return result;
  }

  private handleTick = (ticker: Ticker): void => {
    if (!this.sprite) return;

    this.behavior.tick(ticker.deltaMS, this.bounds);
    const snapshot = this.behavior.snapshot();

    if (snapshot.state !== this.currentRenderedState) {
      const textures = this.texturesByState[snapshot.state];
      if (textures && textures.length > 0) {
        this.sprite.textures = textures;
        this.sprite.loop = true;
        if (this.reducedMotion && STATIC_STATES.has(snapshot.state)) {
          this.sprite.gotoAndStop(0);
        } else {
          this.sprite.gotoAndPlay(0);
        }
      }
      this.currentRenderedState = snapshot.state;
    }

    // Ciclo de passos sincronizado com a velocidade REAL deste tick
    // (já com o easing de `behavior.ts` aplicado) - uma razão sobre a
    // taxa base do próprio personagem, não um valor fixo, então funciona
    // igual pra todo mundo (inclusive quem tem só 4 frames de walk).
    if (snapshot.state === "walk" || snapshot.state === "run") {
      this.sprite.animationSpeed = this.baseAnimationSpeed * (snapshot.speed / WALK_SPEED_PX_PER_S);
    } else if (this.sprite.animationSpeed !== this.baseAnimationSpeed) {
      this.sprite.animationSpeed = this.baseAnimationSpeed;
    }

    const facingScale = snapshot.facingLeft ? -1 : 1;
    // Amplia do frame nativo do atlas pro tamanho de exibição (1 pros
    // personagens que não declaram `displayWidth`/`displayHeight` - ver
    // domain/types.ts), antes de aplicar a redução extra do mobile.
    const pixelScale = this.displayWidth / this.character.frameWidth;
    const baseScale = (this.mobile ? MOBILE_SCALE : 1) * pixelScale;
    this.sprite.scale.set(facingScale * baseScale, baseScale);

    this.positionWrapper(snapshot.position);
  };

  private handleResize = (): void => {
    this.mobile = isMobileViewport();
    this.bounds = this.boundsProvider(this.displayWidth, this.displayHeight);
    this.behavior.clampToBounds(this.bounds);
  };

  // Aba em segundo plano por muito tempo não deveria continuar gastando
  // CPU/bateria animando um bichinho que ninguém está vendo. `ticker.stop`
  // pausa o loop de frame inteiro (não só a animação do sprite); volta a
  // rodar sozinho quando a aba fica visível de novo.
  private handleVisibilityChange = (): void => {
    if (!this.app) return;

    if (document.hidden) {
      this.app.ticker.stop();
    } else {
      this.app.ticker.start();
    }
  };

  private handleReducedMotionChange = (event: MediaQueryListEvent): void => {
    this.reducedMotion = event.matches;
    this.behavior.setReducedMotion(this.reducedMotion);

    if (!this.sprite) return;

    if (this.reducedMotion) {
      const idleTextures = this.texturesByState.idle;
      if (idleTextures && idleTextures.length > 0) {
        this.sprite.textures = idleTextures;
        this.currentRenderedState = "idle";
      }
      this.sprite.gotoAndStop(0);
    } else {
      this.sprite.play();
    }
  };

  private positionWrapper(position: MascotVector2): void {
    this.wrapper.style.transform = `translate(${Math.round(position.x)}px, ${Math.round(position.y)}px)`;
    this.onPositionChange?.(position);
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (this.dragPointerId !== null) return;

    this.dragPointerId = event.pointerId;
    this.dragStartClient = { x: event.clientX, y: event.clientY };
    this.dragStartPosition = this.behavior.snapshot().position;
    this.wrapper.setPointerCapture(event.pointerId);
    this.wrapper.style.cursor = "grabbing";
    this.behavior.startDrag();
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (this.dragPointerId !== event.pointerId) return;

    const nextPosition: MascotVector2 = {
      x: this.dragStartPosition.x + (event.clientX - this.dragStartClient.x),
      y: this.dragStartPosition.y + (event.clientY - this.dragStartClient.y),
    };
    this.behavior.updateDragPosition(nextPosition, this.bounds);
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (this.dragPointerId !== event.pointerId) return;

    this.dragPointerId = null;
    if (this.wrapper.hasPointerCapture(event.pointerId)) {
      this.wrapper.releasePointerCapture(event.pointerId);
    }
    this.wrapper.style.cursor = "grab";

    const distanceMoved = Math.hypot(
      event.clientX - this.dragStartClient.x,
      event.clientY - this.dragStartClient.y
    );
    const wasClick = distanceMoved <= CLICK_TOLERANCE_PX;

    if (wasClick) playMascotSound(this.character.id);

    this.behavior.endDrag(wasClick);
  };
}
