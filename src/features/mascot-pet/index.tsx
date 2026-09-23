// Reexports pra permitir `import { X } from "@/features/mascot-pet"` em
// vez de caminhos profundos.
// `MascotPet` vem do wrapper `lazy.tsx` (code-split via `next/dynamic`,
// ver comentário lá) — não do componente direto, pra não incluir o
// PixiJS no bundle inicial de toda a área /home.
export { MascotPet } from "./components/mascot-pet/lazy";
export { MascotPreview } from "./components/mascot-preview";
export * from "./domain/types";
export * from "./domain/events";
export * from "./domain/characters";
