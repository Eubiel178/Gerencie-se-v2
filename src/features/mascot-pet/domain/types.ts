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
  /** Tamanho do frame NO ATLAS (o que `frameRects` recorta) - nunca
   * confundir com o tamanho de exibição na tela (ver `displayWidth`). */
  frameWidth: number;
  frameHeight: number;
  /** Tamanho de EXIBIÇÃO na tela, se diferente do frame nativo do atlas -
   * default: igual a `frameWidth`/`frameHeight` (ver `engine/runtime.ts`).
   * Existe pra personagens vindos de um atlas pixel art pequeno (ex.
   * 32x32) não aparecerem minúsculos perto do gato/cachorro (110x96) -
   * a imagem é ampliada, nunca o arquivo trocado. */
  displayWidth?: number;
  displayHeight?: number;
  /** true = escala "nearest" (sem suavizar) ao redimensionar - mantém o
   * pixel nítido em vez de borrado. Usar nos personagens em pixel art
   * (ex. urso/pássaro/sapo/raposa); o gato/cachorro (arte "glossy"
   * vetorial) não usam isso, já que ali suavizar é o efeito certo. */
  pixelArt?: boolean;
  /** Fração do PRÓPRIO frame que o bicho de verdade ocupa (0-1, medido
   * pixel a pixel - ver CREDITS.txt) - default 1 (assume que preenche o
   * frame quase todo, como gato/cachorro/urso/panda originais). Existe
   * só pros personagens com bastante folga transparente reservada no
   * frame (cães/gatos das raças novas, ~33%/38%): sem isso, um alvo de
   * tamanho aparente (`scaleForAvatar` no widget do assistente) mira no
   * FRAME inteiro, não no bicho - o resultado é um bicho minúsculo
   * demais pra enxergar dentro de um avatar pequeno (achado relatado:
   * "o icone do bicho fica tao pequeno que mal da pra ver"), mesmo já
   * compensado pra escala de exibição normal (`displayWidth`, que
   * resolve isso pro passeio pela tela, não pra caixas pequenas). */
  contentFillRatio?: number;
  frameRects: Record<string, MascotFrameRect>;
  animations: Record<MascotStateName, string[]>;
  /** Frames por segundo ao tocar qualquer animação deste personagem. */
  frameRate: number;
  /** URL do avatar (imagem redonda/perfil) deste mascote — usado no
   * Companion header e ao lado das mensagens. Derivado do frame Idle_0
   * do atlas (mesma arte), nunca desenho separado. */
  avatarImageUrl?: string;
}
