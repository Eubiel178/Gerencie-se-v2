import { MascotSpecies } from "./mascot-species";

// Compartilhado entre `MascotCard` (Dashboard) e o widget do assistente
// (avatar circular pequeno, onde o sprite pixel art real - via
// `MascotPreview` - nunca renderizava bem: ou minúsculo demais pra
// enxergar, ou cortado, dependendo do personagem - achado relatado
// várias vezes: "a foto do pet fica bugado"). Um emoji sempre renderiza
// nítido em qualquer tamanho, sem depender de atlas/frame/escala.
export const SPECIES_EMOJI: Record<MascotSpecies, string> = {
  gato: "🐱",
  cachorro: "🐶",
  passaro: "🐦",
  urso: "🐻",
  raposa: "🦊",
  panda: "🐼",
  golden: "🐕",
  akita: "🐕",
  "dogue-alemao": "🐕",
  "gato-preto": "🐈‍⬛",
  "gato-angora": "🐈",
  "gato-tabby": "🐈",
  "gato-laranja": "🐈",
  "gato-lilas": "🐈",
  "gato-siames": "🐈",
};
