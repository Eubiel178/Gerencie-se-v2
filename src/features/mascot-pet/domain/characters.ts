import catFrameRects from "./cat-frames.json";
import dogFrameRects from "./dog-frames.json";
import birdFrameRects from "./bird-frames.json";
import bearFrameRects from "./bear-frames.json";
import foxFrameRects from "./fox-frames.json";
import { MascotCharacter, MascotFrameRect, MascotStateName } from "./types";

const FRAME_WIDTH = 110;
const FRAME_HEIGHT = 96;

// Tamanho de exibição comum pros personagens vindos de atlas pixel art
// pequeno (32x32 nativo) - ampliado (nearest, sem borrar) pra ficar numa
// escala parecida com o gato/cachorro (110x96), em vez de aparecer
// minúsculo perto deles. Ver `pixelArt`/`displayWidth` em domain/types.ts.
const PIXEL_ART_DISPLAY_SIZE = 96;

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
  frameRects: Record<string, MascotFrameRect>,
  options?: {
    frameWidth?: number;
    frameHeight?: number;
    displayWidth?: number;
    displayHeight?: number;
    pixelArt?: boolean;
    frameRate?: number;
    animations?: Record<MascotStateName, string[]>;
  }
): MascotCharacter {
  return {
    id,
    label,
    atlasImageUrl: `/mascot/pet/${id}.png`,
    frameWidth: options?.frameWidth ?? FRAME_WIDTH,
    frameHeight: options?.frameHeight ?? FRAME_HEIGHT,
    displayWidth: options?.displayWidth,
    displayHeight: options?.displayHeight,
    pixelArt: options?.pixelArt,
    frameRects,
    frameRate: options?.frameRate ?? 10,
    animations: options?.animations ?? SHARED_ANIMATIONS,
  };
}

// Opções repetidas pelos 4 personagens em atlas pixel art pequeno (32x32
// nativo) - ver `PIXEL_ART_DISPLAY_SIZE` acima.
function pixelArtOptions(animations: Record<MascotStateName, string[]>) {
  return {
    frameWidth: 32,
    frameHeight: 32,
    displayWidth: PIXEL_ART_DISPLAY_SIZE,
    displayHeight: PIXEL_ART_DISPLAY_SIZE,
    pixelArt: true,
    frameRate: 8,
    animations,
  };
}

// Pack "Free Street Animal Pixel Art" (craftpix.net, ver CREDITS.txt) só
// tem Idle/Walk/Hurt pro pássaro - sem Run/Sleep/Happy/Celebrate/
// Interaction próprios. "run" reaproveita Walk (correr já é só andar mais
// rápido, a velocidade em si vem do motor, não da animação - ver
// `engine/behavior.ts`), "sleep" reaproveita Idle (mesmo raciocínio do
// gato/cachorro). O resto fica de propósito sem frames: o motor já lida
// bem com um estado sem animação própria (mantém a última tocando em vez
// de travar ou trocar pra algo errado - ver `buildTexturesByState` em
// `engine/runtime.ts`), e inventar uma pose que o pack não tem seria pior
// que isso.
const BIRD_ANIMATIONS: Record<MascotStateName, string[]> = {
  idle: framesFor("Idle", 4),
  walk: framesFor("Walk", 6),
  run: framesFor("Walk", 6),
  sad: framesFor("Hurt", 2),
  sleep: framesFor("Idle", 4),
  happy: [],
  celebrate: [],
  interaction: [],
};

// Pack "Little Bear" (CazBee, itch.io, CC0 - ver CREDITS.txt) só tem
// Idle (1 frame) e Walk (4 frames). "run" reaproveita Walk, "sleep"
// reaproveita Idle (mesmo raciocínio do pássaro acima) - o resto fica
// sem frames de propósito.
const BEAR_ANIMATIONS: Record<MascotStateName, string[]> = {
  idle: ["Idle_0"],
  walk: framesFor("Walk", 4),
  run: framesFor("Walk", 4),
  sad: [],
  sleep: ["Idle_0"],
  happy: [],
  celebrate: [],
  interaction: [],
};

// Pack "2D Pixel Art Fox Sprites" (Elthen, itch.io - ver CREDITS.txt) tem
// Idle/Movement/Catch/Damage/Sleep (Idle2 e Death do pack original não
// foram usados - ver CREDITS.txt). "run" reaproveita Movement (mesmo
// raciocínio de correr = andar mais rápido, não uma pose própria);
// "interaction" reaproveita Catch (pose de bote/pulo - a mais parecida
// com uma reação animada a um clique, mesmo espírito do "Slide" do
// gato/cachorro).
const FOX_ANIMATIONS: Record<MascotStateName, string[]> = {
  idle: framesFor("Idle", 5),
  walk: framesFor("Movement", 8),
  run: framesFor("Movement", 8),
  sad: framesFor("Damage", 5),
  sleep: framesFor("Sleep", 6),
  happy: [],
  celebrate: [],
  interaction: framesFor("Catch", 11),
};

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
  bird: buildCharacter("bird", "Pássaro", birdFrameRects, pixelArtOptions(BIRD_ANIMATIONS)),
  bear: buildCharacter("bear", "Urso", bearFrameRects, pixelArtOptions(BEAR_ANIMATIONS)),
  fox: buildCharacter("fox", "Raposa", foxFrameRects, pixelArtOptions(FOX_ANIMATIONS)),
};

export const DEFAULT_MASCOT_CHARACTER_ID: string = "cat";

// Espécie escolhida em Configurações (ver
// src/features/focus/domain/mascot-species.ts) -> personagem do mascote
// que anda pela tela. Só existe pra quem já tem um atlas pronto - outras
// espécies eventualmente cogitadas (ex. coelho, sapo) ainda não têm (ver
// CREDITS.txt), então cairiam em `null` (o mascote que anda pela tela
// simplesmente não aparece, em vez de mostrar o bicho errado). "sapo" foi
// removido de propósito: o pack de origem só tinha uma animação (Idle),
// então o bicho só deslizava pela tela sem nunca pular de verdade.
const SPECIES_TO_CHARACTER_ID: Record<string, string> = {
  gato: "cat",
  cachorro: "dog",
  passaro: "bird",
  urso: "bear",
  raposa: "fox",
};

export function characterIdForSpecies(species: string): string | null {
  return SPECIES_TO_CHARACTER_ID[species] ?? null;
}
