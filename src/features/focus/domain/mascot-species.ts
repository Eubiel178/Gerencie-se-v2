// Catálogo de espécie + raça do mascote. Cada raça precisa ter um sprite
// correspondente em public/mascot/<especie>-<raca>.(png|gif) — ver
// public/mascot/CREDITS.txt pra origem/licença de cada imagem.
export const MASCOT_BREEDS = {
  gato: ["cinza", "laranja"],
  cachorro: ["vira-lata"],
  coelho: ["comum"],
  galinha: ["preta"],
} as const;

export type MascotSpecies = keyof typeof MASCOT_BREEDS;
export type MascotBreed = (typeof MASCOT_BREEDS)[MascotSpecies][number];

export const MASCOT_SPECIES_LIST = Object.keys(MASCOT_BREEDS) as MascotSpecies[];

export function breedsForSpecies(species: MascotSpecies): readonly string[] {
  return MASCOT_BREEDS[species];
}

export function isValidBreedForSpecies(species: MascotSpecies, breed: string): boolean {
  return (MASCOT_BREEDS[species] as readonly string[]).includes(breed);
}
