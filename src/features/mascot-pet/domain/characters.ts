import catFrameRects from "./cat-frames.json";
import dogFrameRects from "./dog-frames.json";
import birdFrameRects from "./bird-frames.json";
import bearFrameRects from "./bear-frames.json";
import foxFrameRects from "./fox-frames.json";
import pandaFrameRects from "./panda-frames.json";
import goldenFrameRects from "./golden-frames.json";
import akitaFrameRects from "./akita-frames.json";
import dogueAlemaoFrameRects from "./dogue-alemao-frames.json";
import gatoPretoFrameRects from "./gato-preto-frames.json";
import gatoAngoraFrameRects from "./gato-angora-frames.json";
import gatoTabbyFrameRects from "./gato-tabby-frames.json";
import gatoLaranjaFrameRects from "./gato-laranja-frames.json";
import gatoLilasFrameRects from "./gato-lilas-frames.json";
import gatoSiamesFrameRects from "./gato-siames-frames.json";
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

// Pack "PandaPack" (ToffeeCraft, itch.io - ver CREDITS.txt) só tem 2
// animações de verdade na versão grátis: "PandaEating" (o panda segura
// bambu alternando as pernas - lida como um ciclo de andar, mesmo sem
// ser um "Walk" dedicado) e "PandaWave" (aceno - usado como reação de
// clique, mesmo espírito do "Slide"/"Catch" dos outros personagens). Sem
// pose parada própria: "idle"/"sleep" reaproveitam o primeiro quadro do
// "andar" (mesmo raciocínio do urso, que também só tem uma pose parada).
// Atlas nativo 64x64 (maior que os outros pixel art, que são 32x32) -
// ver `panda: buildCharacter(...)` abaixo pro tamanho de frame próprio.
const PANDA_ANIMATIONS: Record<MascotStateName, string[]> = {
  idle: ["Idle_0"],
  walk: framesFor("Walk", 12),
  run: framesFor("Walk", 12),
  sad: [],
  sleep: ["Idle_0"],
  happy: [],
  celebrate: [],
  interaction: framesFor("Interaction", 12),
};

// Packs "Pet Dogs Pack" / "Pet Cats Pack" (autor "itch.io", CC0 - ver
// CREDITS.txt) - diferente dos outros personagens, estes têm um leque
// bem mais rico de animações reais (10 estados cada), mas nenhum se
// chama literalmente "happy"/"celebrate"/"sad"/"interaction" - o
// mapeamento abaixo usa a pose real mais parecida de cada um (mesmo
// raciocínio do gato/cachorro originais, documentado no CREDITS):
// "stretching" (espreguiçar, um gesto contente) -> happy; "bark"/"meow"
// (vocalização animada) -> celebrate; "itching"/"itch" (incômodo leve, a
// pose negativa mais próxima disponível) -> sad; "licking" (se limpar
// depois de receber atenção) -> interaction. Compartilhado pelas 3 raças
// de cada espécie - vêm do mesmo pack, com os mesmos nomes de estado.
const DOG_BREED_ANIMATIONS: Record<MascotStateName, string[]> = {
  idle: framesFor("Idle", 10),
  walk: framesFor("Walk", 8),
  run: framesFor("Run", 8),
  sleep: framesFor("Sleep", 1),
  happy: framesFor("Happy", 10),
  celebrate: framesFor("Celebrate", 3),
  sad: framesFor("Sad", 2),
  interaction: framesFor("Interaction", 4),
};

const CAT_BREED_ANIMATIONS: Record<MascotStateName, string[]> = {
  idle: framesFor("Idle", 10),
  walk: framesFor("Walk", 8),
  run: framesFor("Run", 8),
  sleep: framesFor("Sleep", 1),
  happy: framesFor("Happy", 13),
  celebrate: framesFor("Celebrate", 4),
  sad: framesFor("Sad", 2),
  interaction: framesFor("Interaction", 5),
};

// Diferente dos outros personagens pixel art (urso/raposa/panda), onde o
// bicho ocupa a maior parte do próprio frame, os packs "Pet Dogs
// Pack"/"Pet Cats Pack" deixam bastante espaço transparente ao redor
// (o frame reserva espaço pra pernas esticarem durante o ciclo de
// andar) - medido pixel a pixel: o cachorro real ocupa só ~33x22 de um
// frame 100x100 (33%/22%), o gato ~19x15 de um frame 50x50 (38%/30%),
// contra ~80%/97% do panda. Usar o mesmo `PIXEL_ART_DISPLAY_SIZE` de
// urso/raposa/panda (96) deixava esses dois MUITO menores que os outros
// na tela (achado relatado: "mascotes novo tao pequeno dms") - a escala
// abaixo compensa isso, alvo de ~85px de bicho visível na tela (perto do
// panda), calculado a partir da medição real, não um chute.
const DOG_BREED_DISPLAY_SIZE = 260;
const CAT_BREED_DISPLAY_SIZE = 220;

