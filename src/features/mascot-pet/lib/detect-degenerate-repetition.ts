/**
 * Detecta um artefato de geração degenerada - o modelo repetindo a
 * mesma frase (tipicamente o começo da própria resposta, ex. o título
 * de uma tarefa) 3+ vezes seguidas, em vez de responder de verdade.
 * Achado real (teste ao vivo): "Correr contra o tempo Correr contra o
 * tempo Correr contra o..." - investigado o pipeline inteiro (contexto
 * gerado, histórico, renderização de Markdown, montagem da visão geral
 * de tarefas, composição de mensagem) e NENHUM ponto duplica texto -
 * cada construção de contexto insere o título de uma tarefa exatamente
 * uma vez. A causa real é a geração do próprio modelo, um modo de falha
 * conhecido de LLMs sob certas condições de decodificação, não um bug
 * determinístico neste código.
 *
 * Correção: nunca uma regra hardcoded pra esta frase específica -
 * uma salvaguarda GERAL (qualquer frase, qualquer tarefa) que trata
 * esse tipo de resposta como uma falha de geração (mesmo tratamento de
 * "sem resposta do provider"), nunca mostrando o texto degenerado pro
 * usuário.
 */

const MIN_PHRASE_LENGTH = 10;
const MAX_PHRASE_LENGTH = 80;
const MIN_REPEATS = 3;

export function hasDegenerateRepetition(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < MIN_PHRASE_LENGTH * MIN_REPEATS) return false;

  const upperBound = Math.min(MAX_PHRASE_LENGTH, Math.floor(trimmed.length / MIN_REPEATS));

  for (let phraseLength = upperBound; phraseLength >= MIN_PHRASE_LENGTH; phraseLength--) {
    const phrase = trimmed.slice(0, phraseLength);
    let occurrences = 0;
    let searchFrom = 0;

    while (true) {
      const idx = trimmed.indexOf(phrase, searchFrom);
      if (idx === -1) break;
      occurrences++;
      if (occurrences >= MIN_REPEATS) return true;
      searchFrom = idx + phraseLength;
    }
  }

  return false;
}
