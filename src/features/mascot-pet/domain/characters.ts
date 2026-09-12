import catFrameRects from "./cat-frames.json";
import dogFrameRects from "./dog-frames.json";
import { MascotCharacter, MascotFrameRect, MascotStateName } from "./types";

const FRAME_WIDTH = 110;
const FRAME_HEIGHT = 96;

function framesFor(name: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${name}_${index}`);
}

// Pack CC0 "Cat & Dog - Free Sprites" (opengameart.org/content/cat-dog-free-sprites,
// autor pzUH - ver public/mascot/pet/CREDITS.txt). Nenhum dos 8 estados do
// pack chama-se literalmente "sleep"/"happy"/"celebrate": o mapeamento
// abaixo usa a pose mais parecida de cada um (documentado no CREDITS) -
// igual pro gato e pro cachorro, já que os dois vêm do mesmo pack com os
// mesmos 8 estados.
const SHARED_ANIMATIONS: Record<MascotStateName, string[]> = {
  idle: framesFor("Idle", 10),
  walk: framesFor("Walk", 10),
  run: framesFor("Run", 8),
  happy: framesFor("Jump", 8),
  celebrate: framesFor("Jump", 8),
  sad: framesFor("Hurt", 10),
  sleep: framesFor("Idle", 10),
  interaction: framesFor("Slide", 10),
};

function buildCharacter(
  id: string,
  label: string,
  frameRects: Record<string, MascotFrameRect>
): MascotCharacter {
  return {
    id,
    label,
    atlasImageUrl: `/mascot/pet/${id}.png`,
    frameWidth: FRAME_WIDTH,
    frameHeight: FRAME_HEIGHT,
    frameRects,
    frameRate: 10,
    animations: SHARED_ANIMATIONS,
  };
}

/**
 * Registro de personagens disponíveis pro mascote que anda pela tela -
 * adicionar um novo bicho (ex.: coelho/galinha) é só gerar um atlas
 * equivalente e adicionar uma entrada aqui, sem tocar em `engine/` nem
 * no componente. Ver `src/features/focus/domain/mascot-species.ts` pro
 * mapeamento entre espécie escolhida em Configurações e o id aqui.
 */
export const MASCOT_CHARACTERS: Record<string, MascotCharacter> = {
  cat: buildCharacter("cat", "Gato", catFrameRects),
  dog: buildCharacter("dog", "Cachorro", dogFrameRects),
};

export const DEFAULT_MASCOT_CHARACTER_ID: string = "cat";

// Espécie escolhida em Configurações (ver
// src/features/focus/domain/mascot-species.ts) -> personagem do mascote
// que anda pela tela. Só existe pra quem já tem um atlas pronto - "coelho"
// e "galinha" ainda não têm (ver CREDITS.txt), então caem em `null`
// (o mascote que anda pela tela simplesmente não aparece pra essas duas,
// em vez de mostrar o bicho errado).
const SPECIES_TO_CHARACTER_ID: Record<string, string> = {
  gato: "cat",
  cachorro: "dog",
};

export function characterIdForSpecies(species: string): string | null {
  return SPECIES_TO_CHARACTER_ID[species] ?? null;
}
