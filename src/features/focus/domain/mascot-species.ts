// Espécies do mascote — cada uma precisa ter um personagem correspondente
// no mascote que anda pela tela (ver src/features/mascot-pet/domain/
// characters.ts e characterIdForSpecies). Não existe mais conceito de
// "raça": o visual é só o personagem PixiJS, um por espécie.
export const MASCOT_SPECIES_LIST = [
  "gato",
  "cachorro",
  "passaro",
  "urso",
  "raposa",
  "panda",
  "golden",
  "akita",
  "dogue-alemao",
  "gato-preto",
  "gato-angora",
  "gato-tabby",
  "gato-laranja",
  "gato-lilas",
  "gato-siames",
] as const;

export type MascotSpecies = (typeof MASCOT_SPECIES_LIST)[number];