function dogBreedOptions() {
  return {
    frameWidth: 100,
    frameHeight: 100,
    displayWidth: DOG_BREED_DISPLAY_SIZE,
    displayHeight: DOG_BREED_DISPLAY_SIZE,
    pixelArt: true,
    frameRate: 8,
    animations: DOG_BREED_ANIMATIONS,
  };
}

// Cat-3 do "Pet Cats Pack" (usado como `gato-lilas` abaixo) é o único das
// 6 raças de gato sem uma animação "Itch" de verdade no pack de origem -
// reaproveita os frames de "Idle" pro estado "sad" (mesmo raciocínio já
// usado pro urso/panda faltando outras poses: uma aproximação honesta,
// não um frame novo inventado).
const CAT_BREED_ANIMATIONS_NO_ITCH: Record<MascotStateName, string[]> = {
  ...CAT_BREED_ANIMATIONS,
  sad: framesFor("Idle", 10),
};

function catBreedOptions(animations: Record<MascotStateName, string[]> = CAT_BREED_ANIMATIONS) {
  return {
    frameWidth: 50,
    frameHeight: 50,
    displayWidth: CAT_BREED_DISPLAY_SIZE,
    displayHeight: CAT_BREED_DISPLAY_SIZE,
    pixelArt: true,
    frameRate: 8,
    animations,
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
  // Rotulado "Shiba" (a raça), não "Cachorro" genérico - o desenho do
  // pack (orelhas triangulares grandes, pelagem laranja) é claramente um
  // Shiba Inu, uma raça famosa por parecer uma raposa. Deixar isso
  // explícito no rótulo evita a confusão de achar que é a raposa (o
  // personagem `fox` abaixo, de um pack totalmente diferente).
  dog: buildCharacter("dog", "Shiba", dogFrameRects),
  bird: buildCharacter("bird", "Pássaro", birdFrameRects, pixelArtOptions(BIRD_ANIMATIONS)),
  bear: buildCharacter("bear", "Urso", bearFrameRects, pixelArtOptions(BEAR_ANIMATIONS)),
  fox: buildCharacter("fox", "Raposa", foxFrameRects, pixelArtOptions(FOX_ANIMATIONS)),
  panda: buildCharacter("panda", "Panda", pandaFrameRects, {
    frameWidth: 64,
    frameHeight: 64,
    displayWidth: PIXEL_ART_DISPLAY_SIZE,
    displayHeight: PIXEL_ART_DISPLAY_SIZE,
    pixelArt: true,
    frameRate: 8,
    animations: PANDA_ANIMATIONS,
  }),
  golden: buildCharacter("golden", "Golden Retriever", goldenFrameRects, dogBreedOptions()),
  akita: buildCharacter("akita", "Akita", akitaFrameRects, dogBreedOptions()),
  "dogue-alemao": buildCharacter("dogue-alemao", "Dogue Alemão", dogueAlemaoFrameRects, dogBreedOptions()),
  "gato-preto": buildCharacter("gato-preto", "Gato Preto", gatoPretoFrameRects, catBreedOptions()),
  "gato-angora": buildCharacter("gato-angora", "Gato Angorá", gatoAngoraFrameRects, catBreedOptions()),
  "gato-tabby": buildCharacter("gato-tabby", "Gato Cinza", gatoTabbyFrameRects, catBreedOptions()),
  "gato-laranja": buildCharacter("gato-laranja", "Gato Laranja", gatoLaranjaFrameRects, catBreedOptions()),
  "gato-lilas": buildCharacter(
    "gato-lilas",
    "Gato Lilás",
    gatoLilasFrameRects,
    catBreedOptions(CAT_BREED_ANIMATIONS_NO_ITCH)
  ),
  "gato-siames": buildCharacter("gato-siames", "Gato Siamês", gatoSiamesFrameRects, catBreedOptions()),
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
  panda: "panda",
  golden: "golden",
  akita: "akita",
  "dogue-alemao": "dogue-alemao",
  "gato-preto": "gato-preto",
  "gato-angora": "gato-angora",
  "gato-tabby": "gato-tabby",
  "gato-laranja": "gato-laranja",
  "gato-lilas": "gato-lilas",
  "gato-siames": "gato-siames",
};

export function characterIdForSpecies(species: string): string | null {
  return SPECIES_TO_CHARACTER_ID[species] ?? null;
}
