/**
 * Divide UMA resposta de chat em "beats" conversacionais separados por
 * um marcador (ver instrução "MAIS DE UMA MENSAGEM" em `chat-prompt.ts`).
 * Extraído pra testes unitários - mesmo raciocínio de `companion-fallback.ts`
 * (sem "use server"/imports de servidor, testável direto com `node:test`).
 */

// Nunca aparece em texto normal, então dividir por ele nunca corta uma
// frase por acidente.
const BEAT_SEPARATOR = /\n?%%%\n?/;

// "três é raro, nunca mais que isso" - qualquer parte além da 3ª é
// descartada, não escondida em silêncio (nunca deveria acontecer com a
// instrução atual, mas um limite determinístico é mais seguro que
// confiar cegamente na geração).
const MAX_BEATS = 3;

export function splitIntoConversationBeats(text: string): string[] {
  const parts = text
    .split(BEAT_SEPARATOR)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return [text.trim()];
  return parts.slice(0, MAX_BEATS);
}
