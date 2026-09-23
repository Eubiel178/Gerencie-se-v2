// Palavras genéricas demais pra dizer alguma coisa sobre o que
// realmente precisa ser feito — sempre em minúsculo, comparado depois
// de normalizar o título (trim + lowercase).
const VAGUE_TITLES = new Set([
  "trabalho",
  "trabalhar",
  "estudar",
  "estudo",
  "fazer",
  "organizar",
  "arrumar",
  "resolver",
  "revisar",
  "tarefa",
  "tarefas",
  "coisas",
  "afazeres",
  "pendencias",
  "pendências",
  "assuntos",
  "projeto",
]);

const MIN_MEANINGFUL_LENGTH = 4;

/** Detecta um título vago o bastante pra sugerir mais detalhe (nunca
 * bloqueia o envio — só um empurrãozinho gentil). Nunca "adivinha"
 * intenção, só sinaliza os dois casos óbvios: curto demais pra dizer
 * algo, ou uma palavra genérica sem contexto nenhum. */
export function isVagueTaskTitle(title: string): boolean {
  const normalized = title.trim().toLowerCase();

  if (!normalized) return false;
  if (normalized.length < MIN_MEANINGFUL_LENGTH) return true;

  return VAGUE_TITLES.has(normalized);
}
