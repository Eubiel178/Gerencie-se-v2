import catFrameRects from "./cat-frames.json";
import { MascotCharacter } from "./types";

const CAT_FRAME_WIDTH = 110;
const CAT_FRAME_HEIGHT = 96;

function framesFor(name: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${name}_${index}`);
}

// Pack CC0 "Cat & Dog - Free Sprites" (opengameart.org/content/cat-dog-free-sprites,
// autor pzUH - ver public/mascot/pet/CREDITS.txt). Nenhum dos 8 estados do
// pack chama-se literalmente "sleep"/"happy"/"celebrate": o mapeamento
// abaixo usa a pose mais parecida de cada um (documentado no CREDITS).
const CAT: MascotCharacter = {
  id: "cat",
  label: "Gato",
  atlasImageUrl: "/mascot/pet/cat.png",
  frameWidth: CAT_FRAME_WIDTH,
  frameHeight: CAT_FRAME_HEIGHT,
  frameRects: catFrameRects,
  frameRate: 10,
  animations: {
    idle: framesFor("Idle", 10),
    walk: framesFor("Walk", 10),
    run: framesFor("Run", 8),
    happy: framesFor("Jump", 8),
    celebrate: framesFor("Jump", 8),
    sad: framesFor("Hurt", 10),
    sleep: framesFor("Idle", 10),
    interaction: framesFor("Slide", 10),
  },
};

/**
 * Registro de personagens disponíveis - trocar o mascote padrão (ou
 * adicionar dog/giraffe/rabbit no futuro) é só adicionar uma entrada
 * aqui, sem tocar em `engine/` nem no componente.
 */
export const MASCOT_CHARACTERS: Record<string, MascotCharacter> = {
  cat: CAT,
};

export const DEFAULT_MASCOT_CHARACTER_ID: string = "cat";
