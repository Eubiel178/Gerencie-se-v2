// Reexports pra permitir `import { X } from "@/features/mascot-pet"` em
// vez de caminhos profundos.
export { MascotPet } from "./components/mascot-pet";
export { MascotPreview } from "./components/mascot-preview";
export * from "./domain/types";
export * from "./domain/events";
export * from "./domain/characters";
