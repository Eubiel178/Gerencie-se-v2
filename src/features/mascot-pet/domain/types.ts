export type MascotStateName =
  | "idle"
  | "walk"
  | "run"
  | "happy"
  | "sad"
  | "sleep"
  | "celebrate"
  | "interaction";

export interface MascotFrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MascotVector2 {
  x: number;
  y: number;
}

/**
 * Um personagem = uma imagem-atlas (fundo transparente) + o retângulo de
 * cada frame nomeado + quais frames, em ordem, compõem cada estado.
 * Trocar de bicho (gato/cachorro/girafa/coelho) é só escrever uma nova
 * definição aqui - nada no motor de movimento/comportamento/renderização
 * conhece "gato" especificamente (ver `engine/`).
 */
export interface MascotCharacter {
  id: string;
  label: string;
  atlasImageUrl: string;
  frameWidth: number;
  frameHeight: number;
  frameRects: Record<string, MascotFrameRect>;
  animations: Record<MascotStateName, string[]>;
  /** Frames por segundo ao tocar qualquer animação deste personagem. */
  frameRate: number;
}
